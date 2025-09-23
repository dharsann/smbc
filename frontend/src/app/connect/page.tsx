'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { XMTPService } from '../../services';

const ConnectPage: React.FC = () => {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const connectWallet = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      setAddress(walletAddress);

      // Store wallet info
      localStorage.setItem('wallet_address', walletAddress);

      // Initialize XMTP
      const xmtpService = new XMTPService();
      try {
        await xmtpService.initialize(signer);
      } catch (xmtpError: any) {
        console.error('XMTP initialization failed:', xmtpError);
        throw new Error(`XMTP initialization failed: ${xmtpError.message}`);
      }

      // Go to chat
      router.push('/chat');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const shortenAddress = (addr: string) =>
    addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">💬</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Simple XMTP Chat</h1>
          <p className="text-gray-600">Connect your wallet to start chatting</p>
        </div>

        {address && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3" />
              <span className="text-green-700 font-medium">
                Connected: {shortenAddress(address)}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={connectWallet}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectPage;