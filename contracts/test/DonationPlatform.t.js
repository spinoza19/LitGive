const { expect } = require("chai");
const { ethers } = require("hardhat");

const Mode = { KeepWhatYouRaise: 0, AllOrNothing: 1 };
const Status = { Active: 0, Cancelled: 1, Successful: 2, Failed: 3 };

async function deployFixture() {
  const [owner, alice, bob, fee] = await ethers.getSigners();
  const F = await ethers.getContractFactory("DonationPlatform");
  const c = await F.deploy(fee.address, 200); // 2% fee
  await c.waitForDeployment();
  return { c, owner, alice, bob, fee };
}

describe("DonationPlatform", () => {
  it("creates campaigns and accepts donations", async () => {
    const { c, alice, bob } = await deployFixture();

    await c.connect(alice).createCampaign(
      alice.address, "Save the bees", "desc", "img", "charity",
      0, 0, Mode.KeepWhatYouRaise
    );

    expect(await c.campaignCount()).to.equal(1n);

    await expect(c.connect(bob).donate(1, "good luck", { value: ethers.parseEther("1") }))
      .to.emit(c, "DonationReceived")
      .withArgs(1n, bob.address, ethers.parseEther("1"), "good luck");

    const camp = await c.getCampaign(1);
    expect(camp.raised).to.equal(ethers.parseEther("1"));
  });

  it("KWYR: beneficiary withdraws net of platform fee", async () => {
    const { c, alice, bob, fee } = await deployFixture();

    await c.connect(alice).createCampaign(
      alice.address, "T", "", "", "x", 0, 0, Mode.KeepWhatYouRaise
    );
    await c.connect(bob).donate(1, "", { value: ethers.parseEther("10") });

    const aliceBefore = await ethers.provider.getBalance(alice.address);
    const tx = await c.connect(alice).withdraw(1);
    const r = await tx.wait();
    const gas = r.gasUsed * r.gasPrice;
    const aliceAfter = await ethers.provider.getBalance(alice.address);

    // 2% of 10 = 0.2; net = 9.8
    expect(aliceAfter - aliceBefore + gas).to.equal(ethers.parseEther("9.8"));
    expect(await c.collectedFees()).to.equal(ethers.parseEther("0.2"));

    // Owner withdraws fees to feeRecipient
    const feeBefore = await ethers.provider.getBalance(fee.address);
    await c.withdrawFees();
    const feeAfter = await ethers.provider.getBalance(fee.address);
    expect(feeAfter - feeBefore).to.equal(ethers.parseEther("0.2"));
    expect(await c.collectedFees()).to.equal(0n);
  });

  it("AllOrNothing: refunds full amount when goal not met", async () => {
    const { c, alice, bob } = await deployFixture();

    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const deadline = now + 3600;

    await c.connect(alice).createCampaign(
      alice.address, "AON", "", "", "x",
      ethers.parseEther("100"), deadline, Mode.AllOrNothing
    );

    await c.connect(bob).donate(1, "", { value: ethers.parseEther("5") });

    // Move past deadline
    await ethers.provider.send("evm_increaseTime", [3700]);
    await ethers.provider.send("evm_mine");

    // Beneficiary cannot withdraw
    await expect(c.connect(alice).withdraw(1)).to.be.revertedWithCustomError(c, "WithdrawNotYet");

    // Donor refunds full amount
    const before = await ethers.provider.getBalance(bob.address);
    const tx = await c.connect(bob).refund(1);
    const r = await tx.wait();
    const gas = r.gasUsed * r.gasPrice;
    const after = await ethers.provider.getBalance(bob.address);
    expect(after - before + gas).to.equal(ethers.parseEther("5"));
  });

  it("AllOrNothing: beneficiary withdraws when goal met", async () => {
    const { c, alice, bob } = await deployFixture();
    const now = (await ethers.provider.getBlock("latest")).timestamp;

    await c.connect(alice).createCampaign(
      alice.address, "AON OK", "", "", "x",
      ethers.parseEther("1"), now + 100, Mode.AllOrNothing
    );

    await c.connect(bob).donate(1, "", { value: ethers.parseEther("1") });

    await ethers.provider.send("evm_increaseTime", [200]);
    await ethers.provider.send("evm_mine");

    await expect(c.connect(alice).withdraw(1))
      .to.emit(c, "CampaignFinalized")
      .withArgs(1n, Status.Successful);
  });

  it("rejects bad fee and zero donations", async () => {
    const { c, alice, bob } = await deployFixture();
    await expect(c.setPlatformFeeBps(1000)).to.be.revertedWithCustomError(c, "FeeTooHigh");

    await c.connect(alice).createCampaign(
      alice.address, "T", "", "", "x", 0, 0, Mode.KeepWhatYouRaise
    );
    await expect(c.connect(bob).donate(1, "")).to.be.revertedWithCustomError(c, "ZeroAmount");
  });

  it("pagination works", async () => {
    const { c, alice } = await deployFixture();
    for (let i = 0; i < 5; i++) {
      await c.connect(alice).createCampaign(
        alice.address, `T${i}`, "", "", "x", 0, 0, Mode.KeepWhatYouRaise
      );
    }
    const page = await c.listCampaigns(2, 2);
    expect(page.length).to.equal(2);
    expect(page[0].id).to.equal(3n);
    expect(page[1].id).to.equal(4n);
  });
});
