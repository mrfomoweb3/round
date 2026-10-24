// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Round} from "../src/Round.sol";
import {IPriceFeed} from "../src/interfaces/IPriceFeed.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockPriceFeed} from "./mocks/MockPriceFeed.sol";
import {MockMUSD} from "./mocks/MockMUSD.sol";

contract RoundFuzzTest is Test {
    Round round;
    MockMUSD musd;
    MockPriceFeed feed;
    address[] users;

    function setUp() public {
        musd = new MockMUSD();
        feed = new MockPriceFeed(80_000e18);
        round = new Round(IERC20(address(musd)), IPriceFeed(address(feed)));
        for (uint256 i; i < 12; ++i) {
            address a = makeAddr(string(abi.encodePacked("m", vm.toString(i))));
            users.push(a);
            vm.deal(a, 1_000_000 ether);
            vm.prank(a);
            musd.approve(address(round), type(uint256).max);
        }
    }

    /// Full circle with random size, contribution, price path and default pattern.
    /// Checks: payouts add up, no MUSD left behind, all BTC ends up withdrawable or claimable.
    function testFuzz_FullCircle(uint8 size, uint96 contribution, uint256 price, uint256 skipMask, uint256 priceSeed)
        public
    {
        size = uint8(bound(size, 2, 12));
        contribution = uint96(bound(contribution, 1e18, 1_000_000e18));
        price = bound(price, 1_000e18, 1_000_000e18);
        feed.setPrice(price);

        uint256 id = round.createCircle(contribution, size, 1 hours, 60, 15_000, 1_000);
        uint256 req = round.requiredCollateral(id);
        uint256 totalLocked;
        for (uint256 i; i < size; ++i) {
            musd.mint(users[i], uint256(contribution) * size);
            vm.prank(users[i]);
            round.join{value: req}(id);
            totalLocked += req;
        }
        assertEq(address(round).balance, totalLocked);

        uint256 musdIn;
        uint256 musdOut;
        for (uint8 r = 1; r <= size; ++r) {
            // random price move between 30% and 200% of the start price
            feed.setPrice(bound(uint256(keccak256(abi.encode(priceSeed, r))), price * 3 / 10, price * 2));
            address rec = users[r - 1];
            for (uint256 i; i < size; ++i) {
                address a = users[i];
                (,, bool d,) = round.memberOf(id, a);
                (,, bool recDefaulted,) = round.memberOf(id, rec);
                if (a == rec || d || recDefaulted) continue;
                if ((skipMask >> ((r * 12 + i) % 256)) & 1 == 1) continue;
                vm.prank(a);
                round.contribute(id);
                musdIn += contribution;
            }
            uint256 before = musd.balanceOf(rec);
            vm.warp(block.timestamp + 1 hours + 60);
            round.settle(id);
            musdOut += musd.balanceOf(rec) - before;
            assertEq(musd.balanceOf(address(round)), musdIn - musdOut);
        }

        (,,,,,,,,,, bool completed) = round.circles(id);
        assertTrue(completed);
        assertEq(musd.balanceOf(address(round)), 0);

        for (uint256 i; i < size; ++i) {
            (uint128 col,,,) = round.memberOf(id, users[i]);
            if (col > 0) {
                vm.prank(users[i]);
                round.withdrawCollateral(id);
            }
            if (round.pendingWithdrawals(users[i]) > 0) {
                vm.prank(users[i]);
                round.claim();
            }
        }
        assertEq(address(round).balance, 0);
    }

    function testFuzz_RequiredCollateral(uint8 size, uint96 contribution, uint256 price) public {
        size = uint8(bound(size, 2, 12));
        contribution = uint96(bound(contribution, 1, type(uint96).max));
        price = bound(price, 1e18, 10_000_000e18);
        feed.setPrice(price);
        uint256 id = round.createCircle(contribution, size, 1 hours, 60, 15_000, 1_000);
        uint256 req = round.requiredCollateral(id);
        // BTC value of the requirement covers 150% of the max exposure, and 1 wei less would not
        uint256 exposure = uint256(contribution) * (size - 1) * 15_000 * 1e18; // × 10_000
        assertGe(req * price * 10_000, exposure);
        assertLt((req - 1) * price * 10_000, exposure);
    }
}
