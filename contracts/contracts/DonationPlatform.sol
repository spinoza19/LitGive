// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title  LitGive — Generic onchain donation marketplace
 * @notice Anyone can launch a campaign for any cause. Donors send native zkLTC.
 *
 *         Two modes:
 *         - KeepWhatYouRaise: beneficiary can withdraw at any time. No refunds.
 *           Cancellation just stops new donations.
 *         - AllOrNothing: beneficiary can ONLY withdraw if the goal is reached
 *           by the deadline. Otherwise, donors get full refunds (no fees).
 *
 *         Platform fee (bps) is taken at withdrawal time, not at donation time.
 *         This way, refunds in AllOrNothing return 100% of the donation.
 *
 * @dev    All amounts are in wei (zkLTC has 18 decimals like ETH).
 */
contract DonationPlatform is Ownable, ReentrancyGuard, Pausable {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    enum CampaignMode {
        KeepWhatYouRaise,
        AllOrNothing
    }

    enum CampaignStatus {
        Active,
        Cancelled,
        Successful, // AllOrNothing only
        Failed      // AllOrNothing only
    }

    struct Campaign {
        uint256 id;
        address payable beneficiary;
        string  title;
        string  description;
        string  imageURI;
        string  category;
        uint256 goal;
        uint256 deadline;     // unix seconds; 0 = no deadline (KWYR only)
        uint256 raised;       // gross total ever donated
        uint256 withdrawn;    // gross amount already withdrawn (counted against raised)
        uint256 createdAt;
        CampaignMode mode;
        CampaignStatus status;
    }

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    uint16 public platformFeeBps;            // e.g. 200 = 2%
    uint16 public constant MAX_FEE_BPS = 500; // 5%

    address payable public feeRecipient;
    uint256 public collectedFees;            // pending platform fees

    Campaign[] private _campaigns;

    // donor => campaignId => gross contributed (decremented on refund)
    mapping(address => mapping(uint256 => uint256)) public contributions;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event CampaignCreated(
        uint256 indexed id,
        address indexed beneficiary,
        string  title,
        string  category,
        uint256 goal,
        uint256 deadline,
        CampaignMode mode
    );

    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        string  message
    );

    event Withdrawn(
        uint256 indexed campaignId,
        address indexed beneficiary,
        uint256 grossAmount,
        uint256 fee,
        uint256 netAmount
    );

    event Refunded(uint256 indexed campaignId, address indexed donor, uint256 amount);
    event CampaignCancelled(uint256 indexed campaignId);
    event CampaignFinalized(uint256 indexed campaignId, CampaignStatus status);

    event PlatformFeeUpdated(uint16 newBps);
    event FeeRecipientUpdated(address newRecipient);
    event FeesWithdrawn(address recipient, uint256 amount);
    event MetadataUpdated(uint256 indexed campaignId);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error InvalidBeneficiary();
    error InvalidTitle();
    error InvalidDeadline();
    error InvalidMode();
    error CampaignNotActive();
    error CampaignNotFound();
    error ZeroAmount();
    error NotBeneficiary();
    error NothingToWithdraw();
    error RefundUnavailable();
    error NotADonor();
    error DeadlineNotPassed();
    error FeeTooHigh();
    error TransferFailed();
    error WithdrawNotYet();

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(address payable feeRecipient_, uint16 platformFeeBps_)
        Ownable(msg.sender)
    {
        if (feeRecipient_ == address(0)) revert InvalidBeneficiary();
        if (platformFeeBps_ > MAX_FEE_BPS) revert FeeTooHigh();
        feeRecipient = feeRecipient_;
        platformFeeBps = platformFeeBps_;
    }

    // ---------------------------------------------------------------------
    // Campaign management
    // ---------------------------------------------------------------------

    function createCampaign(
        address payable beneficiary,
        string calldata title,
        string calldata description,
        string calldata imageURI,
        string calldata category,
        uint256 goal,
        uint256 deadline,
        CampaignMode mode
    ) external whenNotPaused returns (uint256 id) {
        if (beneficiary == address(0)) revert InvalidBeneficiary();
        if (bytes(title).length == 0 || bytes(title).length > 200) revert InvalidTitle();
        if (deadline != 0 && deadline <= block.timestamp) revert InvalidDeadline();

        if (mode == CampaignMode.AllOrNothing) {
            if (goal == 0 || deadline == 0) revert InvalidMode();
        }

        id = _campaigns.length + 1;

        _campaigns.push(
            Campaign({
                id: id,
                beneficiary: beneficiary,
                title: title,
                description: description,
                imageURI: imageURI,
                category: category,
                goal: goal,
                deadline: deadline,
                raised: 0,
                withdrawn: 0,
                createdAt: block.timestamp,
                mode: mode,
                status: CampaignStatus.Active
            })
        );

        emit CampaignCreated(id, beneficiary, title, category, goal, deadline, mode);
    }

    /// @notice Donate native zkLTC with an optional public message.
    function donate(uint256 campaignId, string calldata message)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        if (msg.value == 0) revert ZeroAmount();

        Campaign storage c = _campaign(campaignId);
        if (c.status != CampaignStatus.Active) revert CampaignNotActive();
        if (c.deadline != 0 && block.timestamp > c.deadline) revert CampaignNotActive();

        c.raised += msg.value;
        contributions[msg.sender][campaignId] += msg.value;

        emit DonationReceived(campaignId, msg.sender, msg.value, message);
    }

    /// @notice Beneficiary withdraws available funds (minus platform fee).
    /// @dev    For AllOrNothing: only after deadline AND if goal met.
    function withdraw(uint256 campaignId) external nonReentrant {
        Campaign storage c = _campaign(campaignId);
        if (msg.sender != c.beneficiary) revert NotBeneficiary();

        if (c.mode == CampaignMode.AllOrNothing) {
            _finalizeIfNeeded(c);
            if (c.status != CampaignStatus.Successful) revert WithdrawNotYet();
        } else {
            // KWYR: cannot withdraw if cancelled (but raised funds remain
            // locked; in this design we consider KWYR cancellation final and
            // freeze remaining funds. To keep this clean, allow final
            // withdrawal even after cancel in KWYR mode):
            // -> we DO allow withdrawal post-cancel in KWYR mode.
        }

        uint256 grossAvailable = c.raised - c.withdrawn;
        if (grossAvailable == 0) revert NothingToWithdraw();

        uint256 fee = (grossAvailable * platformFeeBps) / 10_000;
        uint256 net = grossAvailable - fee;

        c.withdrawn += grossAvailable;
        if (fee > 0) collectedFees += fee;

        (bool ok, ) = c.beneficiary.call{value: net}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(campaignId, c.beneficiary, grossAvailable, fee, net);
    }

    /// @notice Donor pulls a full refund.
    /// @dev    Only available for AllOrNothing campaigns that Failed or were
    ///         Cancelled. KWYR campaigns never refund.
    function refund(uint256 campaignId) external nonReentrant {
        Campaign storage c = _campaign(campaignId);

        if (c.mode != CampaignMode.AllOrNothing) revert RefundUnavailable();

        _finalizeIfNeeded(c);

        if (c.status != CampaignStatus.Failed && c.status != CampaignStatus.Cancelled) {
            revert RefundUnavailable();
        }

        uint256 contributed = contributions[msg.sender][campaignId];
        if (contributed == 0) revert NotADonor();

        contributions[msg.sender][campaignId] = 0;

        // Reduce raised so accounting stays consistent.
        if (c.raised >= contributed) c.raised -= contributed;
        else c.raised = 0;

        (bool ok, ) = payable(msg.sender).call{value: contributed}("");
        if (!ok) revert TransferFailed();

        emit Refunded(campaignId, msg.sender, contributed);
    }

    /// @notice Beneficiary (or owner) cancels a campaign.
    function cancelCampaign(uint256 campaignId) external {
        Campaign storage c = _campaign(campaignId);
        if (msg.sender != c.beneficiary && msg.sender != owner()) revert NotBeneficiary();
        if (c.status != CampaignStatus.Active) revert CampaignNotActive();
        c.status = CampaignStatus.Cancelled;
        emit CampaignCancelled(campaignId);
    }

    /// @notice Beneficiary can edit description / image / category at any time.
    ///         Title, mode, goal and deadline are immutable to protect donors.
    function updateMetadata(
        uint256 campaignId,
        string calldata description,
        string calldata imageURI,
        string calldata category
    ) external {
        Campaign storage c = _campaign(campaignId);
        if (msg.sender != c.beneficiary) revert NotBeneficiary();
        c.description = description;
        c.imageURI = imageURI;
        c.category = category;
        emit MetadataUpdated(campaignId);
    }

    /// @notice Anyone can finalize an AllOrNothing campaign past its deadline.
    function finalize(uint256 campaignId) external {
        Campaign storage c = _campaign(campaignId);
        if (c.mode != CampaignMode.AllOrNothing) revert InvalidMode();
        if (c.deadline == 0 || block.timestamp <= c.deadline) revert DeadlineNotPassed();
        _finalizeIfNeeded(c);
    }

    function _finalizeIfNeeded(Campaign storage c) internal {
        if (c.status != CampaignStatus.Active) return;
        if (c.mode != CampaignMode.AllOrNothing) return;
        if (c.deadline == 0 || block.timestamp <= c.deadline) return;

        c.status = c.raised >= c.goal ? CampaignStatus.Successful : CampaignStatus.Failed;
        emit CampaignFinalized(c.id, c.status);
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setPlatformFeeBps(uint16 newBps) external onlyOwner {
        if (newBps > MAX_FEE_BPS) revert FeeTooHigh();
        platformFeeBps = newBps;
        emit PlatformFeeUpdated(newBps);
    }

    function setFeeRecipient(address payable newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert InvalidBeneficiary();
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    function withdrawFees() external nonReentrant {
        uint256 amount = collectedFees;
        if (amount == 0) revert NothingToWithdraw();
        collectedFees = 0;
        (bool ok, ) = feeRecipient.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit FeesWithdrawn(feeRecipient, amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function campaignCount() external view returns (uint256) {
        return _campaigns.length;
    }

    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        return _campaign(campaignId);
    }

    function listCampaigns(uint256 start, uint256 count)
        external
        view
        returns (Campaign[] memory page)
    {
        uint256 total = _campaigns.length;
        if (start >= total) return new Campaign[](0);
        uint256 end = start + count;
        if (end > total) end = total;
        page = new Campaign[](end - start);
        for (uint256 i = start; i < end; i++) {
            page[i - start] = _campaigns[i];
        }
    }

    function _campaign(uint256 id) internal view returns (Campaign storage) {
        if (id == 0 || id > _campaigns.length) revert CampaignNotFound();
        return _campaigns[id - 1];
    }

    /// @notice Stray native sends become platform fees.
    receive() external payable {
        collectedFees += msg.value;
    }
}
