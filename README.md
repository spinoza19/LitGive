<p align="center">
  <img src="web/public/brand/mark-ink-512.png" alt="LitGive" width="120" />
</p>

<h1 align="center">LitGive</h1>

<p align="center">
  <em>Donations, transparent by default.</em>
</p>

<p align="center">
  <a href="https://litvm.com"><img src="https://img.shields.io/badge/Built%20on-LitVM-cdb380?style=flat-square" alt="Built on LitVM"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-1a1a22?style=flat-square" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Stack-Next.js%20%C2%B7%20Solidity-2c4070?style=flat-square" alt="Stack">
</p>

---

LitGive is an onchain donation marketplace built on **LitVM** — Litecoin's first ZK rollup. Anyone can launch a campaign for any cause: humanitarian relief, medical, public goods, education, creators, emergency response. Donors send native **zkLTC**. Every transaction settles in seconds and is verifiable on the public ledger.

No accounts. No middlemen. Sub-cent fees. The protocol takes 2% once, at withdrawal — donations move at 100%. Refunds are automatic if an All-or-Nothing campaign misses its goal.

## Live deployment

| | |
|---|---|
| **Network**  | LitVM LiteForge Testnet (Chain ID `4441`) |
| **Contract** | [`0xc2B5066E014C7FA38bb6ef52c80E53103281AA98`](https://liteforge.explorer.caldera.xyz/address/0xc2B5066E014C7FA38bb6ef52c80E53103281AA98) |
| **RPC**      | `https://liteforge.rpc.caldera.xyz/http` |
| **Faucet**   | <https://testnet.litvm.com> |
| **Explorer** | <https://liteforge.explorer.caldera.xyz> |
| **Frontend** | _Vercel deploy coming soon_ |

## Features

**Smart contract**
- Two campaign modes — *Keep what you raise* (withdraw any time) and *All or nothing* (Kickstarter-style, automatic refunds if the goal is missed)
- Public donation messages stored onchain
- Beneficiaries can edit narrative metadata (title / mode / goal / deadline are immutable)
- Auto-finalization, fee withdrawal, pause / unpause
- 2% protocol fee, hard-capped at 5% (`MAX_FEE_BPS`)
- ReentrancyGuard on every state-changing function

**Frontend**
- **Editorial design system** — *Hard Money Brutalism*: serif display + monospace numerals, halftone textures, dark and light themes
- Live activity feed pulled directly from `DonationReceived` events
- Search, category, status, and sort filters with mono-typed chips
- Goal progress as a 40-segment stack with milestone ticks
- Per-address Jazzicon avatars
- Live LitVM block height in the masthead
- Marquee ticker streaming real onchain donations
- Personal dashboard at `/me` (campaigns started + donations made)
- Editorial publishing experience at `/new` with a side-by-side donor preview
- Editable metadata at `/campaign/[id]/edit`
- Auto-generated favicon, Apple touch icon, and Open Graph share image

## Tech stack

| Layer        | Tech                                                                |
|--------------|---------------------------------------------------------------------|
| Contracts    | Solidity 0.8.24 · Hardhat · OpenZeppelin (Ownable / Pausable / ReentrancyGuard) |
| Network      | LitVM LiteForge Testnet                                             |
| Frontend     | Next.js 14 (App Router) · TypeScript · Tailwind                     |
| Web3         | wagmi v2 · viem v2 · RainbowKit v2                                  |
| Motion       | Framer Motion                                                       |
| Type         | Fraunces (display) · Inter Tight (body) · JetBrains Mono (numerals) |

## Repository layout

```
.
├── contracts/                      # Hardhat project
│   ├── contracts/
│   │   └── DonationPlatform.sol   # The whole protocol, single contract
│   ├── scripts/
│   │   ├── deploy.js              # Deploys + exports ABI to web/
│   │   └── seed.js                # Realistic demo campaigns + donations
│   └── test/
│       └── DonationPlatform.t.js  # 6 test cases
└── web/                            # Next.js frontend
    ├── public/
    │   └── brand/                 # SVGs + PNGs of the asterisk mark, OG, banner
    ├── scripts/
    │   └── export-brand.mjs       # Regenerates all brand assets from one source
    └── src/
        ├── app/                   # Routes (Browse, /new, /campaign/[id], /me, /edit)
        ├── components/            # Logo, CampaignCard, GoalProgress, etc.
        └── lib/                   # contract.ts, events.ts, display.ts, fonts.ts
```

## Quick start

### Prerequisites
- Node.js **20+**
- A wallet with testnet zkLTC (faucet: <https://testnet.litvm.com>)

### Contracts

```bash
cd contracts
npm install
cp .env.example .env                # then add your PRIVATE_KEY
npm run compile
npm test                            # 6 tests passing
npm run deploy:testnet              # deploys + exports ABI to web/src/lib/
node scripts/seed.js --network litvmTestnet   # optional: demo data
```

### Frontend

```bash
cd web
npm install
cp .env.local.example .env.local    # optional: WalletConnect projectId
npm run dev
```

Open <http://localhost:3000>.

### Brand assets

All marks (SVG + PNG, multiple sizes, light + dark) are generated from a single source:

```bash
cd web
npm run brand                       # outputs to web/public/brand/
```

## Smart contract API

```solidity
function createCampaign(
    address payable beneficiary,
    string  title,
    string  description,
    string  imageURI,
    string  category,
    uint256 goal,
    uint256 deadline,
    CampaignMode mode               // 0 = KeepWhatYouRaise, 1 = AllOrNothing
) external returns (uint256 id);

function donate(uint256 campaignId, string message) external payable;
function withdraw(uint256 campaignId) external;            // beneficiary
function refund(uint256 campaignId) external;              // donor (AON only)
function cancelCampaign(uint256 campaignId) external;      // beneficiary or owner
function updateMetadata(uint256, string, string, string) external;
function listCampaigns(uint256 start, uint256 count) external view returns (Campaign[] memory);
```

## Brand

The mark is a 19th-century editorial asterism — eight hairline arms with a pinned compass-pivot center, one arm in warm tan/gold. It's drawn from geometry, not raster: a single `Logo` React component drives the in-app mark, the favicon, the iOS icon, the OG share, the Twitter banner, and every static export. Tweak the geometry once in `web/scripts/export-brand.mjs`, run `npm run brand`, and every asset regenerates.

The visual system pairs **Fraunces** (serif, editorial display), **Inter Tight** (body), and **JetBrains Mono** (numerals + eyebrows) over warm newsprint cream and ink palettes, with halftone textures used sparingly. The vibe is closer to *Bloomberg Green* than *another DeFi dashboard*.

## Roadmap

### Pre-mainnet
- [ ] Professional smart-contract audit
- [ ] IPFS / Arweave for descriptions and images
- [ ] Goldsky subgraph for indexed reads
- [ ] Sybil-resistance integration (Passport-style)
- [ ] Multi-token donations (USDC / USDT via Arbitrum bridge)

### Post-launch
- [ ] Matching pools / quadratic funding (Gitcoin Allo-style)
- [ ] Recurring donations / subscription streams
- [ ] NGO verification flow + verified badges
- [ ] White-label / embeddable donation widgets
- [ ] Internationalization (Arabic with RTL, French, Spanish)

## Contributing

PRs welcome. Run `npm test` in `/contracts` before submitting. Style is Prettier defaults; types are strict.

## Author

Spinoza

## License

[MIT](LICENSE)

---

<sub>Built on LitVM. Endorsed by no one yet — let's change that.</sub>
