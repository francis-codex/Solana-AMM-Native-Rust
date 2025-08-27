'use client';

import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { Plus, Loader2, ExternalLink, TrendingUp } from 'lucide-react';
import { AmmClient, TokenInfo } from '../lib/amm-client';
import TokenSelector from './TokenSelector';

interface PoolCreationProps {
  ammClient: AmmClient;
}

export default function PoolCreation({ ammClient }: PoolCreationProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  const [feeRate, setFeeRate] = useState(30); // 0.3%
  const [isLoading, setIsLoading] = useState(false);

  // Mock token data
  const mockTokens: TokenInfo[] = [
    {
      mint: new PublicKey('So11111111111111111111111111111111111111112'),
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
    },
    {
      mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
    },
    {
      mint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
      symbol: 'mSOL',
      name: 'Marinade Staked SOL',
      decimals: 9,
    },
    {
      mint: new PublicKey('7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj'),
      symbol: 'stSOL',
      name: 'Lido Staked SOL',
      decimals: 9,
    }
  ];

  // Mock existing pools
  const mockPools = [
    {
      tokenA: 'SOL',
      tokenB: 'USDC',
      tvl: '$2.4M',
      volume24h: '$156K',
      fee: '0.3%',
      apr: '12.5%'
    },
    {
      tokenA: 'mSOL',
      tokenB: 'SOL',
      tvl: '$890K',
      volume24h: '$45K',
      fee: '0.3%',
      apr: '8.2%'
    }
  ];

  const handleCreatePool = async () => {
    if (!publicKey || !tokenA || !tokenB) {
      alert('Please select both tokens');
      return;
    }

    if (tokenA.mint.equals(tokenB.mint)) {
      alert('Please select different tokens');
      return;
    }

    setIsLoading(true);
    try {
      const initInstruction = await ammClient.createInitializePoolInstruction(
        publicKey,
        tokenA.mint,
        tokenB.mint,
        feeRate
      );

      const transaction = new Transaction().add(initInstruction);
      const signature = await sendTransaction(transaction, connection);
      
      alert(`Pool created successfully! Signature: ${signature.slice(0, 8)}...`);
      
      // Reset form
      setTokenA(null);
      setTokenB(null);
      setFeeRate(30);
    } catch (error) {
      console.error('Pool creation failed:', error);
      alert('Pool creation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Pool Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Create New Pool</h3>
        
        {/* Token Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Token A</label>
            <TokenSelector
              selectedToken={tokenA}
              onSelectToken={setTokenA}
              tokens={mockTokens}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Token B</label>
            <TokenSelector
              selectedToken={tokenB}
              onSelectToken={setTokenB}
              tokens={mockTokens}
            />
          </div>
        </div>

        {/* Fee Rate Selection */}
        <div className="space-y-2">
          <label className="text-sm text-white/70">Fee Rate</label>
          <div className="flex gap-2">
            {[10, 30, 100].map((rate) => (
              <button
                key={rate}
                onClick={() => setFeeRate(rate)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  feeRate === rate
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {rate / 100}%
              </button>
            ))}
            <input
              type="number"
              value={feeRate}
              onChange={(e) => setFeeRate(parseInt(e.target.value) || 30)}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
              placeholder="Custom (basis points)"
              min="1"
              max="10000"
            />
          </div>
          <p className="text-xs text-white/50">
            Fee rate in basis points (1 bp = 0.01%). Standard is 30 bp (0.3%).
          </p>
        </div>

        {/* Pool Preview */}
        {tokenA && tokenB && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white/5 rounded-xl p-4 border border-white/10"
          >
            <h4 className="text-sm font-medium text-white mb-3">Pool Preview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Pair</span>
                <span className="text-white">{tokenA.symbol}/{tokenB.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Fee Rate</span>
                <span className="text-white">{feeRate / 100}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Initial Liquidity</span>
                <span className="text-white">Required after creation</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Create Pool Button */}
        <button
          onClick={handleCreatePool}
          disabled={!tokenA || !tokenB || isLoading}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Creating Pool...
            </>
          ) : (
            <>
              <Plus size={20} />
              Create Pool
            </>
          )}
        </button>
      </div>

      {/* Existing Pools */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Existing Pools</h3>
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View All
          </button>
        </div>

        <div className="space-y-3">
          {mockPools.map((pool, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {pool.tokenA.charAt(0)}
                      </span>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center -ml-2">
                      <span className="text-white text-xs font-bold">
                        {pool.tokenB.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {pool.tokenA}/{pool.tokenB}
                    </div>
                    <div className="text-xs text-white/60">Fee: {pool.fee}</div>
                  </div>
                </div>
                <button className="p-2 text-white/70 hover:text-white transition-colors">
                  <ExternalLink size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-white/60">TVL</div>
                  <div className="text-white font-medium">{pool.tvl}</div>
                </div>
                <div>
                  <div className="text-white/60">24h Volume</div>
                  <div className="text-white font-medium">{pool.volume24h}</div>
                </div>
                <div>
                  <div className="text-white/60 flex items-center gap-1">
                    <TrendingUp size={12} />
                    APR
                  </div>
                  <div className="text-green-400 font-medium">{pool.apr}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h4 className="text-sm font-medium text-blue-300 mb-2">Pool Creation Info</h4>
        <ul className="text-xs text-white/70 space-y-1">
          <li>• Creating a pool requires paying transaction fees</li>
          <li>• You&apos;ll need to add initial liquidity after pool creation</li>
          <li>• Pool fees are distributed to liquidity providers</li>
          <li>• Pools are permanent and cannot be deleted</li>
        </ul>
      </div>
    </div>
  );
}
