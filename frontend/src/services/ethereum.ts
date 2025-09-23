import { ethers } from 'ethers';

export class EthereumService {
  private static provider?: ethers.BrowserProvider;
  private static signer?: ethers.Signer;

  static async connectWallet(): Promise<string | null> {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.error('MetaMask not found');
      return null;
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      const address = await this.signer.getAddress();
      return address;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return null;
    }
  }

  static async signMessage(message: string, address?: string): Promise<string | null> {
    if (!this.signer) {
      console.error('Wallet not connected');
      return null;
    }

    try {
      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      return null;
    }
  }

  static getSigner(): ethers.Signer | null {
    return this.signer || null;
  }

  static getProvider(): ethers.BrowserProvider | null {
    return this.provider || null;
  }
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}