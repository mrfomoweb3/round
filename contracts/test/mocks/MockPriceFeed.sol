// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IPriceFeed} from "../../src/interfaces/IPriceFeed.sol";

contract MockPriceFeed is IPriceFeed {
    uint256 public price;
    bool public stale;

    constructor(uint256 _price) {
        price = _price;
    }

    function setPrice(uint256 _price) external {
        price = _price;
    }

    function setStale(bool _stale) external {
        stale = _stale;
    }

    function fetchPrice() external view returns (uint256) {
        require(!stale, "PriceFeed: Oracle is stale.");
        return price;
    }
}
