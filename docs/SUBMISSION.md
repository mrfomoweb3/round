# AKINDO submission — Round (Mezo Buildathon, Wave 1)

Copy each field into the AKINDO form. Replace the two `<…>` links once the repo and the hosted app are public.

**Name**
Round

**TL;DR**
Bitcoin-secured savings circles. Save in MUSD with your group; if someone takes the pot and stops paying, their locked BTC
covers it, valued by Mezo's PriceFeed.

**Tracks**
DeFi (primary) · Access & Distribution (secondary, Wave 2 Telegram bot)

**Chain**
Mezo testnet (chain ID 31611)

**Contract**
0xfaf2003837bb3db7ae63cf1a4a26d0dd9790254e
Explorer: https://explorer.test.mezo.org/address/0xfaf2003837bb3db7ae63cf1a4a26d0dd9790254e
Verified source (Sourcify, exact match): https://repo.sourcify.dev/31611/0xfaF2003837bB3Db7ae63CF1A4a26d0DD9790254e

**Links**
- Code: https://github.com/mrfomoweb3/round
- Live app: `<hosted app URL>`
- Demo video (68 s): https://youtu.be/Gs2QBHjdmqo (also in the repo: video/round-demo.mp4)

**How it works**
Members lock native BTC worth 150% of the most they could owe, sized live by Mezo's PriceFeed. Each round, everyone except
the recipient pays MUSD with one EIP-2612 permit signature, and anyone can settle once the round is due. If a member misses
a payment, the contract takes the missed amount plus a 10% penalty from their BTC: the recipient is paid in full, and the
penalty is shared with the honest members. No owner, no admin keys, no keeper.

**Mezo integration**
MUSD for every contribution and payout · MUSD permit (EIP-2612) for one-signature payments · native BTC as collateral ·
Mezo PriceFeed to size collateral and value defaults (read only when a default needs pricing).

**Why it extends MUSD utility**
Every circle creates recurring MUSD demand (each member needs MUSD every round) and keeps BTC locked on Mezo for the life of
the circle. It brings MUSD to communities that already save together (ajo, esusu, susu, tandas, chit funds, hui) but would
never use a lending protocol.

**Target users**
BTC holders who want dollar savings without selling, and communities that already run savings circles.

**Stack**
Solidity 0.8.24 · Foundry · OpenZeppelin 5.0.2 · Next.js 15 · wagmi · viem · RainbowKit · Tailwind

**Status**
Deployed and source-verified on Mezo testnet. 20 tests passing (unit, fuzz, invariant) plus a fork test against real
testnet state; 98.9% line coverage; Slither: 0 high, 0 medium. Full join → pay → settle → default-covered flow demonstrated
in the video.

**Future milestones**
Telegram bot (Track 2) · "borrow your contribution" (open a Mezo trove and join in one flow) · idle pots in the Stability
Pool · reputation that lowers required collateral · mainnet launch with low caps.

**Long-term signal**
The builder plans to run real circles with their own community after the buildathon.

**Credits to include with the video**
Music: "Soft Corporate" by MusicLFiles, CC BY 4.0.
