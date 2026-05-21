// Seeds a realistic set of demo campaigns + a couple of donations so the
// homepage shows a lively ecosystem on first load.

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const file = path.join(__dirname, "..", "deployments.json");
  if (!fs.existsSync(file)) {
    throw new Error("deployments.json not found — run npm run deploy:testnet first");
  }
  const { address } = JSON.parse(fs.readFileSync(file, "utf8"));
  const [signer] = await hre.ethers.getSigners();

  console.log(`Seeding ${address} from ${signer.address}…`);
  const c = await hre.ethers.getContractAt("DonationPlatform", address, signer);

  // Skip if already seeded
  const existing = await c.campaignCount();
  if (existing > 0n) {
    console.log(`Already has ${existing} campaigns. Skipping seed.`);
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 3600;

  const campaigns = [
    {
      title: "Atlas school rebuild — winter relief",
      description:
        "After last winter's storms, our village school in the High Atlas " +
        "needs a new roof, heating, and books for 60 students. Funds go " +
        "directly to the project lead via timestamped withdrawals.",
      image: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=1200",
      category: "charity",
      goalEth: "5",
      deadlineDays: 30,
      mode: 0,
    },
    {
      title: "LitVM open-source dev toolkit",
      description:
        "Funding 4 weeks of work on a Litecoin Foundation-aligned developer " +
        "toolkit: contract templates, deploy scripts, Goldsky subgraphs, and " +
        "Foundry starter kits. Releases under MIT.",
      image: "",
      category: "public-good",
      goalEth: "2",
      deadlineDays: 14,
      mode: 1,
    },
    {
      title: "Animal shelter winter food drive",
      description:
        "Our shelter takes in ~120 stray cats and dogs each winter. Every " +
        "0.05 zkLTC feeds one animal for a week. 100% of donations are used " +
        "for food, blankets, and basic vet care.",
      image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200",
      category: "charity",
      goalEth: "1.5",
      deadlineDays: 45,
      mode: 0,
    },
    {
      title: "Indie film: \"Salt of the Sea\"",
      description:
        "A 22-minute documentary about Atlantic fishermen of Essaouira. " +
        "Funding pays the crew (sound, color, edit) and music license. " +
        "Backers get credited and receive a private screening link.",
      image: "https://images.unsplash.com/photo-1485095329183-d0797cdc5676?w=1200",
      category: "creator",
      goalEth: "3",
      deadlineDays: 21,
      mode: 1,
    },
    {
      title: "Ramadan iftar meals — orphanage",
      description:
        "Sponsor nutritious iftar meals for 80 orphans during Ramadan. " +
        "0.02 zkLTC = one meal. Daily updates and on-the-ground photos " +
        "shared throughout the month.",
      image: "https://images.unsplash.com/photo-1605351792036-e6dee21b8aaf?w=1200",
      category: "religious",
      goalEth: "2",
      deadlineDays: 25,
      mode: 0,
    },
    {
      title: "Medical fund — Yara's surgery",
      description:
        "Yara, 7, needs a corrective heart surgery not covered by local " +
        "insurance. Her family has raised half from neighbors. We're hoping " +
        "the global crypto community can close the gap.",
      image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200",
      category: "personal",
      goalEth: "8",
      deadlineDays: 60,
      mode: 1,
    },
    {
      title: "Earthquake response — Marrakesh region",
      description:
        "Emergency relief: tents, blankets, food, water purification tablets " +
        "for displaced families in mountain villages. Coordinated with local " +
        "civil protection. Withdrawals after each delivery batch.",
      image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200",
      category: "emergency",
      goalEth: "10",
      deadlineDays: 7,
      mode: 0,
    },
    {
      title: "Coding bootcamp scholarships — Africa",
      description:
        "Sponsor 5 students from underserved communities through a 6-month " +
        "remote Solidity bootcamp. Includes laptop subsidy, mentorship, and " +
        "guaranteed paid internship at LitVM ecosystem partners.",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
      category: "public-good",
      goalEth: "4",
      deadlineDays: 40,
      mode: 1,
    },
  ];

  for (let i = 0; i < campaigns.length; i++) {
    const cmp = campaigns[i];
    const tx = await c.createCampaign(
      signer.address,
      cmp.title,
      cmp.description,
      cmp.image,
      cmp.category,
      hre.ethers.parseEther(cmp.goalEth),
      now + cmp.deadlineDays * day,
      cmp.mode
    );
    await tx.wait();
    console.log(`  #${i + 1} created — ${cmp.title.slice(0, 40)}…`);
  }

  // Sprinkle some donations on a couple of campaigns
  const donations = [
    { id: 1, amount: "0.01", message: "For the kids — let's go" },
    { id: 1, amount: "0.005", message: "Small but consistent" },
    { id: 3, amount: "0.02", message: "Love what you're doing" },
    { id: 5, amount: "0.015", message: "Ramadan Mubarak" },
    { id: 7, amount: "0.03", message: "Sending strength" },
  ];

  for (const d of donations) {
    const tx = await c.donate(d.id, d.message, {
      value: hre.ethers.parseEther(d.amount),
    });
    await tx.wait();
    console.log(`  donated ${d.amount} zkLTC to #${d.id}`);
  }

  const count = await c.campaignCount();
  console.log(`\nDone. campaignCount = ${count.toString()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
