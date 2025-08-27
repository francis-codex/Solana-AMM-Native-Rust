'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { ArrowUpDown, Settings, AlertCircle, Loader2 } from 'lucide-react';
import { AmmClient, TokenInfo } from '../lib/amm-client';
import TokenSelector from './TokenSelector';
import { useNotification } from './NotificationProvider';

interface SwapInterfaceProps {
  ammClient: AmmClient;
}

export default function SwapInterface({ ammClient }: SwapInterfaceProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { showNotification } = useNotification();
  
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [priceImpact, setPriceImpact] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Mock token data for demo
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
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      calculateSwapOutput();
    } else {
      setToAmount('');
      setPriceImpact(0);
    }
  }, [fromToken, toToken, fromAmount]);

  const calculateSwapOutput = () => {
    if (!fromToken || !toToken || !fromAmount) return;

    // Mock calculation for demo
    const inputAmount = parseFloat(fromAmount);
    const mockReserveA = 1000000; // 1M tokens
    const mockReserveB = 2000000; // 2M tokens
    
    const output = ammClient.calculateSwapOutput(
      inputAmount * Math.pow(10, fromToken.decimals),
      mockReserveA,
      mockReserveB
    );
    
    const outputFormatted = (output / Math.pow(10, toToken.decimals)).toFixed(6);
    setToAmount(outputFormatted);

    // Calculate price impact
    const impact = ammClient.calculatePriceImpact(
      inputAmount * Math.pow(10, fromToken.decimals),
      mockReserveA,
      mockReserveB
    );
    setPriceImpact(impact);
  };

  const handleSwap = async () => {
    if (!publicKey || !fromToken || !toToken || !fromAmount) {
      showNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please fill in all fields'
      });
      return;
    }

    setIsLoading(true);
    try {
      const inputAmount = parseFloat(fromAmount) * Math.pow(10, fromToken.decimals);
      const minimumOutput = parseFloat(toAmount) * Math.pow(10, toToken.decimals) * (1 - slippage / 100);

      const swapInstruction = await ammClient.createSwapInstruction(
        publicKey,
        fromToken.mint,
        toToken.mint,
        inputAmount,
        minimumOutput,
        true // Assuming A to B for demo
      );

      const transaction = new Transaction().add(swapInstruction);
      const signature = await sendTransaction(transaction, connection);
      
      showNotification({
        type: 'success',
        title: 'Swap Successful!',
        message: `Transaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`
      });
      
      // Reset form
      setFromAmount('');
      setToAmount('');
    } catch (error) {
      console.error('Swap failed:', error);
      showNotification({
        type: 'error',
        title: 'Swap Failed',
        message: 'Please try again or check your wallet connection'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount('');
  };

  const getPriceImpactColor = () => {
    if (priceImpact < 1) return 'text-green-400';
    if (priceImpact < 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Settings */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white/5 rounded-xl p-4 border border-white/10"
        >
          <h3 className="text-white font-medium mb-3">Swap Settings</h3>
          <div>
            <label className="block text-sm text-white/70 mb-2">
              Slippage Tolerance
            </label>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    slippage === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                placeholder="Custom"
                step="0.1"
                min="0"
                max="50"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* From Token */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-white/70">From</label>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-white/70 hover:text-white transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex justify-between items-center">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="bg-transparent text-2xl font-semibold text-white placeholder-white/30 outline-none flex-1"
            />
            <TokenSelector
              selectedToken={fromToken}
              onSelectToken={setFromToken}
              tokens={mockTokens}
            />
          </div>
        </div>
      </div>

      {/* Flip Button */}
      <div className="flex justify-center">
        <button
          onClick={handleFlipTokens}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
        >
          <ArrowUpDown size={20} className="text-white" />
        </button>
      </div>

      {/* To Token */}
      <div className="space-y-2">
        <label className="text-sm text-white/70">To</label>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex justify-between items-center">
            <input
              type="number"
              value={toAmount}
              readOnly
              placeholder="0.0"
              className="bg-transparent text-2xl font-semibold text-white placeholder-white/30 outline-none flex-1"
            />
            <TokenSelector
              selectedToken={toToken}
              onSelectToken={setToToken}
              tokens={mockTokens}
            />
          </div>
        </div>
      </div>

      {/* Price Impact Warning */}
      {priceImpact > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle size={16} className={getPriceImpactColor()} />
          <span className={getPriceImpactColor()}>
            Price Impact: {priceImpact.toFixed(2)}%
          </span>
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!fromToken || !toToken || !fromAmount || isLoading}
        className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Swapping...
          </>
        ) : (
          'Swap'
        )}
      </button>
    </div>
  );
}
