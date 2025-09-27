import { UserModel, MessageModel } from '@/types';
import { IPFSService } from './ipfs';

const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001';

export class ApiService {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', token);
  }

  static async requestAuthMessage(walletAddress: string): Promise<{message: string, nonce: string} | null> {
    try {
      console.log('Requesting auth message for:', walletAddress);
      const response = await fetch(`${API_BASE_URL}/auth/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress }),
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        return { message: data.message, nonce: data.nonce };
      } else {
        console.error('Error requesting auth message:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Exception in requestAuthMessage:', error);
      return null;
    }
  }

  static async verifySignature(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<string | null> {
    try {
      console.log('Verifying signature for:', walletAddress);
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          message,
          signature,
        }),
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        await this.setToken(data.access_token);
        return data.access_token;
      } else {
        console.error('Login failed:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Exception in verifySignature:', error);
      return null;
    }
  }

  static async fetchUserProfile(): Promise<UserModel | null> {
    const token = await this.getToken();
    if (!token) {
      console.log('User not authenticated');
      return null;
    }

    try {
      console.log('Fetching user profile with token:', token);
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        const user = UserModel.fromJson(data);
        if (user.profileCid) {
          try {
            const profileData = await IPFSService.retrieveContent(user.profileCid);
            if (profileData && typeof profileData === 'object') {
              user.displayName = profileData.displayName;
              user.avatarCid = profileData.avatarCid;
            }
          } catch (error) {
            console.error('Failed to load profile from IPFS:', error);
          }
        }
        return user;
      } else {
        console.error('Failed to fetch user profile:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error);
      return null;
    }
  }

  static async updateProfile(updateData: Record<string, any>): Promise<UserModel | null> {
    const token = await this.getToken();
    if (!token) {
      console.log('User not authenticated');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        return UserModel.fromJson(data);
      } else {
        console.error('Failed to update profile:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Exception in updateProfile:', error);
      return null;
    }
  }

  static async fetchAllUsers(): Promise<UserModel[]> {
    const token = await this.getToken();
    if (!token) {
      console.log('User not authenticated - cannot fetch users');
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        return data.users.map((user: any) => UserModel.fromJson(user)).filter((u: UserModel) => u.walletAddress && u.walletAddress.trim());
      } else {
        console.error('Failed to fetch users:', await response.text());
        return [];
      }
    } catch (error) {
      console.error('Exception in fetchAllUsers:', error);
      return [];
    }
  }

  static async fetchUserByWallet(walletAddress: string): Promise<any> {
    const token = await this.getToken();
    if (!token) {
      console.log('User not authenticated - cannot fetch user');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/get_user/${walletAddress}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch user:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Exception in fetchUserByWallet:', error);
      return null;
    }
  }

  static async addFriend(friendWallet: string): Promise<any> {
    const token = await this.getToken();
    if (!token) {
      console.log('User not authenticated');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/friends/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          friend_wallet: friendWallet,
        }),
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to add friend:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Exception in addFriend:', error);
      return null;
    }
  }

  static async removeFriend(friendWallet: string): Promise<any> {
    const token = await this.getToken();
    if (!token) {
      console.log('User not authenticated');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/friends/remove/${friendWallet}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to remove friend:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Exception in removeFriend:', error);
      return null;
    }
  }

  static async addUserByWallet(walletAddress: string): Promise<any> {
    const token = await this.getToken();
    if (!token) {
      console.log('User not authenticated');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat/users/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
        }),
      });

      if (response.ok) {
        return await response.json();
      } else if (response.status === 401) {
        console.error('Token invalid, clearing token');
        localStorage.removeItem('access_token');
        throw new Error('Session expired, please login again');
      } else {
        console.error('Failed to add user:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Exception in addUserByWallet:', error);
      return null;
    }
  }

  static async deleteUser(userId: string): Promise<any> {
    const token = await this.getToken();
    if (!token) {
      console.log('User not authenticated');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else if (response.status === 401) {
        console.error('Token invalid, clearing token');
        localStorage.removeItem('access_token');
        throw new Error('Session expired, please login again');
      } else {
        console.error('Failed to delete user:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Exception in deleteUser:', error);
      return null;
    }
  }
}