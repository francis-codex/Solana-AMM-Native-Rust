'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { Plus, Minus, Loader2, Info } from 'lucide-react';
import { AmmClient, TokenInfo } from '../lib/amm-client';
import TokenSelector from './TokenSelector';

interface LiquidityInterfaceProps {
  ammClient: AmmClient;
}

export default function LiquidityInterface({ ammClient }: LiquidityInterfaceProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [lpTokenAmount, setLpTokenAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [poolExists, setPoolExists] = useState(false);

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
    }
  ];

  useEffect(() => {
    if (tokenA && tokenB && amountA && mode === 'add') {
      // Calculate proportional amount for token B
      const ratio = 2; // Mock ratio
      const calculatedAmountB = (parseFloat(amountA) * ratio).toFixed(6);
      setAmountB(calculatedAmountB);
    }
  }, [tokenA, tokenB, amountA, mode]);

  const handleAddLiquidity = async () => {
    if (!publicKey || !tokenA || !tokenB || !amountA || !amountB) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const maxTokenA = parseFloat(amountA) * Math.pow(10, tokenA.decimals);
      const maxTokenB = parseFloat(amountB) * Math.pow(10, tokenB.decimals);
      const minLpTokens = 0; // Calculate minimum LP tokens

      // For demo, we'll just show success
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Liquidity added successfully!');
      
      // Reset form
      setAmountA('');
      setAmountB('');
    } catch (error) {
      console.error('Add liquidity failed:', error);
      alert('Add liquidity failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!publicKey || !tokenA || !tokenB || !lpTokenAmount) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // For demo, we'll just show success
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Liquidity removed successfully!');
      
      // Reset form
      setLpTokenAmount('');
      setAmountA('');
      setAmountB('');
    } catch (error) {
      console.error('Remove liquidity failed:', error);
      alert('Remove liquidity failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
        <button
          onClick={() => setMode('add')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            mode === 'add'
              ? 'bg-white/10 text-white'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <Plus size={16} />
          Add Liquidity
        </button>
        <button
          onClick={() => setMode('remove')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            mode === 'remove'
              ? 'bg-white/10 text-white'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <Minus size={16} />
          Remove Liquidity
        </button>
      </div>

      {mode === 'add' ? (
        <motion.div
          key="add"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* Token A Input */}
          <div className="space-y-2">
            <label className="text-sm text-white/70">Token A</label>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-center">
                <input
                  type="number"
                  value={amountA}
                  onChange={(e) => setAmountA(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent text-xl font-semibold text-white placeholder-white/30 outline-none flex-1"
                />
                <TokenSelector
                  selectedToken={tokenA}
                  onSelectToken={setTokenA}
                  tokens={mockTokens}
                />
              </div>
            </div>
          </div>

          {/* Token B Input */}
          <div className="space-y-2">
            <label className="text-sm text-white/70">Token B</label>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-center">
                <input
                  type="number"
                  value={amountB}
                  onChange={(e) => setAmountB(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent text-xl font-semibold text-white placeholder-white/30 outline-none flex-1"
                />
                <TokenSelector
                  selectedToken={tokenB}
                  onSelectToken={setTokenB}
                  tokens={mockTokens}
                />
              </div>
            </div>
          </div>

          {/* Pool Info */}
          {tokenA && tokenB && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-300 mb-2">
                <Info size={16} />
                <span className="text-sm font-medium">Pool Information</span>
              </div>
              <div className="text-xs text-white/70 space-y-1">
                <div>Pool: {tokenA.symbol}/{tokenB.symbol}</div>
                <div>Your share: 0.00%</div>
                <div>Pool fee: 0.3%</div>
              </div>
            </div>
          )}

          {/* Add Liquidity Button */}
          <button
            onClick={handleAddLiquidity}
            disabled={!tokenA || !tokenB || !amountA || !amountB || isLoading}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Adding Liquidity...
              </>
            ) : (
              'Add Liquidity'
            )}
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="remove"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* LP Token Amount */}
          <div className="space-y-2">
            <label className="text-sm text-white/70">LP Token Amount</label>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <input
                type="number"
                value={lpTokenAmount}
                onChange={(e) => setLpTokenAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-xl font-semibold text-white placeholder-white/30 outline-none"
              />
            </div>
          </div>

          {/* Token Pair Selection */}
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

          {/* Expected Output */}
          {lpTokenAmount && tokenA && tokenB && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-sm font-medium text-white mb-3">You will receive:</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/70">{tokenA.symbol}</span>
                  <span className="text-white font-medium">
                    {(parseFloat(lpTokenAmount) * 0.5).toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">{tokenB.symbol}</span>
                  <span className="text-white font-medium">
                    {(parseFloat(lpTokenAmount) * 1.0).toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Remove Liquidity Button */}
          <button
            onClick={handleRemoveLiquidity}
            disabled={!tokenA || !tokenB || !lpTokenAmount || isLoading}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Removing Liquidity...
              </>
            ) : (
              'Remove Liquidity'
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
