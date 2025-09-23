import React, { useState } from 'react';
import { UserModel } from '@/types';
import { ApiService } from '@/services';
import UserAvatar from './UserAvatar';

interface SidebarProps {
  users: UserModel[];
  selectedUser: UserModel | null;
  onSelectUser: (user: UserModel) => void;
  onDeleteFriend?: (user: UserModel) => void;
  onAddUser?: (user: UserModel) => void;
  onError?: (message: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ users, selectedUser, onSelectUser, onDeleteFriend, onAddUser, onError }) => {
  const [searchWallet, setSearchWallet] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  const isValidWalletAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);

  const handleAddUser = async () => {
    if (!searchWallet.trim() || isAddingUser) return;

    if (!isValidWalletAddress(searchWallet.trim())) {
      onError?.('Please enter a valid wallet address');
      return;
    }

    setIsAddingUser(true);
    try {
      const userData = await ApiService.fetchUserByWallet(searchWallet.trim());
      if (userData) {
        const newUser = UserModel.fromJson(userData);
        onAddUser?.(newUser);
        setSearchWallet('');
      }
    } catch (error) {
      onError?.('Failed to add user. Please check the wallet address.');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddUser();
    }
  };

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <h2 className="text-lg font-semibold">👥 Contacts</h2>
        <p className="text-sm opacity-90">
          {users.filter(u => u.isOnline).length} online
        </p>
      </div>

      {/* Add User Section */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchWallet}
            onChange={(e) => setSearchWallet(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter wallet address..."
            className="flex-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddUser}
            disabled={!searchWallet.trim() || isAddingUser}
            style={{cursor: 'pointer'}}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isAddingUser ? '...' : 'Add'}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Add a wallet address to start chatting
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">👤</div>
            <p>No users found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedUser?.id === user.id
                    ? 'bg-blue-50 border-r-4 border-blue-500'
                    : ''
                }`}
                onClick={() => onSelectUser(user)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <UserAvatar src={user.avatarUrl || undefined} size={44} />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                      user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${
                      selectedUser?.id === user.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {user.displayNameOrUsername}
                    </p>
                    <p className="text-xs text-gray-500 truncate font-mono">
                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                    </p>
                  </div>
                  {onDeleteFriend && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFriend(user);
                      }}
                      style={{cursor: 'pointer'}}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove friend"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;