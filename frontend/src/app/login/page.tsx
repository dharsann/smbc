'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiService, EthereumService } from '@/services';

const LoginPage: React.FC = () => {
  const [currentAddress, setCurrentAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const connectWallet = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const address = await EthereumService.connectWallet();
      if (address) {
        setCurrentAddress(address);
        setIsConnected(true);
      }
    } catch (error) {
      setErrorMessage(`Failed to connect wallet: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    if (!isConnected || isLoading) {
      setErrorMessage('Please connect your wallet first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Step 1: Request message to sign
      const authRequest = await ApiService.requestAuthMessage(currentAddress);
      if (!authRequest) {
        setErrorMessage('Failed to get auth message from server.');
        return;
      }

      // Step 2: Sign the message
      const signature = await EthereumService.signMessage(authRequest.message, currentAddress);
      if (!signature) {
        setErrorMessage('Failed to sign message.');
        return;
      }

      // Step 3: Verify signature and get token
      const result = await ApiService.verifySignature(currentAddress, authRequest.message, signature);

      if (result) {
        router.push('/chat');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMessage(`Login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const shortenAddress = (address: string): string => {
    if (address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">💬</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blockchain Chat</h1>
          <p className="text-gray-600">Connect your wallet to start chatting</p>
        </div>

        <div className="mb-6">
          <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            isConnected
              ? 'bg-green-50 border-green-300 shadow-md'
              : 'bg-gray-50 border-gray-300'
          }`}>
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-3 transition-colors ${
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className={`font-medium ${
                isConnected ? 'text-green-700' : 'text-gray-600'
              }`}>
                {isConnected ? `Connected: ${shortenAddress(currentAddress)}` : 'Wallet not connected'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={connectWallet}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
            ) : (
              <span className="mr-3">🔗</span>
            )}
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>

          <button
            onClick={login}
            disabled={isLoading || !isConnected}
            className={`w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center transition-all duration-200 ${
              isConnected
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading && isConnected ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
            ) : (
              <span className="mr-3">🔐</span>
            )}
            {isLoading && isConnected ? 'Signing In...' : 'Sign In with Signature'}
          </button>
        </div>

        {errorMessage && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Secure authentication using wallet signatures</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;