# Solana AMM (Automated Market Maker)

A production-ready constant-product automated market maker (AMM) for Solana that supports both legacy SPL tokens and Token-2022, built with native Rust without the Anchor framework.

## Features

- **Constant Product Market Maker (CPMM)**: Uses the x * y = k formula similar to Uniswap V2
- **Dual Token Support**: Fully compatible with both legacy SPL tokens and Token-2022
- **Token Extensions**: Handles Token-2022 extensions like transfer fees and metadata
- **Security First**: Comprehensive validations, overflow protection, and attack prevention
- **Gas Optimized**: Efficient native Rust implementation without framework overhead
- **Rent Exempt**: All accounts are properly rent-exempt
- **Fee System**: Configurable swap fees and protocol fees

## Architecture

### Core Components

1. **Pool State** (`src/state.rs`): Manages liquidity pool data and calculations
2. **Instructions** (`src/instruction.rs`): Defines all supported operations
3. **Processor** (`src/processor.rs`): Handles instruction execution and validation
4. **Utils** (`src/utils.rs`): Token operations and compatibility layer
5. **Error Handling** (`src/error.rs`): Comprehensive error types

### Supported Instructions

1. **InitializePool**: Create a new liquidity pool for two tokens
2. **AddLiquidity**: Deposit tokens and receive LP tokens
3. **RemoveLiquidity**: Burn LP tokens and withdraw proportional amounts
4. **Swap**: Exchange one token for another using the constant product formula

## Token Compatibility

### Legacy SPL Tokens
- Uses Token Program ID: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
- Standard token operations without extensions

### Token-2022
- Uses Token-2022 Program ID: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`
- Supports all token extensions
- Automatic fee calculation for transfer fees
- Compatible with interest-bearing tokens

### Mixed Pools
The AMM supports pools with any combination:
- Legacy ↔ Legacy
- Legacy ↔ Token-2022
- Token-2022 ↔ Token-2022

## Security Features

### Account Validation
- PDA derivation verification
- Account ownership checks
- Signer validation
- Rent exemption verification

### Math Safety
- Overflow/underflow protection
- Safe arithmetic operations
- Precision handling with u128 intermediate calculations

### Attack Prevention
- Slippage protection
- Maximum swap size limits (10% of reserves)
- Minimum liquidity requirements
- Flash loan attack mitigation

### Fee Protection
- Configurable swap fees (default: 0.3%)
- Protocol fees (default: 0.05%)
- Token-2022 transfer fee integration

## Usage Examples

### Initialize a Pool

```rust
use solana_amm::instruction::AmmInstruction;

let instruction = AmmInstruction::initialize_pool(
    &program_id,
    &initializer_pubkey,
    &token_a_mint,
    &token_b_mint,
    30, // 0.3% fee rate
)?;
```

### Add Liquidity

```rust
let instruction = AmmInstruction::add_liquidity(
    &program_id,
    &user_pubkey,
    &token_a_mint,
    &token_b_mint,
    1000000, // max token A
    2000000, // max token B
    900000,  // min LP tokens
)?;
```

### Swap Tokens

```rust
let instruction = AmmInstruction::Swap {
    amount_in: 100000,
    minimum_amount_out: 95000,
    a_to_b: true, // swap A for B
};
```

## Deployment

### Prerequisites

1. Rust 1.70+
2. Solana CLI 1.17+
3. Node.js (for client interactions)

### Build

```bash
cargo build-bpf
```

### Deploy

```bash
solana program deploy target/deploy/solana_amm.so
```

### Set Program ID

Update the program ID in `src/lib.rs`:

```rust
solana_program::declare_id!("YOUR_DEPLOYED_PROGRAM_ID");
```

## Testing

### Unit Tests

```bash
cargo test
```

### Integration Tests

```bash
cargo test-bpf
```

### Local Validator Testing

```bash
# Start local validator
solana-test-validator

# Deploy program
solana program deploy target/deploy/solana_amm.so

# Run client tests
npm test
```

## Configuration

### Fee Rates

- **Swap Fee**: 30 basis points (0.3%) - paid by traders to liquidity providers
- **Protocol Fee**: 5 basis points (0.05%) - collected by protocol treasury
- **Maximum Fee**: 10000 basis points (100%) - hard limit

### Pool Constraints

- **Minimum Liquidity**: 1000 tokens per reserve
- **Maximum Swap**: 10% of pool reserves per transaction
- **Initial LP Supply**: 1000 tokens locked forever (prevents division by zero)

### Token Support

- **Decimals**: Supports tokens with any decimal precision
- **Supply**: Handles tokens with supplies up to u64::MAX
- **Extensions**: Full Token-2022 extension compatibility

## Error Handling

The program includes comprehensive error handling with specific error codes:

- **Math Errors**: Overflow, underflow, division by zero
- **Pool Errors**: Invalid state, insufficient liquidity
- **Token Errors**: Invalid mints, insufficient balance
- **Security Errors**: Invalid authority, unauthorized access

## Gas Optimization

- **Minimal CPI Calls**: Efficient cross-program invocations
- **Batch Operations**: Combined account validations
- **Memory Efficient**: Optimized data structures
- **Zero-Copy Deserialization**: Fast account data parsing

## Audit Considerations

### Security Checklist

- ✅ Integer overflow protection
- ✅ Account validation
- ✅ PDA verification
- ✅ Signer checks
- ✅ Rent exemption
- ✅ Token program validation
- ✅ Slippage protection
- ✅ Flash loan prevention

### Known Limitations

1. **LP Token Decimals**: Fixed at 9 decimals
2. **Protocol Fees**: Require manual collection
3. **Oracle Integration**: Not included (can be added)
4. **Governance**: Not implemented (can be added)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
