import { ethers } from 'ethers';

export class ENSService {
  private static provider: ethers.JsonRpcProvider | null = null;

  private static getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      // Use Infura or any Ethereum RPC endpoint
      const rpcUrl = process.env.NEXT_PUBLIC_ETH_RPC_URL || 'https://mainnet.infura.io/v3/e801704be72e482eba2a8086b42d82f5';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }
    return this.provider;
  }

  static isValidENS(name: string): boolean {
    // Basic ENS validation - ends with .eth
    return name.toLowerCase().endsWith('.eth') && name.length > 4;
  }

  static isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  static async resolveENS(name: string): Promise<string | null> {
    try {
      if (!this.isValidENS(name)) return null;
      const provider = this.getProvider();
      const address = await provider.resolveName(name);
      return address;
    } catch (error) {
      console.error('ENS resolution error:', error);
      return null;
    }
  }

  static async reverseResolve(address: string): Promise<string | null> {
    try {
      if (!this.isValidAddress(address)) return null;
      const provider = this.getProvider();
      const name = await provider.lookupAddress(address);
      return name;
    } catch (error) {
      console.error('Reverse ENS resolution error:', error);
      return null;
    }
  }

  static async resolveIdentifier(identifier: string): Promise<{ address: string | null; name: string | null }> {
    const cleanId = identifier.trim().toLowerCase();

    // If it's already an address
    if (this.isValidAddress(cleanId)) {
      const name = await this.reverseResolve(cleanId);
      return { address: cleanId, name };
    }

    // If it's an ENS name
    if (this.isValidENS(cleanId)) {
      const address = await this.resolveENS(cleanId);
      return { address, name: cleanId };
    }

    return { address: null, name: null };
  }

  static getDisplayName(identifier: string): string {
    if (this.isValidAddress(identifier)) {
      return `${identifier.slice(0, 6)}...${identifier.slice(-4)}`;
    }
    return identifier;
  }
}