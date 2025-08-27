#!/bin/bash

# Solana AMM Deployment Script
# This script builds and deploys the AMM program to Solana

set -e

echo "🚀 Starting Solana AMM Deployment"

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install it first."
    echo "Visit: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust/Cargo not found. Please install it first."
    echo "Visit: https://rustup.rs/"
    exit 1
fi

# Configuration
NETWORK=${1:-"devnet"}  # Default to devnet, can pass mainnet-beta or testnet
KEYPAIR_PATH=${2:-"~/.config/solana/id.json"}

echo "📋 Configuration:"
echo "  Network: $NETWORK"
echo "  Keypair: $KEYPAIR_PATH"

# Set Solana configuration
echo "⚙️  Configuring Solana CLI..."
solana config set --url $NETWORK
solana config set --keypair $KEYPAIR_PATH

# Check balance
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance)
echo "  Balance: $BALANCE"

# Minimum balance check (approximate cost for deployment)
MIN_BALANCE=2.0
BALANCE_NUM=$(echo $BALANCE | cut -d' ' -f1)
if (( $(echo "$BALANCE_NUM < $MIN_BALANCE" | bc -l) )); then
    echo "⚠️  Warning: Low balance. You may need at least $MIN_BALANCE SOL for deployment."
    if [ "$NETWORK" = "devnet" ]; then
        echo "💡 You can get devnet SOL from: https://faucet.solana.com/"
    fi
fi

# Build the program
echo "🔨 Building the program..."
cargo build-bpf --manifest-path Cargo.toml

# Check if build was successful
if [ ! -f "target/deploy/solana_amm.so" ]; then
    echo "❌ Build failed. Program binary not found."
    exit 1
fi

echo "✅ Build successful!"

# Deploy the program
echo "🚀 Deploying to $NETWORK..."
PROGRAM_ID=$(solana program deploy target/deploy/solana_amm.so --output json | jq -r '.programId')

if [ "$PROGRAM_ID" = "null" ] || [ -z "$PROGRAM_ID" ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Deployment successful!"
echo "📝 Program ID: $PROGRAM_ID"

# Update the program ID in the source code
echo "🔄 Updating program ID in source code..."
sed -i.bak "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" src/lib.rs

echo "✅ Program ID updated in src/lib.rs"

# Rebuild with correct program ID
echo "🔨 Rebuilding with correct program ID..."
cargo build-bpf --manifest-path Cargo.toml

# Upgrade the program with the correct binary
echo "⬆️  Upgrading program with correct ID..."
solana program deploy target/deploy/solana_amm.so --program-id $PROGRAM_ID

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Network: $NETWORK"
echo "  Program ID: $PROGRAM_ID"
echo "  Binary: target/deploy/solana_amm.so"
echo ""
echo "🔗 Explorer Links:"
if [ "$NETWORK" = "mainnet-beta" ]; then
    echo "  https://explorer.solana.com/address/$PROGRAM_ID"
elif [ "$NETWORK" = "devnet" ]; then
    echo "  https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
elif [ "$NETWORK" = "testnet" ]; then
    echo "  https://explorer.solana.com/address/$PROGRAM_ID?cluster=testnet"
fi
echo ""
echo "📚 Next Steps:"
echo "  1. Update your client code with the new Program ID"
echo "  2. Test the program with the provided examples"
echo "  3. Initialize pools and start trading!"
echo ""
echo "⚠️  Important Notes:"
echo "  - Save the Program ID: $PROGRAM_ID"
echo "  - Keep your keypair secure"
echo "  - Test thoroughly before mainnet deployment"

# Create a deployment info file
cat > deployment-info.json << EOF
{
  "programId": "$PROGRAM_ID",
  "network": "$NETWORK",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployer": "$(solana address)",
  "binaryPath": "target/deploy/solana_amm.so"
}
EOF

echo "📄 Deployment info saved to deployment-info.json"
