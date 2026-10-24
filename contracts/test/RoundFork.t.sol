// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Round} from "../src/Round.sol";
import {IPriceFeed} from "../src/interfaces/IPriceFeed.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

/// Runs against live Mezo testnet state: forge test --match-contract RoundFork --fork-url matsnet
contract RoundForkTest is Test {
    address constant MUSD = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant PRICE_FEED = 0x86bCF0841622a5dAC14A313a15f96A95421b9366;

    function setUp() public {
        if (block.chainid != 31611) vm.skip(true);
    }

    function test_RealPriceFeedSizesCollateral() public {
        // The PriceFeed reads a Mezo oracle precompile that local forks don't have, so fetch the
        // live price with a real eth_call and pin it for this test.
        bytes memory res = vm.rpc(
            "eth_call",
            string.concat('[{"to":"', vm.toString(PRICE_FEED), '","data":"0x0fdb11cf"},"latest"]')
        );
        uint256 price = abi.decode(res, (uint256));
        vm.mockCall(PRICE_FEED, abi.encodeCall(IPriceFeed.fetchPrice, ()), abi.encode(price));
        assertGt(price, 1_000e18);
        assertLt(price, 10_000_000e18);

        Round round = new Round(IERC20(MUSD), IPriceFeed(PRICE_FEED));
        uint256 id = round.createCircle(100e18, 4, 5 minutes, 60, 15_000, 1_000);
        uint256 req = round.requiredCollateral(id);
        assertGe(req * price, 450e18 * 1e18);

        // real MUSD on matsnet supports EIP-2612 permit
        assertEq(IERC20Permit(MUSD).nonces(address(this)), 0);
        assertTrue(IERC20Permit(MUSD).DOMAIN_SEPARATOR() != bytes32(0));

        // native BTC behaves like ETH for msg.value and call{value:}
        address alice = makeAddr("alice");
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        round.join{value: req}(id);
        assertEq(address(round).balance, req);
        vm.prank(alice);
        round.withdrawCollateral(id); // leave before start → BTC returned via call{value:}
        assertEq(alice.balance, 1 ether);
    }
}
