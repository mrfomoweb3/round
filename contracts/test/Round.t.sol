// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Round} from "../src/Round.sol";
import {IPriceFeed} from "../src/interfaces/IPriceFeed.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockPriceFeed} from "./mocks/MockPriceFeed.sol";
import {MockMUSD} from "./mocks/MockMUSD.sol";

contract RoundBase is Test {
    Round round;
    MockMUSD musd;
    MockPriceFeed feed;

    uint96 constant C = 100e18;
    uint32 constant DURATION = 5 minutes;
    uint32 constant GRACE = 60;
    uint256 constant PRICE = 80_000e18;

    address[] users;
    uint256[] keys;

    function setUp() public virtual {
        musd = new MockMUSD();
        feed = new MockPriceFeed(PRICE);
        round = new Round(IERC20(address(musd)), IPriceFeed(address(feed)));
        string[4] memory names = ["alice", "bob", "carol", "dave"];
        for (uint256 i; i < 4; ++i) {
            (address a, uint256 k) = makeAddrAndKey(names[i]);
            users.push(a);
            keys.push(k);
            vm.deal(a, 10 ether);
            musd.mint(a, 10_000e18);
            vm.prank(a);
            musd.approve(address(round), type(uint256).max);
        }
    }

    function _create(uint8 n) internal returns (uint256 id) {
        id = round.createCircle(C, n, DURATION, GRACE, 15_000, 1_000);
    }

    function _fill(uint256 id) internal {
        uint256 req = round.requiredCollateral(id);
        for (uint256 i; i < users.length; ++i) {
            vm.prank(users[i]);
            round.join{value: req}(id);
        }
    }

    function _payAllExcept(uint256 id, address skip) internal {
        (, address rec,,) = round.roundInfo(id);
        for (uint256 i; i < users.length; ++i) {
            address a = users[i];
            if (a == rec || a == skip) continue;
            (,, bool defaulted,) = round.memberOf(id, a);
            if (defaulted) continue;
            vm.prank(a);
            round.contribute(id);
        }
    }

    function _pastGrace() internal {
        vm.warp(block.timestamp + DURATION + GRACE);
    }

    function _collateral(uint256 id, address a) internal view returns (uint256 c) {
        (uint128 col,,,) = round.memberOf(id, a);
        c = col;
    }
}

contract RoundTest is RoundBase {
    // 1. Happy path
    function test_HappyPath() public {
        uint256 id = _create(4);
        _fill(id);
        uint256 req = round.requiredCollateral(id);
        assertEq(req, (450e18 * 1e18 + PRICE - 1) / PRICE); // 100 × 3 × 150% = $450

        for (uint8 r = 1; r <= 4; ++r) {
            address rec = users[r - 1];
            uint256 before = musd.balanceOf(rec);
            _payAllExcept(id, address(0));
            round.settle(id); // everyone paid → settles without waiting
            assertEq(musd.balanceOf(rec) - before, 3 * uint256(C));
        }
        (,,,,,,,,,, bool completed) = round.circles(id);
        assertTrue(completed);
        assertEq(musd.balanceOf(address(round)), 0);
        for (uint256 i; i < 4; ++i) {
            uint256 b = users[i].balance;
            vm.prank(users[i]);
            round.withdrawCollateral(id);
            assertEq(users[i].balance - b, req);
        }
        assertEq(address(round).balance, 0);
    }

    // 2. Default after payout
    function test_DefaultAfterPayout() public {
        uint256 id = _create(4);
        _fill(id);
        uint256 req = round.requiredCollateral(id);
        address alice = users[0];
        address bob = users[1];

        _payAllExcept(id, address(0));
        round.settle(id); // alice receives 300

        _payAllExcept(id, alice); // alice skips round 2
        vm.expectRevert(Round.RoundNotDue.selector);
        round.settle(id);
        _pastGrace();

        uint256 bobMusd = musd.balanceOf(bob);
        uint256 bobBtc = bob.balance;
        round.settle(id);

        uint256 owed = uint256(C) * 1e18 / PRICE;
        uint256 take = uint256(C) * 1e18 * 11_000 / (10_000 * PRICE);
        uint256 penalty = take - owed;
        uint256 share = penalty / 3;
        assertEq(musd.balanceOf(bob) - bobMusd, 2 * uint256(C));
        assertEq(bob.balance - bobBtc, owed + penalty - 2 * share);
        assertEq(round.pendingWithdrawals(users[2]), share);
        assertEq(round.pendingWithdrawals(users[3]), share);
        assertEq(_collateral(id, alice), req - take);

        // alice can't withdraw while the circle runs, and can't pay any more
        vm.prank(alice);
        vm.expectRevert(Round.ObligationsOutstanding.selector);
        round.withdrawCollateral(id);
        vm.prank(alice);
        vm.expectRevert(Round.NotObligated.selector);
        round.contribute(id);

        // rounds 3 and 4: alice keeps being charged, recipients stay whole
        for (uint8 r = 3; r <= 4; ++r) {
            address rec = users[r - 1];
            uint256 m0 = musd.balanceOf(rec);
            uint256 b0 = rec.balance;
            _payAllExcept(id, address(0));
            round.settle(id); // only defaulted alice is unpaid → no wait needed
            assertEq(musd.balanceOf(rec) - m0, 2 * uint256(C));
            assertGe(rec.balance - b0, owed);
        }
        assertEq(_collateral(id, alice), req - 3 * take);

        uint256 a0 = alice.balance;
        vm.prank(alice);
        round.withdrawCollateral(id); // leftovers only
        assertEq(alice.balance - a0, req - 3 * take);

        vm.prank(users[2]);
        round.claim();
        assertEq(round.pendingWithdrawals(users[2]), 0);
    }

    // 3. Default before payout: the defaulter's payout round is skipped
    function test_DefaultBeforePayout() public {
        uint256 id = _create(4);
        _fill(id);
        address dave = users[3];

        _payAllExcept(id, dave);
        _pastGrace();
        round.settle(id);
        (,, bool defaulted,) = round.memberOf(id, dave);
        assertTrue(defaulted);

        for (uint8 r = 2; r <= 3; ++r) {
            _payAllExcept(id, address(0));
            round.settle(id);
        }

        // round 4 belonged to dave: nobody can pay, it settles immediately and pays nothing
        vm.prank(users[0]);
        vm.expectRevert(Round.NotObligated.selector);
        round.contribute(id);
        uint256 d0 = musd.balanceOf(dave);
        round.settle(id);
        assertEq(musd.balanceOf(dave), d0);
        (,,,,,,,,,, bool completed) = round.circles(id);
        assertTrue(completed);
        (,,, bool received) = round.memberOf(id, dave);
        assertFalse(received);
    }

    // 4. BTC price drops 60% → shortfall emitted, no revert, no stuck funds
    function test_PriceCrashShortfall() public {
        uint256 id = _create(4);
        _fill(id);
        address alice = users[0];
        _payAllExcept(id, address(0));
        round.settle(id);

        feed.setPrice(PRICE * 40 / 100);
        uint256 price = PRICE * 40 / 100;
        uint256 owed = uint256(C) * 1e18 / price;

        _payAllExcept(id, alice);
        _pastGrace();
        round.settle(id); // collateral $180 still covers round 2

        _payAllExcept(id, address(0));
        uint256 left = _collateral(id, alice);
        assertLt(left, owed);
        vm.expectEmit(true, true, false, true);
        emit Round.Shortfall(id, alice, (owed - left) * price / 1e18);
        round.settle(id);
        assertEq(_collateral(id, alice), 0);

        _payAllExcept(id, address(0));
        vm.expectEmit(true, true, false, true);
        emit Round.Shortfall(id, alice, owed * price / 1e18);
        round.settle(id);

        assertEq(musd.balanceOf(address(round)), 0);
        for (uint256 i = 1; i < 4; ++i) {
            vm.prank(users[i]);
            round.withdrawCollateral(id);
            if (round.pendingWithdrawals(users[i]) > 0) {
                vm.prank(users[i]);
                round.claim();
            }
        }
        assertEq(address(round).balance, 0);
    }

    // 5. Stale oracle only blocks settlement when a default needs pricing
    function test_StaleOracle() public {
        uint256 id = _create(4);
        _fill(id);
        feed.setStale(true);
        _payAllExcept(id, address(0));
        round.settle(id); // no default → no price needed

        _payAllExcept(id, users[0]);
        _pastGrace();
        vm.expectRevert("PriceFeed: Oracle is stale.");
        round.settle(id);

        feed.setStale(false);
        round.settle(id);
        (uint8 r,,,) = round.roundInfo(id);
        assertEq(r, 3);
    }

    // 6. Join collateral
    function test_JoinInsufficientCollateral() public {
        uint256 id = _create(4);
        uint256 req = round.requiredCollateral(id);
        vm.prank(users[0]);
        vm.expectRevert(abi.encodeWithSelector(Round.InsufficientCollateral.selector, req));
        round.join{value: req - 1}(id);
    }

    function test_JoinOverpayKept() public {
        uint256 id = _create(4);
        uint256 req = round.requiredCollateral(id);
        vm.prank(users[0]);
        round.join{value: req + 1 ether}(id);
        assertEq(_collateral(id, users[0]), req + 1 ether);
    }

    function test_JoinTwiceAndFull() public {
        uint256 id = _create(2);
        uint256 req = round.requiredCollateral(id);
        vm.prank(users[0]);
        round.join{value: req}(id);
        vm.prank(users[0]);
        vm.expectRevert(Round.AlreadyJoined.selector);
        round.join{value: req}(id);
        vm.prank(users[1]);
        round.join{value: req}(id);
        vm.prank(users[2]);
        vm.expectRevert(Round.CircleFull.selector);
        round.join{value: req}(id);
    }

    function test_LeaveBeforeStart() public {
        uint256 id = _create(4);
        uint256 req = round.requiredCollateral(id);
        for (uint256 i; i < 3; ++i) {
            vm.prank(users[i]);
            round.join{value: req}(id);
        }
        uint256 b0 = users[1].balance;
        vm.prank(users[1]);
        round.withdrawCollateral(id);
        assertEq(users[1].balance - b0, req);
        address[] memory m = round.getMembers(id);
        assertEq(m.length, 2);
        assertEq(m[0], users[0]);
        assertEq(m[1], users[2]);
        vm.prank(users[1]);
        round.join{value: req}(id); // can rejoin, goes to the back
    }

    // 7. Permit payment with a real EIP-2612 signature
    function test_ContributeWithPermit() public {
        uint256 id = _create(4);
        _fill(id);
        address bob = users[1];
        vm.prank(bob);
        musd.approve(address(round), 0);

        uint256 deadline = block.timestamp + 1 hours;
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                bob,
                address(round),
                uint256(C),
                musd.nonces(bob),
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", musd.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(keys[1], digest);

        vm.prank(bob);
        round.contributeWithPermit(id, deadline, v, r, s);
        assertTrue(round.paid(id, 1, bob));
        assertEq(musd.balanceOf(address(round)), C);
    }

    // 8. Double settle, double contribute, wrong-round contributions
    function test_DoubleActionsRevert() public {
        uint256 id = _create(4);
        vm.expectRevert(Round.NotActive.selector);
        round.settle(id);
        _fill(id);

        vm.prank(users[0]);
        vm.expectRevert(Round.NotObligated.selector); // recipient can't pay themselves
        round.contribute(id);

        vm.prank(users[1]);
        round.contribute(id);
        vm.prank(users[1]);
        vm.expectRevert(Round.AlreadyPaid.selector);
        round.contribute(id);

        _payAllExcept(id, users[1]);
        round.settle(id);
        vm.expectRevert(Round.RoundNotDue.selector);
        round.settle(id);

        // round 2 now: bob is recipient, his round-1 payment doesn't carry over
        vm.prank(users[1]);
        vm.expectRevert(Round.NotObligated.selector);
        round.contribute(id);
        vm.prank(makeAddr("stranger"));
        vm.expectRevert(Round.NotObligated.selector);
        round.contribute(id);
    }

    function test_SettleAfterCompleteReverts() public {
        uint256 id = _create(2);
        uint256 req = round.requiredCollateral(id);
        vm.prank(users[0]);
        round.join{value: req}(id);
        vm.prank(users[1]);
        round.join{value: req}(id);
        vm.prank(users[1]);
        round.contribute(id);
        round.settle(id);
        vm.prank(users[0]);
        round.contribute(id);
        round.settle(id);
        vm.expectRevert(Round.NotActive.selector);
        round.settle(id);
    }

    function test_EarlyWithdrawAfterFinalPayment() public {
        uint256 id = _create(4);
        _fill(id);
        for (uint8 r = 1; r <= 3; ++r) {
            _payAllExcept(id, address(0));
            round.settle(id);
        }
        // round 4 (dave receives): alice pays her final obligation, then withdraws early
        vm.prank(users[1]);
        vm.expectRevert(Round.ObligationsOutstanding.selector);
        round.withdrawCollateral(id);
        vm.prank(users[0]);
        round.contribute(id);
        vm.prank(users[0]);
        round.withdrawCollateral(id);
        assertEq(_collateral(id, users[0]), 0);
    }

    function test_HealthAndTopUp() public {
        uint256 id = _create(4);
        _fill(id);
        assertApproxEqAbs(round.health(id, users[0]), 15_000, 1);
        feed.setPrice(PRICE / 2);
        assertApproxEqAbs(round.health(id, users[0]), 7_500, 1);
        uint256 req = round.requiredCollateral(id);
        vm.prank(users[0]);
        round.topUpCollateral{value: req}(id);
        assertGt(round.health(id, users[0]), 15_000);
        assertEq(round.health(id, makeAddr("stranger")), type(uint256).max);
    }

    function test_InvalidParams() public {
        vm.expectRevert(Round.InvalidParams.selector);
        round.createCircle(C, 1, DURATION, GRACE, 15_000, 1_000);
        vm.expectRevert(Round.InvalidParams.selector);
        round.createCircle(C, 13, DURATION, GRACE, 15_000, 1_000);
        vm.expectRevert(Round.InvalidParams.selector);
        round.createCircle(0, 4, DURATION, GRACE, 15_000, 1_000);
        vm.expectRevert(Round.InvalidParams.selector);
        round.createCircle(C, 4, DURATION, GRACE, 9_999, 1_000);
        vm.expectRevert(Round.UnknownCircle.selector);
        round.join{value: 1}(99);
    }

    function test_RecipientRejectsBTC_CreditedInstead() public {
        Rejector rej = new Rejector(round, musd);
        vm.deal(address(rej), 1 ether);
        musd.mint(address(rej), 1_000e18);
        uint256 id = _create(2);
        uint256 req = round.requiredCollateral(id);
        vm.prank(users[0]);
        round.join{value: req}(id);
        rej.join{value: req}(id);
        // round 1 → users[0]; round 2 → rejector. users[0] defaults in round 2.
        rej.pay(id);
        round.settle(id);
        _pastGrace();
        round.settle(id); // BTC push to rejector fails → credited, settlement doesn't revert
        assertGt(round.pendingWithdrawals(address(rej)), 0);
    }
}

contract Rejector {
    Round r;

    constructor(Round _r, MockMUSD m) {
        r = _r;
        m.approve(address(_r), type(uint256).max);
    }

    function join(uint256 id) external payable {
        r.join{value: msg.value}(id);
    }

    function pay(uint256 id) external {
        r.contribute(id);
    }

    receive() external payable {
        revert("no");
    }
}
