# LitGive

> Onchain donation marketplace built on **LitVM** — Litecoin's first ZK rollup.

Anyone can launch a campaign for any cause — charity, creator, public good,
personal, religious giving — and accept **zkLTC** with full on-chain
transparency. Sub-cent fees. No middlemen. Settlement in seconds.

[![Built on LitVM](https://img.shields.io/badge/Built%20on-LitVM-cdb380)](https://litvm.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Live demo

- **Frontend**: _coming soon (Vercel)_
- **Contract**: [`0x1Da9FB28c6F3B43f4d4487e833873Cf2856b809A`](https://liteforge.explorer.caldera.xyz/address/0x1Da9FB28c6F3B43f4d4487e833873Cf2856b809A) on LitVM LiteForge testnet (Chain ID `4441`)

## Features

- **Two campaign modes** — *Keep what you raise* (withdraw anytime) and *All or
  nothing* (Kickstarter-style: refunds if goal isn't met by the deadline)
- **Public donation messages** — donors leave a message that's stored onchain
- **Live activity feed** per campaign and globally (queries `DonationReceived`
  events directly from the chain)
- **Stats banner** — total raised, active campaigns, unique donors
- **Search, filter, sort** — by category, status, "ending soon", "most raised"
- **Personal dashboard** at `/me` — campaigns you've started + donations you've
  made
- **Editable metadata** — beneficiaries can update description, image, and
  category at any time (title / mode / goal / deadline are immutable to
  protect donors)
- **Donation success flow** — confetti, share buttons (X, Telegram, WhatsApp,
  copy link)
- **Skeleton loaders + empty states** — proper UX, not just spinners
- **Mobile-friendly** responsive layout, dark by default

## Tech stack

| Layer        | Tech                                                         |
|--------------|--------------------------------------------------------------|
| Contracts    | Solidity 0.8.24, Hardhat, OpenZeppelin (Ownable, Reentrancy, Pausable) |
| Network      | LitVM LiteForge Testnet (Chain ID 4441)                      |
| Frontend     | Next.js 14 (App Router), TypeScript                          |
| Web3         | wagmi v2, viem v2, RainbowKit v2                             |
| Styling      | TailwindCSS                                                  |

## Repository layout

```
.
├── contracts/          # Hardhat project — Solidity sources, tests, deploy
│   ├── contracts/
│   │   └── DonationPlatform.sol
│   ├── scripts/
│   │   ├── deploy.js
│   │   └── seed.js
│   └── test/
│       └── DonationPlatform.t.js
└── web/                # Next.js frontend
    └── src/
        ├── app/
        ├── components/
        └── lib/
```

## Quick start

### Prerequisites

- Node.js **20+**
- A wallet with some testnet zkLTC (faucet: <https://testnet.litvm.com>)

### Contracts

```bash
cd contracts
npm install
cp .env.example .env        # fill in PRIVATE_KEY (no 0x prefix is fine)
npm run compile
npm test                    # 6 tests
npm run deploy:testnet      # deploys + writes deployments.json + exports ABI to web/src/lib/
node scripts/seed.js --network litvmTestnet  # optional: seed demo campaigns
```

### Frontend

```bash
cd web
npm install
cp .env.local.example .env.local   # optional: WalletConnect projectId
npm run dev
```

Open <http://localhost:3000>.

## Network parameters

| Param         | Value                                  |
|---------------|----------------------------------------|
| Network       | LitVM LiteForge Testnet                |
| Chain ID      | 4441                                   |
| RPC URL       | https://liteforge.rpc.caldera.xyz/http |
| Currency      | zkLTC                                  |
| Explorer      | https://liteforge.explorer.caldera.xyz |
| Faucet        | https://testnet.litvm.com              |

## Smart contract overview

`DonationPlatform.sol` — single contract holding:

- **State**: campaigns array, per-donor contributions mapping, accrued
  platform fees
- **Roles**: `owner` (admin), `feeRecipient` (payout target), `beneficiary`
  per campaign
- **Fee model**: bps cap of 5% (`MAX_FEE_BPS = 500`), default 2%. Fee is
  accrued at *withdrawal* time so refunds always return 100% of the donation.
- **Modes**:
  - `KeepWhatYouRaise` — beneficiary can withdraw at any time
  - `AllOrNothing` — withdrawal only after deadline AND if goal met; otherwise
    donors can refund 100%
- **Safety**: `ReentrancyGuard` on every state-changing function, `Pausable`
  for emergencies, custom errors instead of revert strings

### Public functions (selected)

```solidity
function createCampaign(
  address payable beneficiary,
  string title,
  string description,
  string imageURI,
  string category,
  uint256 goal,
  uint256 deadline,
  CampaignMode mode
) external returns (uint256 id);

function donate(uint256 campaignId, string message) external payable;
function withdraw(uint256 campaignId) external;        // beneficiary
function refund(uint256 campaignId) external;          // donor (AON only)
function cancelCampaign(uint256 campaignId) external;  // beneficiary or owner
function updateMetadata(uint256 id, string desc, string image, string cat) external;
function listCampaigns(uint256 start, uint256 count) external view returns (Campaign[] memory);
```

## Roadmap

### Pre-mainnet

- [ ] Professional audit
- [ ] IPFS / Arweave for descriptions and images
- [ ] Goldsky subgraph for indexed reads
- [ ] Sybil-resistance integration (Passport-style)
- [ ] Multi-token support (USDC, USDT via Arbitrum bridge)

### Post-launch

- [ ] Matching pools / quadratic funding rounds (Gitcoin Allo-style)
- [ ] Recurring donations / subscription streams
- [ ] NGO verification flow + verified badges
- [ ] White-label / embeddable donation widgets
- [ ] Internationalization (Arabic with RTL, French, Spanish)
- [ ] Mobile-first redesign + PWA

## Contributing

PRs welcome. Please run `npm test` in `/contracts` before submitting.

## Author

- **Spinoza**

## License

[MIT](LICENSE) — see file for details.

---

Built with ❤️ on LitVM. Endorsed by no one yet — let's change that.
