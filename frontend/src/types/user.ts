export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  displayName?: string;
  avatarCid?: string;
  profileCid?: string;
  isActive: boolean;
  createdAt: Date;
  isOnline?: boolean;
}

export interface UserJson {
  id: string;
  wallet_address: string;
  username?: string;
  profile_cid?: string | null;
  is_active?: boolean;
  is_online?: boolean;
  created_at: string;
}

export class UserModel implements User {
  id: string;
  walletAddress: string;
  username?: string;
  displayName?: string;
  avatarCid?: string;
  profileCid?: string;
  isActive: boolean;
  createdAt: Date;
  isOnline: boolean;

  constructor(data: User) {
    this.id = data.id;
    this.walletAddress = data.walletAddress;
    this.username = data.username;
    this.displayName = data.displayName;
    this.avatarCid = data.avatarCid;
    this.profileCid = data.profileCid;
    this.isActive = data.isActive ?? true;
    this.createdAt = data.createdAt;
    this.isOnline = data.isOnline ?? false;
  }

  static fromJson(json: UserJson): UserModel {
    return new UserModel({
      id: json.id ?? '',
      walletAddress: json.wallet_address ?? '',
      username: json.username,
      displayName: undefined, // Will be loaded from IPFS
      avatarCid: undefined, // Will be loaded from IPFS
      profileCid: json.profile_cid ?? undefined,
      isActive: json.is_active ?? true,
      isOnline: json.is_online ?? false,
      createdAt: json.created_at ? new Date(json.created_at) : new Date(),
    });
  }

  toJson(): UserJson {
    return {
      id: this.id,
      wallet_address: this.walletAddress,
      username: this.username,
      profile_cid: this.profileCid,
      created_at: this.createdAt.toISOString(),
    };
  }

  get avatarUrl(): string | undefined {
    if (!this.avatarCid || this.avatarCid.length === 0) return undefined;
    if (this.avatarCid.startsWith('http')) return this.avatarCid;
    return `https://gateway.pinata.cloud/ipfs/${this.avatarCid}`;
  }

  get displayNameOrUsername(): string {
    return this.displayName && this.displayName.length > 0
      ? this.displayName
      : this.username && this.username.length > 0
        ? this.username
        : this.shortenedAddress;
  }

  get shortenedAddress(): string {
    if (this.walletAddress.length < 10) return this.walletAddress;
    return `${this.walletAddress.substring(0, 6)}...${this.walletAddress.substring(this.walletAddress.length - 4)}`;
  }

  copyWith(updates: Partial<User>): UserModel {
    return new UserModel({
      ...this,
      ...updates,
    });
  }
}