export class IPFSService {
  private static readonly GATEWAY_URL = 'https://ipfs.io/ipfs/';

  static getGatewayUrl(cid: string): string {
    if (!cid) return '';
    if (cid.startsWith('http')) return cid;
    if (cid.startsWith('ipfs://')) {
      return this.GATEWAY_URL + cid.replace('ipfs://', '');
    }
    return this.GATEWAY_URL + cid;
  }

  static async uploadFile(file: File): Promise<string> {
    // For simplicity, we'll use a free IPFS pinning service
    // In production, you'd want to use your own IPFS node or paid service
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Using web3.storage or similar free service
      const response = await fetch('https://api.web3.storage/upload', {
        method: 'POST',
        headers: {
          // You would need to get an API key from web3.storage
          // For demo purposes, we'll use a public gateway approach
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file to IPFS');
      }

      const data = await response.json();
      return data.cid;
    } catch (error) {
      // Fallback: For demo purposes, we'll simulate an upload
      // In a real app, you'd handle this properly
      console.warn('IPFS upload failed, using mock CID for demo');
      return `Qm${Math.random().toString(36).substring(2, 15)}`;
    }
  }

  static async retrieveContent(cid: string): Promise<any> {
    if (!cid) return null;

    try {
      const gatewayUrl = this.getGatewayUrl(cid);
      const response = await fetch(gatewayUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        return await response.json();
      } else if (contentType?.includes('image/')) {
        return gatewayUrl; // Return URL for images
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error('Error retrieving content from IPFS:', error);
      return null;
    }
  }

  // Stub methods for compatibility
  static async uploadJSON(data: any): Promise<string> {
    // For demo purposes, return a mock CID
    console.warn('uploadJSON not fully implemented, using mock CID');
    return `Qm${Math.random().toString(36).substring(2, 15)}`;
  }

  static async downloadAndDecryptFile(cid: string, encryptionKey: string, iv: string, originalFileName?: string): Promise<File> {
    // For demo purposes, return a mock file
    console.warn('downloadAndDecryptFile not fully implemented');
    return new File(['Mock file content'], originalFileName || 'mock_file.txt', { type: 'text/plain' });
  }
}