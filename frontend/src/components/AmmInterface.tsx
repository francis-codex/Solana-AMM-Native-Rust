'use client';

import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { ArrowUpDown, Settings, Info, Zap } from 'lucide-react';
import SwapInterface from './SwapInterface';
import LiquidityInterface from './LiquidityInterface';
import PoolCreation from './PoolCreation';
import Header from './Header';
import StatsCard from './StatsCard';
import { AmmClient } from '../lib/amm-client';

type TabType = 'swap' | 'liquidity' | 'pools';

export default function AmmInterface() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>('swap');
  const [ammClient, setAmmClient] = useState<AmmClient | null>(null);

  useEffect(() => {
    if (connection) {
      setAmmClient(new AmmClient(connection));
    }
  }, [connection]);

  const tabs = [
    { id: 'swap' as TabType, label: 'Swap', icon: ArrowUpDown },
    { id: 'liquidity' as TabType, label: 'Liquidity', icon: Zap },
    { id: 'pools' as TabType, label: 'Pools', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Stats Section */}
        {connected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
              <StatsCard
                title="Total Value Locked"
                value="$2.4M"
                change={12.5}
                changeLabel="24h"
                icon={<Zap size={16} />}
                delay={0.1}
              />
              <StatsCard
                title="24h Volume"
                value="$156K"
                change={-3.2}
                changeLabel="24h"
                icon={<ArrowUpDown size={16} />}
                delay={0.2}
              />
              <StatsCard
                title="Active Pools"
                value="12"
                change={8.3}
                changeLabel="7d"
                icon={<Settings size={16} />}
                delay={0.3}
              />
              <StatsCard
                title="Avg APR"
                value="12.5%"
                change={2.1}
                changeLabel="7d"
                icon={<Info size={16} />}
                delay={0.4}
              />
            </div>
          </motion.div>
        )}

        <div className="max-w-md mx-auto">
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
          >
            {/* Tab Navigation */}
            <div className="flex border-b border-white/10">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'text-white bg-white/10 border-b-2 border-blue-400'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {!connected ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Connect Your Wallet
                    </h3>
                    <p className="text-white/70 mb-6">
                      Connect your Solana wallet to start trading on our AMM
                    </p>
                  </div>
                  <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-blue-500 !rounded-xl !font-medium !px-8 !py-3 !text-white hover:!from-purple-600 hover:!to-blue-600 !transition-all !duration-200" />
                </div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'swap' && ammClient && (
                    <SwapInterface ammClient={ammClient} />
                  )}
                  {activeTab === 'liquidity' && ammClient && (
                    <LiquidityInterface ammClient={ammClient} />
                  )}
                  {activeTab === 'pools' && ammClient && (
                    <PoolCreation ammClient={ammClient} />
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Info Card */}
          {connected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4"
            >
              <div className="flex items-center gap-2 text-blue-300 mb-2">
                <Info size={16} />
                <span className="text-sm font-medium">Network Info</span>
              </div>
              <div className="text-xs text-white/70 space-y-1">
                <div>Network: Solana Devnet</div>
                <div>Program: {ammClient ? 'Connected' : 'Connecting...'}</div>
                <div className="truncate">
                  Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
