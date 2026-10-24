// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Round} from "../src/Round.sol";
import {IPriceFeed} from "../src/interfaces/IPriceFeed.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockPriceFeed} from "./mocks/MockPriceFeed.sol";
import {MockMUSD} from "./mocks/MockMUSD.sol";

contract Handler is Test {
    Round public round;
    MockMUSD public musd;
    MockPriceFeed public feed;
    address[] public actors;
    uint256[] public ids;

    constructor(Round _round, MockMUSD _musd, MockPriceFeed _feed) {
        round = _round;
        musd = _musd;
        feed = _feed;
        for (uint256 i; i < 6; ++i) {
            address a = makeAddr(string(abi.encodePacked("actor", vm.toString(i))));
            actors.push(a);
            vm.deal(a, 1_000 ether);
            musd.mint(a, 1_000_000e18);
            vm.prank(a);
            musd.approve(address(round), type(uint256).max);
        }
    }

    function actorCount() external view returns (uint256) {
        return actors.length;
    }

    function idCount() external view returns (uint256) {
        return ids.length;
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function _id(uint256 seed) internal view returns (uint256) {
        return ids[seed % ids.length];
    }

    function create(uint8 size, uint96 contribution) external {
        if (ids.length >= 4) return;
        size = uint8(bound(size, 2, 6));
        contribution = uint96(bound(contribution, 1e18, 1_000e18));
        ids.push(round.createCircle(contribution, size, 1 hours, 60, 15_000, 1_000));
    }

    function join(uint256 idSeed, uint256 actorSeed, uint256 extra) external {
        if (ids.length == 0) return;
        uint256 id = _id(idSeed);
        uint256 value = round.requiredCollateral(id) + bound(extra, 0, 1 ether);
        vm.prank(_actor(actorSeed));
        try round.join{value: value}(id) {} catch {}
    }

    function contribute(uint256 idSeed, uint256 actorSeed) external {
        if (ids.length == 0) return;
        vm.prank(_actor(actorSeed));
        try round.contribute(_id(idSeed)) {} catch {}
    }

    function settle(uint256 idSeed, uint256 wait) external {
        if (ids.length == 0) return;
        vm.warp(block.timestamp + bound(wait, 0, 2 hours));
        try round.settle(_id(idSeed)) {} catch {}
    }

    function topUp(uint256 idSeed, uint256 actorSeed, uint256 amount) external {
        if (ids.length == 0) return;
        vm.prank(_actor(actorSeed));
        try round.topUpCollateral{value: bound(amount, 1, 1 ether)}(_id(idSeed)) {} catch {}
    }

    function withdraw(uint256 idSeed, uint256 actorSeed) external {
        if (ids.length == 0) return;
        vm.prank(_actor(actorSeed));
        try round.withdrawCollateral(_id(idSeed)) {} catch {}
    }

    function claim(uint256 actorSeed) external {
        vm.prank(_actor(actorSeed));
        try round.claim() {} catch {}
    }

    function movePrice(uint256 price) external {
        feed.setPrice(bound(price, 10_000e18, 200_000e18));
    }
}

contract RoundInvariantTest is StdInvariant, Test {
    Round round;
    MockMUSD musd;
    MockPriceFeed feed;
    Handler handler;

    function setUp() public {
        musd = new MockMUSD();
        feed = new MockPriceFeed(80_000e18);
        round = new Round(IERC20(address(musd)), IPriceFeed(address(feed)));
        handler = new Handler(round, musd, feed);
        targetContract(address(handler));
    }

    /// MUSD held == contributions paid into rounds that haven't been settled yet.
    function invariant_MusdEqualsUnpaidContributions() public view {
        uint256 expected;
        for (uint256 i; i < handler.idCount(); ++i) {
            uint256 id = handler.ids(i);
            (, uint96 contribution,,, uint8 paidCount,,,,,, bool completed) = round.circles(id);
            if (!completed) expected += uint256(paidCount) * contribution;
        }
        assertEq(musd.balanceOf(address(round)), expected);
    }

    /// BTC held == all locked collateral + all pending withdrawals.
    function invariant_BtcEqualsCollateralPlusPending() public view {
        uint256 expected;
        for (uint256 j; j < handler.actorCount(); ++j) {
            address a = handler.actors(j);
            expected += round.pendingWithdrawals(a);
            for (uint256 i; i < handler.idCount(); ++i) {
                (uint128 col,,,) = round.memberOf(handler.ids(i), a);
                expected += col;
            }
        }
        assertEq(address(round).balance, expected);
    }
}
