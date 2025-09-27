import { ethers } from 'ethers';
import { Client, DecodedMessage } from '@xmtp/xmtp-js';

interface ParsedMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isFile: boolean;
  fileData: any;
}

export class XMTPService {
  private client: any = null;
  private signer: ethers.Signer | null = null;
  private static instance: XMTPService | null = null;

  static getInstance(): XMTPService {
    if (!XMTPService.instance) {
      XMTPService.instance = new XMTPService();
    }
    return XMTPService.instance;
  }

  async initialize(signer: ethers.Signer): Promise<void> {
    console.log('XMTP: Initializing with signer', signer);
    this.signer = signer;
    try {
      this.client = await Client.create(signer);
      console.log('XMTP: Client created successfully');
    } catch (error) {
      console.error('XMTP: Failed to create client', error);
      throw error;
    }
  }

  async sendMessage(peerAddress: string, message: string): Promise<void> {
    console.log('XMTP: Sending message to', peerAddress, 'content:', message);
    if (!this.client) {
      console.error('XMTP: Client not initialized');
      throw new Error('XMTP client not initialized');
    }

    try {
      // Check if conversation exists first
      const conversations = await this.client.conversations.list();
      let conversation = conversations.find((conv: any) =>
        conv.peerAddress.toLowerCase() === peerAddress.toLowerCase()
      );
      
      // If no existing conversation, create new one
      if (!conversation) {
        conversation = await this.client.conversations.newConversation(peerAddress);
      }
      
      console.log('XMTP: Conversation created');
      await conversation.send(message);
      console.log('XMTP: Message sent successfully');
    } catch (error) {
      console.error('XMTP: Failed to send message', error);
      throw error;
    }
  }

  async getMessages(peerAddress: string): Promise<ParsedMessage[]> {
    console.log('XMTP: Getting messages from', peerAddress);
    if (!this.client) {
      console.error('XMTP: Client not initialized for getMessages');
      throw new Error('XMTP client not initialized');
    }

    try {
      // First check if conversation exists
      const conversations = await this.client.conversations.list();
      let conversation = conversations.find((conv: any) =>
        conv.peerAddress.toLowerCase() === peerAddress.toLowerCase()
      );
      
      // If no existing conversation, create new one
      if (!conversation) {
        console.log('XMTP: Creating new conversation with', peerAddress);
        conversation = await this.client.conversations.newConversation(peerAddress);
      }
      
      console.log('XMTP: Conversation created for getMessages');
      const messages: DecodedMessage[] = await conversation.messages();
      console.log('XMTP: Retrieved', messages.length, 'messages');
      return messages.map(msg => this.parseMessage(msg)).reverse(); // Reverse to show newest first
    } catch (error) {
      console.error('XMTP: Error getting messages:', error);
      return [];
    }
  }

  async debugXMTPStatus(): Promise<void> {
    console.log('=== XMTP Debug Info ===');
    console.log('Client initialized:', !!this.client);
    console.log('Signer available:', !!this.signer);
    
    if (this.client) {
      try {
        const address = await this.signer?.getAddress();
        console.log('Wallet address:', address);
        
        const conversations = await this.client.conversations.list();
        console.log('Total conversations:', conversations.length);
        
        conversations.forEach((conv: any, index: number) => {
          console.log(`Conversation ${index + 1}:`, conv.peerAddress);
        });
      } catch (error) {
        console.error('Error getting debug info:', error);
      }
    }
    console.log('=====================');
  }

  private parseMessage(msg: DecodedMessage): ParsedMessage {
    let content = msg.content;
    let isFile = false;
    let fileData = null;

    try {
      const parsed = JSON.parse(msg.content);
      if (parsed.file && parsed.file.cid) {
        isFile = true;
        fileData = parsed.file;
        content = `[File: ${parsed.file.fileName}]`;
      }
    } catch (e) {
      // Not JSON, treat as text
    }

    return {
      id: msg.id,
      sender: msg.senderAddress,
      content,
      timestamp: msg.sent,
      isFile,
      fileData
    };
  }

  async listenForMessages(peerAddress: string, callback: (message: ParsedMessage) => void): Promise<void> {
    if (!this.client) throw new Error('XMTP client not initialized');

    try {
      const conversation = await this.client.conversations.newConversation(peerAddress);
      const stream = await conversation.streamMessages();
      for await (const message of stream) {
        callback(this.parseMessage(message));
      }
    } catch (error) {
      console.error('Error listening for messages:', error);
    }
  }

  async sendFileMessage(peerAddress: string, file: File): Promise<void> {
    if (!this.client) throw new Error('XMTP client not initialized');

    try {
      // Import IPFS service dynamically to avoid circular imports
      const { IPFSService } = await import('./ipfs');

      // Upload file to IPFS (without encryption for simplicity)
      const cid = await IPFSService.uploadFile(file);

      // Create file message JSON
      const fileMessage = {
        file: {
          cid,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      };

      // Send as JSON string
      const conversation = await this.client.conversations.newConversation(peerAddress);
      await conversation.send(JSON.stringify(fileMessage));
    } catch (error) {
      console.error('Error sending file message:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    const initialized = this.client !== null;
    console.log('XMTP: isInitialized check:', initialized);
    return initialized;
  }
}