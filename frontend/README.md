# Solana AMM Frontend

A modern, responsive frontend for the Solana AMM (Automated Market Maker) built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔗 **Wallet Integration**: Support for multiple Solana wallets (Phantom, Solflare, Torus, Ledger)
- 💱 **Token Swapping**: Intuitive swap interface with slippage protection
- 💧 **Liquidity Management**: Add and remove liquidity with real-time calculations
- 🏊 **Pool Creation**: Create new trading pools for any token pair
- 📊 **Real-time Stats**: Live TVL, volume, and APR statistics
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- 📱 **Responsive**: Works perfectly on desktop and mobile devices
- 🔔 **Notifications**: Real-time transaction feedback and status updates

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Wallet**: Solana Wallet Adapter
- **Icons**: Lucide React
- **Blockchain**: Solana Web3.js

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Solana wallet (Phantom recommended)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_AMM_PROGRAM_ID=pDPr3yM12LyCwU9kN8DqgqF1C56Gf9VH5xU4dE4f8Bs
```

## Usage

### Connecting Your Wallet

1. Click the "Connect Wallet" button in the top right
2. Select your preferred wallet from the modal
3. Approve the connection in your wallet

### Swapping Tokens

1. Navigate to the "Swap" tab
2. Select the tokens you want to trade
3. Enter the amount to swap
4. Review the price impact and slippage
5. Click "Swap" and confirm in your wallet

### Adding Liquidity

1. Go to the "Liquidity" tab
2. Select "Add Liquidity"
3. Choose your token pair
4. Enter the amounts (they'll be automatically balanced)
5. Click "Add Liquidity" and confirm

### Creating Pools

1. Navigate to the "Pools" tab
2. Select two different tokens
3. Set the fee rate (default 0.3%)
4. Click "Create Pool" and confirm
5. Add initial liquidity after creation

## Program Integration

The frontend connects to the deployed AMM program:
- **Program ID**: `pDPr3yM12LyCwU9kN8DqgqF1C56Gf9VH5xU4dE4f8Bs`
- **Network**: Devnet
- **Explorer**: [View on Solana Explorer](https://explorer.solana.com/address/pDPr3yM12LyCwU9kN8DqgqF1C56Gf9VH5xU4dE4f8Bs?cluster=devnet)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Build

```bash
npm run build
npm start
```

---

**Note**: This is a demo application running on Solana Devnet. Do not use real funds on mainnet without proper testing and auditing.
