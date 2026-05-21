// Seeds a globally-neutral set of demo campaigns + a couple of donations so
// the homepage shows a lively ecosystem on first load. No country- or
// religion-specific framing — pure generic donation marketplace.

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

  const existing = await c.campaignCount();
  if (existing > 0n) {
    console.log(`Already has ${existing} campaigns. Skipping seed.`);
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 3600;

  const campaigns = [
    {
      title: "Solar boreholes for drought-affected villages",
      description:
        "We are drilling six solar-pumped boreholes serving roughly 2,300 people across four villages experiencing prolonged drought. Funds are released only when the full goal is met, audited by our local water trust partner, and verified onchain.",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200",
      category: "charity",
      goalEth: "5",
      deadlineDays: 30,
      mode: 1, // AON
    },
    {
      title: "Open-source LitVM developer toolkit",
      description:
        "Funding 4 weeks of work on a Litecoin Foundation-aligned developer toolkit: contract templates, deploy scripts, Goldsky subgraphs, and Foundry starter kits. Every release is shipped under the MIT license. Disbursements are weekly and tied to public commits.",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      category: "public-good",
      goalEth: "2",
      deadlineDays: 21,
      mode: 1,
    },
    {
      title: "Animal shelter winter food drive",
      description:
        "Our shelter cares for around 120 stray cats and dogs each winter. Every 0.05 zkLTC feeds one animal for a week. 100% of donations are used for food, blankets, and basic veterinary care, with monthly photo and ledger updates for donors.",
      image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200",
      category: "charity",
      goalEth: "1.5",
      deadlineDays: 45,
      mode: 0, // KWYR
    },
    {
      title: "Indie documentary: \"Salt of the Sea\"",
      description:
        "A 22-minute documentary about a small fishing community on a vanishing coastline. Funding pays the crew (sound, color, edit) and music license. Backers are credited and receive a private screening link.",
      image: "https://images.unsplash.com/photo-1485095329183-d0797cdc5676?w=1200",
      category: "creator",
      goalEth: "3",
      deadlineDays: 21,
      mode: 1,
    },
    {
      title: "Coding scholarships for under-served students",
      description:
        "Sponsor five students from under-served communities through a six-month remote Solidity bootcamp. Includes laptop subsidy, mentorship, and guaranteed paid internship at LitVM ecosystem partners. Disbursements are monthly per student.",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
      category: "education",
      goalEth: "4",
      deadlineDays: 40,
      mode: 1,
    },
    {
      title: "Pediatric heart surgery — Aya, age 7",
      description:
        "Aya was born with a congenital aortic valve defect. The local hospital scheduled the procedure for early spring; her family is uninsured. Funds go directly to the hospital via itemized weekly withdrawals.",
      image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200",
      category: "personal",
      goalEth: "8",
      deadlineDays: 60,
      mode: 1,
    },
    {
      title: "Earthquake response — emergency kits for displaced families",
      description:
        "Emergency relief: tents, blankets, food, water purification tablets for displaced families in mountain villages. Coordinated with local civil protection. Withdrawals are released after each delivery batch is verified onchain.",
      image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200",
      category: "emergency",
      goalEth: "10",
      deadlineDays: 7,
      mode: 0,
    },
    {
      title: "Rebuilding a community library after wildfire",
      description:
        "Replacing 28,000 lost volumes and the children's reading room of a public library destroyed in a regional wildfire. This is the second of three planned funding rounds; the County matches every zkLTC raised, up to the goal.",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200",
      category: "education",
      goalEth: "9.5",
      deadlineDays: 45,
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
    console.log(`  #${i + 1} created — ${cmp.title.slice(0, 50)}…`);
  }

  // Sprinkle some donations across a few campaigns
  const donations = [
    { id: 1, amount: "0.01", message: "For the kids — let's go." },
    { id: 1, amount: "0.005", message: "Small but consistent." },
    { id: 3, amount: "0.02", message: "Love what you're doing." },
    { id: 5, amount: "0.015", message: "Investing in the next generation." },
    { id: 7, amount: "0.03", message: "Sending strength." },
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
