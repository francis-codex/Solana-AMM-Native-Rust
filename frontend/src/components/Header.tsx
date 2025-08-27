'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { Zap, Github, ExternalLink } from 'lucide-react';

export default function Header() {
  const { connected } = useWallet();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b border-white/10 bg-white/5 backdrop-blur-lg"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Solana AMM</h1>
              <p className="text-xs text-white/60">Decentralized Exchange</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="https://explorer.solana.com/address/pDPr3yM12LyCwU9kN8DqgqF1C56Gf9VH5xU4dE4f8Bs?cluster=devnet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
            >
              <ExternalLink size={14} />
              Explorer
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
            >
              <Github size={14} />
              GitHub
            </a>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-4">
            {connected && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-300 font-medium">Connected</span>
              </div>
            )}
            <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-blue-500 !rounded-xl !font-medium !px-4 !py-2 !text-sm !text-white hover:!from-purple-600 hover:!to-blue-600 !transition-all !duration-200" />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
