export interface Message {
  id: string;
  sender: string;
  receiver: string;
  contentCid?: string;
  type: 'text' | 'file';
  fileBytes?: Uint8Array;
  content?: string;
  timestamp: Date;
}

export interface MessageJson {
  id: string;
  sender: string;
  receiver: string;
  content_cid?: string;
  cid?: string;
  type?: 'text' | 'file';
  timestamp: string;
}

export class MessageModel implements Message {
  id: string;
  sender: string;
  receiver: string;
  contentCid?: string;
  type: 'text' | 'file';
  fileBytes?: Uint8Array;
  content?: string;
  timestamp: Date;

  constructor(data: Message) {
    this.id = data.id;
    this.sender = data.sender;
    this.receiver = data.receiver;
    this.contentCid = data.contentCid;
    this.type = data.type ?? 'text';
    this.fileBytes = data.fileBytes;
    this.content = data.content;
    this.timestamp = data.timestamp;
  }

  static fromJson(json: MessageJson): MessageModel {
    return new MessageModel({
      id: json.id ?? '',
      sender: json.sender ?? '',
      receiver: json.receiver ?? '',
      contentCid: json.content_cid ?? json.cid,
      type: json.type ?? 'text',
      timestamp: json.timestamp ? new Date(json.timestamp) : new Date(),
    });
  }

  toJson(): MessageJson {
    return {
      id: this.id,
      sender: this.sender,
      receiver: this.receiver,
      content_cid: this.contentCid,
      type: this.type,
      timestamp: this.timestamp.toISOString(),
    };
  }
}