export class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;

  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptFile(file: File, key: CryptoKey): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    const fileData = await file.arrayBuffer();

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv as BufferSource,
      },
      key,
      fileData
    );

    return { encryptedData, iv };
  }

  static async decryptFile(encryptedData: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer> {
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv as BufferSource,
      },
      key,
      encryptedData
    );

    return decryptedData;
  }

  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  static async importKey(keyData: string): Promise<CryptoKey> {
    const keyBytes = new Uint8Array(atob(keyData).split('').map(c => c.charCodeAt(0)));
    return await crypto.subtle.importKey(
      'raw',
      keyBytes,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static ivToString(iv: Uint8Array): string {
    return btoa(String.fromCharCode(...iv));
  }

  static stringToIv(ivString: string): Uint8Array {
    return new Uint8Array(atob(ivString).split('').map(c => c.charCodeAt(0)));
  }
}