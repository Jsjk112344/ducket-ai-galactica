// SPDX-License-Identifier: Apache-2.0
// Mock USDT token for local testing — mimics 6-decimal Tether behavior
// DO NOT use on mainnet
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDT
 * @notice Minimal ERC20 with 6 decimals and a public mint function.
 *         Used by FraudEscrow unit tests on the local Hardhat network.
 */
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {}

    /// @dev Override to match USDT's 6-decimal precision
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint tokens to any address (test helper — no access control)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
