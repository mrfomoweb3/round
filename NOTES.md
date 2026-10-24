# NOTES

## Mezo facts — verified on matsnet (2026-10-23)

| Item | Result |
|---|---|
| Chain ID via `https://rpc.test.mezo.org` | `31611` ✓ |
| `PriceFeed.fetchPrice()` at `0x86bC…9366` | returns ~`81472e18` (BTC/USD, 1e18 scale) ✓ |
| MUSD at `0x1189…c503` | `symbol=MUSD`, `name=Mezo USD`, `decimals=18` ✓ |
| MUSD EIP-712 domain | `name="Mezo USD"`, `version="1"`, chainId 31611 ✓ (needed for permit signing) |
| Native BTC `msg.value` / `call{value:}` | behaves like ETH (checked in `test/RoundFork.t.sol` on forked state) ✓ |

### Surprise: the PriceFeed can't be read in a local fork
`PriceFeed` (a proxy → `0xec42…29c1`) calls `latestRoundData()` on an oracle **precompile** at
`0x7b7c000000000000000000000000000000000015`. Precompiles don't exist in Foundry forks/anvil, so
`fetchPrice()` reverts with `NotActivated` there. On the real chain it works (`cast call` above).

How we adapted:
- Unit/fuzz/invariant tests use `MockPriceFeed`.
- `RoundFork.t.sol` fetches the live price with a real `eth_call` (`vm.rpc`) and `vm.mockCall`s it,
  then tests real MUSD + native BTC behaviour on forked state.
- Don't plan a demo on a local anvil fork — use matsnet directly.

## Design decisions (where BUILD.md left room)

1. **Next round starts when the previous one settles**, not on a fixed calendar
   (`roundEnd = roundStart + roundDuration`). A late settle never eats into the next round's window.
2. **Early settle**: `settle` works as soon as every active member has paid (good for the demo:
   round 1 settles right after the 3rd payment). If anyone is unpaid, it waits until
   `roundEnd + gracePeriod`. Late payments are accepted until the round is settled.
3. **A defaulter keeps being charged.** Once defaulted, a member can't pay any more; in every later
   round where they owe, their collateral is charged `owed × 1.1` (capped at what's left). This keeps
   the "no one lost money" promise — collateral is sized for all `n−1` obligations at 150%.
4. **A defaulter's own payout round is skipped**: nobody pays, nobody receives, it settles instantly.
   This is the "pot reduced accordingly" rule. Honest members end up net +1 contribution, funded by
   the defaulter.
5. **Penalty split**: the `take − owed` part is split equally among all non-defaulted members
   (recipient included). The recipient's share + rounding dust is pushed with their BTC; everyone
   else's share is credited to `pendingWithdrawals` and claimed with `claim()` — no loop of external
   calls in `settle`.
6. **BTC pushes use 50k gas**; if the push fails (contract recipient that rejects BTC) the amount is
   credited to `pendingWithdrawals` so one broken recipient can't freeze a circle.
7. **Leaving before start**: `withdrawCollateral` before the circle fills removes the member and
   returns their BTC (otherwise BTC would be stuck forever in a circle that never fills). Payout order
   of everyone else is preserved.
8. **Required collateral rounds up** (ceil), so locking exactly `requiredCollateral` is never 1 wei
   under the ratio.
9. Param limits: `size` 2–12, `collateralRatioBps ≥ 10000`, `penaltyBps ≤ 5000`, `contribution > 0`,
   `roundDuration > 0`.

## Tooling notes
- OpenZeppelin pinned to **v5.0.2**: later 5.x use `mcopy` (Cancun), which `evm_version = london` rejects.
- Slither: `uv tool install --python 3.12 slither-analyzer --with "cbor2<6"` (cbor2 6.x fails to build).
  Result: 0 high / 0 medium.

## Testnet deployment (2026-10-24)
- **Round:** `0xfaf2003837bb3db7ae63cf1a4a26d0dd9790254e` (deploy block 16329740), demo circle #1 created
  (4 people · 100 MUSD · 5-min rounds · 60s grace · 150% · 10% penalty). Required collateral read live: 0.005576 BTC.
- **Verification:** the Mezo Blockscout explorer accepted three verification submissions (forge/v1, v2 standard-input,
  v2 flattened) but never marked the contract verified, even though the on-chain bytecode matches the local build
  byte-for-byte once immutables are masked. **Sourcify verified it as an exact match**:
  https://repo.sourcify.dev/31611/0xfaF2003837bB3Db7ae63CF1A4a26d0DD9790254e
- **Test MUSD:** the faucet only gives BTC or MEZO. The deployer opened a trove via
  `BorrowerOperations.openTrove` (`0xCdF7…beE5`): 1,800 MUSD debt (+200 gas compensation, 0.1% fee) against
  0.045 BTC (~180%; MCR is 110%). Zero hints work. 300 MUSD sent to each demo member.
- Gas on matsnet is ~0.01 gwei; deploying Round cost about 0.0000000012 BTC.
