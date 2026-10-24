// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IPriceFeed} from "./interfaces/IPriceFeed.sol";

/// @title Round — Bitcoin-secured savings circles (ROSCAs) on Mezo
/// @notice Members pay the same MUSD amount every round; one member takes the pot each round.
/// Each member locks native BTC as a guarantee. A missed payment is covered from the
/// defaulter's BTC, valued with Mezo's PriceFeed. No owner, no admin, permissionless settlement.
contract Round is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant BPS = 10_000;

    struct Circle {
        address creator;
        uint96 contribution; // MUSD per member per round, 18 decimals
        uint8 size;
        uint8 currentRound; // 0 = not started; 1..size
        uint8 paidCount; // payments received for currentRound
        uint32 roundDuration;
        uint32 gracePeriod;
        uint16 collateralRatioBps;
        uint16 penaltyBps;
        uint64 roundStart; // start of currentRound
        bool completed;
        address[] members; // payout order = join order
    }

    struct Member {
        uint128 collateral; // BTC wei
        bool joined;
        bool defaulted;
        bool received;
    }

    IERC20 public immutable musd;
    IPriceFeed public immutable priceFeed;

    uint256 public circleCount;
    mapping(uint256 => Circle) public circles;
    mapping(uint256 => mapping(address => Member)) public memberOf;
    mapping(uint256 => mapping(uint8 => mapping(address => bool))) public paid;
    /// @notice BTC owed to an address (penalty shares, failed transfers). Claim with `claim()`.
    mapping(address => uint256) public pendingWithdrawals;

    event CircleCreated(
        uint256 indexed id, address indexed creator, uint256 contribution, uint8 size, uint32 roundDuration
    );
    event Joined(uint256 indexed id, address indexed member, uint256 collateral);
    event CircleStarted(uint256 indexed id, uint64 startTime);
    event Contributed(uint256 indexed id, uint8 indexed round, address indexed member, uint256 amount);
    event RoundSettled(uint256 indexed id, uint8 indexed round, address indexed recipient, uint256 musdPaid, uint256 btcPaid);
    event Defaulted(uint256 indexed id, address indexed member, uint8 indexed round, uint256 btcTaken);
    event Shortfall(uint256 indexed id, address indexed member, uint256 usdUncovered);
    event CollateralToppedUp(uint256 indexed id, address indexed member, uint256 amount);
    event CollateralWithdrawn(uint256 indexed id, address indexed member, uint256 amount);
    event CircleCompleted(uint256 indexed id);
    event Claimed(address indexed account, uint256 amount);

    error InvalidParams();
    error UnknownCircle();
    error CircleFull();
    error AlreadyJoined();
    error NotMember();
    error NotActive();
    error InsufficientCollateral(uint256 required);
    error NotObligated();
    error AlreadyPaid();
    error RoundNotDue();
    error ObligationsOutstanding();
    error NothingToWithdraw();
    error TransferFailed();

    constructor(IERC20 _musd, IPriceFeed _priceFeed) {
        musd = _musd;
        priceFeed = _priceFeed;
    }

    // ───────────────────────────── setup ─────────────────────────────

    function createCircle(
        uint96 contribution,
        uint8 size,
        uint32 roundDuration,
        uint32 gracePeriod,
        uint16 collateralRatioBps,
        uint16 penaltyBps
    ) external returns (uint256 id) {
        if (
            contribution == 0 || size < 2 || size > 12 || roundDuration == 0 || collateralRatioBps < BPS
                || penaltyBps > 5_000
        ) revert InvalidParams();

        id = ++circleCount;
        Circle storage c = circles[id];
        c.creator = msg.sender;
        c.contribution = contribution;
        c.size = size;
        c.roundDuration = roundDuration;
        c.gracePeriod = gracePeriod;
        c.collateralRatioBps = collateralRatioBps;
        c.penaltyBps = penaltyBps;
        emit CircleCreated(id, msg.sender, contribution, size, roundDuration);
    }

    function join(uint256 id) external payable nonReentrant {
        Circle storage c = _circle(id);
        if (c.members.length >= c.size) revert CircleFull();
        Member storage m = memberOf[id][msg.sender];
        if (m.joined) revert AlreadyJoined();
        uint256 required = _requiredCollateral(c);
        if (msg.value < required) revert InsufficientCollateral(required);

        m.joined = true;
        m.collateral = uint128(msg.value);
        c.members.push(msg.sender);
        emit Joined(id, msg.sender, msg.value);

        if (c.members.length == c.size) {
            c.currentRound = 1;
            c.roundStart = uint64(block.timestamp);
            emit CircleStarted(id, uint64(block.timestamp));
        }
    }

    // ───────────────────────────── each round ─────────────────────────────

    function contribute(uint256 id) external nonReentrant {
        _contribute(id);
    }

    /// @notice Pay with one EIP-2612 signature instead of a separate approve.
    /// The permit is wrapped in try/catch so a front-run permit can't block the payment.
    function contributeWithPermit(uint256 id, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
        external
        nonReentrant
    {
        try IERC20Permit(address(musd)).permit(msg.sender, address(this), circles[id].contribution, deadline, v, r, s)
        {} catch {}
        _contribute(id);
    }

    /// @notice Pay the current recipient, cover any defaults from collateral, advance the round.
    /// Callable by anyone once every active member has paid, or once the grace period is over.
    function settle(uint256 id) external nonReentrant {
        Circle storage c = _circle(id);
        uint8 r = c.currentRound;
        if (r == 0 || c.completed) revert NotActive();
        address recipient = c.members[r - 1];
        uint256 musdPaid = 0;
        uint256 btcPaid = 0;

        // A defaulted recipient's payout is cancelled: the round is skipped, nobody pays.
        if (!memberOf[id][recipient].defaulted) {
            if (!_allActivePaid(id, c, r, recipient)) {
                if (block.timestamp < uint256(c.roundStart) + c.roundDuration + c.gracePeriod) revert RoundNotDue();
            }
            musdPaid = uint256(c.paidCount) * c.contribution;
            btcPaid = _coverDefaults(id, c, r, recipient);
            memberOf[id][recipient].received = true;
        }

        if (r == c.size) {
            c.completed = true;
        } else {
            c.currentRound = r + 1;
            c.paidCount = 0;
            c.roundStart = uint64(block.timestamp);
        }

        emit RoundSettled(id, r, recipient, musdPaid, btcPaid);
        if (c.completed) emit CircleCompleted(id);

        if (musdPaid > 0) musd.safeTransfer(recipient, musdPaid);
        if (btcPaid > 0) _sendBTC(recipient, btcPaid);
    }

    // ───────────────────────────── collateral ─────────────────────────────

    function topUpCollateral(uint256 id) external payable nonReentrant {
        _circle(id);
        Member storage m = memberOf[id][msg.sender];
        if (!m.joined) revert NotMember();
        if (msg.value == 0) revert InvalidParams();
        m.collateral += uint128(msg.value);
        emit CollateralToppedUp(id, msg.sender, msg.value);
    }

    /// @notice Withdraw locked BTC once all your payments are made (or the circle is complete).
    /// Before the circle starts, this lets a member leave and take their BTC back.
    /// Defaulted members can only withdraw what is left after the circle completes.
    function withdrawCollateral(uint256 id) external nonReentrant {
        Circle storage c = _circle(id);
        Member storage m = memberOf[id][msg.sender];
        if (!m.joined) revert NotMember();
        uint256 amount = m.collateral;
        if (c.currentRound == 0) {
            _leave(id, c, msg.sender); // not started yet: withdrawing means leaving the circle
        } else if (!c.completed && (m.defaulted || _remainingObligations(id, c, msg.sender) > 0)) {
            revert ObligationsOutstanding();
        }
        if (amount == 0) revert NothingToWithdraw();
        m.collateral = 0;
        emit CollateralWithdrawn(id, msg.sender, amount);
        _sendBTC(msg.sender, amount);
    }

    /// @notice Claim BTC credited to you (penalty shares, or a transfer that failed).
    function claim() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        pendingWithdrawals[msg.sender] = 0;
        emit Claimed(msg.sender, amount);
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    // ───────────────────────────── views ─────────────────────────────

    function requiredCollateral(uint256 id) external view returns (uint256 btcWei) {
        return _requiredCollateral(_circle(id));
    }

    /// @notice collateralUSD / remainingObligationUSD in bps. type(uint256).max when nothing is owed.
    function health(uint256 id, address member) external view returns (uint256 bps) {
        Circle storage c = _circle(id);
        uint256 owed = uint256(_remainingObligations(id, c, member)) * c.contribution;
        if (owed == 0) return type(uint256).max;
        return uint256(memberOf[id][member].collateral) * priceFeed.fetchPrice() * BPS / (owed * 1e18);
    }

    function roundInfo(uint256 id)
        external
        view
        returns (uint8 round, address recipient, uint64 roundEnd, uint256 paidCount)
    {
        Circle storage c = _circle(id);
        round = c.currentRound;
        if (round == 0) return (0, address(0), 0, 0);
        recipient = c.members[round - 1];
        roundEnd = c.roundStart + c.roundDuration;
        paidCount = c.paidCount;
    }

    function getMembers(uint256 id) external view returns (address[] memory) {
        return circles[id].members;
    }

    function remainingObligations(uint256 id, address member) external view returns (uint256) {
        return _remainingObligations(id, _circle(id), member);
    }

    // ───────────────────────────── internals ─────────────────────────────

    function _circle(uint256 id) private view returns (Circle storage c) {
        c = circles[id];
        if (c.size == 0) revert UnknownCircle();
    }

    function _requiredCollateral(Circle storage c) private view returns (uint256) {
        uint256 num = uint256(c.contribution) * (c.size - 1) * c.collateralRatioBps * 1e18;
        uint256 den = BPS * priceFeed.fetchPrice();
        return (num + den - 1) / den; // round up so the ratio is never undershot
    }

    function _contribute(uint256 id) private {
        Circle storage c = _circle(id);
        uint8 r = c.currentRound;
        if (r == 0 || c.completed) revert NotActive();
        address recipient = c.members[r - 1];
        Member storage m = memberOf[id][msg.sender];
        if (!m.joined || m.defaulted || msg.sender == recipient || memberOf[id][recipient].defaulted) {
            revert NotObligated();
        }
        if (paid[id][r][msg.sender]) revert AlreadyPaid();

        paid[id][r][msg.sender] = true;
        c.paidCount += 1;
        emit Contributed(id, r, msg.sender, c.contribution);
        musd.safeTransferFrom(msg.sender, address(this), c.contribution);
    }

    function _allActivePaid(uint256 id, Circle storage c, uint8 r, address recipient) private view returns (bool) {
        uint256 n = c.members.length;
        for (uint256 i; i < n; ++i) {
            address a = c.members[i];
            if (a != recipient && !memberOf[id][a].defaulted && !paid[id][r][a]) return false;
        }
        return true;
    }

    /// @dev Charges every unpaid member's collateral for round r. Returns BTC owed to the recipient.
    /// The price feed is only read when someone actually needs pricing.
    function _coverDefaults(uint256 id, Circle storage c, uint8 r, address recipient)
        private
        returns (uint256 toRecipient)
    {
        uint256 n = c.members.length;
        uint256 price = 0;
        uint256 penaltyPool = 0;
        for (uint256 i; i < n; ++i) {
            address a = c.members[i];
            if (a == recipient || paid[id][r][a]) continue;
            if (price == 0) price = priceFeed.fetchPrice();

            Member storage m = memberOf[id][a];
            m.defaulted = true;
            uint256 owed = uint256(c.contribution) * 1e18 / price;
            uint256 take = uint256(c.contribution) * 1e18 * (BPS + c.penaltyBps) / (BPS * price);
            if (take > m.collateral) take = m.collateral;
            m.collateral -= uint128(take);

            uint256 covered = take < owed ? take : owed;
            toRecipient += covered;
            penaltyPool += take - covered;
            emit Defaulted(id, a, r, take);
            if (covered < owed) emit Shortfall(id, a, (owed - covered) * price / 1e18);
        }
        if (penaltyPool == 0) return toRecipient;

        // Split the penalty among honest members (the recipient is always one of them).
        uint256 honest = 0;
        for (uint256 i; i < n; ++i) {
            if (!memberOf[id][c.members[i]].defaulted) ++honest;
        }
        // slither-disable-next-line divide-before-multiply (rounding dust goes to the recipient)
        uint256 share = penaltyPool / honest;
        for (uint256 i; i < n; ++i) {
            address a = c.members[i];
            if (a != recipient && !memberOf[id][a].defaulted) pendingWithdrawals[a] += share;
        }
        toRecipient += penaltyPool - share * (honest - 1); // recipient's share + rounding dust
    }

    /// @dev Number of rounds (current or future) in which `member` still has to pay.
    function _remainingObligations(uint256 id, Circle storage c, address member) private view returns (uint256 count) {
        if (!memberOf[id][member].joined || c.completed) return 0;
        uint8 r = c.currentRound;
        if (r == 0) return c.size - 1;
        for (uint8 k = r; k <= c.size; ++k) {
            address rec = c.members[k - 1];
            if (rec == member || memberOf[id][rec].defaulted) continue;
            if (k == r && paid[id][k][member]) continue;
            ++count;
        }
    }

    /// @dev Removes a member before the circle starts, keeping everyone else's payout order.
    function _leave(uint256 id, Circle storage c, address member) private {
        uint256 n = c.members.length;
        uint256 i;
        while (c.members[i] != member) ++i;
        for (; i + 1 < n; ++i) c.members[i] = c.members[i + 1];
        c.members.pop();
        memberOf[id][member].joined = false;
    }

    /// @dev Push BTC; if the recipient can't receive it, credit it instead of freezing the circle.
    function _sendBTC(address to, uint256 amount) private {
        (bool ok,) = to.call{value: amount, gas: 50_000}("");
        if (!ok) pendingWithdrawals[to] += amount;
    }
}
