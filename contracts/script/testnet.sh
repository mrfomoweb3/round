#!/usr/bin/env bash
# Round on Mezo testnet (matsnet). Reads TESTNET-ONLY keys from contracts/.env.
#
#   ./script/testnet.sh deploy        deploy + verify Round, create the demo circle
#   ./script/testnet.sh borrow        open a MUSD trove from the deployer (1,800 MUSD minimum)
#   ./script/testnet.sh fund          send each demo member BTC for collateral/gas + MUSD to pay with
#   ./script/testnet.sh balances      show BTC / MUSD of every wallet
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

RPC=https://rpc.test.mezo.org
VERIFIER=https://api.explorer.test.mezo.org/api/
MUSD=0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
PRICE_FEED=0x86bCF0841622a5dAC14A313a15f96A95421b9366
BORROWER_OPS=0xCdF7028ceAB81fA0C6971208e83fa7872994beE5

addr() { cast wallet address --private-key "$1"; }
DEPLOYER=$(addr "$DEPLOYER_KEY")
MEMBER_KEYS=("$MEMBER1_KEY" "$MEMBER2_KEY" "$MEMBER3_KEY" "$MEMBER4_KEY")

case "${1:-}" in
  deploy)
    forge script script/Deploy.s.sol --rpc-url "$RPC" --broadcast \
      --verify --verifier blockscout --verifier-url "$VERIFIER"
    ROUND=$(python3 -c "import json;print(next(t['contractAddress'] for t in json.load(open('broadcast/Deploy.s.sol/31611/run-latest.json'))['transactions'] if t['contractName']=='Round'))")
    echo "ROUND=$ROUND" >> .env
    ROUND=$ROUND forge script script/CreateDemoCircle.s.sol --rpc-url "$RPC" --broadcast
    echo "Round: $ROUND"
    ;;

  borrow)
    # Debt 1,800 MUSD; lock enough BTC for ~200% collateral (MCR is 110%).
    DEBT=${DEBT:-1800000000000000000000}
    PRICE=$(cast call $PRICE_FEED "fetchPrice()(uint256)" --rpc-url $RPC | awk '{print $1}')
    COLL=${COLL:-$(python3 -c "print((2002*10**18 * 2 * 10**18) // $PRICE)")}
    echo "Opening trove: debt $DEBT, collateral $COLL wei BTC"
    cast send $BORROWER_OPS "openTrove(uint256,address,address)" "$DEBT" 0x0000000000000000000000000000000000000000 0x0000000000000000000000000000000000000000 \
      --value "$COLL" --private-key "$DEPLOYER_KEY" --rpc-url $RPC
    ;;

  fund)
    BTC_EACH=${BTC_EACH:-0.008ether}
    MUSD_EACH=${MUSD_EACH:-300000000000000000000}
    for k in "${MEMBER_KEYS[@]}"; do
      a=$(addr "$k")
      [ "$BTC_EACH" != "0" ] && cast send "$a" --value "$BTC_EACH" --private-key "$DEPLOYER_KEY" --rpc-url $RPC >/dev/null
      cast send $MUSD "transfer(address,uint256)" "$a" "$MUSD_EACH" --private-key "$DEPLOYER_KEY" --rpc-url $RPC >/dev/null
      echo "funded $a"
    done
    ;;

  balances)
    for k in "$DEPLOYER_KEY" "${MEMBER_KEYS[@]}"; do
      a=$(addr "$k")
      echo "$a  $(cast balance "$a" --ether --rpc-url $RPC) BTC  $(cast call $MUSD 'balanceOf(address)(uint256)' "$a" --rpc-url $RPC | awk '{print $1/1e18}') MUSD"
    done
    ;;

  *) sed -n '2,8p' "$0"; exit 1 ;;
esac
