'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ApiService, IPFSService, EthereumService } from '@/services';
import Toast from '@/components/ToastProps';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import ProfileModal from '@/components/ProfileModal';

const ChatPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [xmtpService, setXmtpService] = useState<any>(null);
  const [isXmtpInitialized, setIsXmtpInitialized] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserWallet, setNewUserWallet] = useState<string>('');
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadUserProfile();
    loadUsers();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadXMTP = async () => {
      try {
        const { XMTPService } = await import('@/services/xmtp');
        const service = new XMTPService();
        setXmtpService(service);
        
        // Initialize XMTP if we have a signer
        const signer = EthereumService.getSigner();
        if (signer && !service.isInitialized()) {
          try {
            await service.initialize(signer);
            setIsXmtpInitialized(true);
            console.log('XMTP initialized successfully');
          } catch (error) {
            console.error('XMTP initialization error:', error);
            setToastMessage('Failed to initialize XMTP');
          }
        } else if (service.isInitialized()) {
          setIsXmtpInitialized(true);
        }
      } catch (error) {
        console.error('Failed to load XMTP service:', error);
      }
    };
    loadXMTP();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await ApiService.fetchUserProfile();
      if (user) {
        setCurrentUser(user);
        // Load saved profile picture
        const savedProfile = localStorage.getItem('profile_picture');
        if (savedProfile) {
          setProfilePicture(savedProfile);
        }

        // Initialize XMTP if not already done
        const signer = EthereumService.getSigner();
        if (signer && xmtpService && !xmtpService.isInitialized()) {
          try {
            await xmtpService.initialize(signer);
            setIsXmtpInitialized(true);
            console.log('XMTP initialized in loadUserProfile');
          } catch (error) {
            console.error('XMTP initialization error:', error);
            setToastMessage('Failed to initialize XMTP');
          }
        } else if (xmtpService && xmtpService.isInitialized()) {
          setIsXmtpInitialized(true);
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      router.push('/login');
    }
  };

  const loadUsers = async () => {
    try {
      const fetchedUsers = await ApiService.fetchAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const selectUser = async (user: any) => {
    setSelectedUser(user);
    setIsLoadingMessages(true);
    setMessages([]);

    // Check if XMTP is properly initialized
    if (!xmtpService) {
      setToastMessage('XMTP service not loaded yet');
      setIsLoadingMessages(false);
      return;
    }

    if (!xmtpService.isInitialized()) {
      setToastMessage('XMTP not initialized. Please try again.');
      setIsLoadingMessages(false);
      return;
    }

    try {
      const fetchedMessages = await xmtpService.getMessages(user.wallet_address);
      setMessages(fetchedMessages);

      // Listen for new messages
      if (xmtpService.isInitialized()) {
        xmtpService.listenForMessages(user.wallet_address, (message: any) => {
          setMessages(prev => [...prev, message]);
        });
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
      setToastMessage('Error loading messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };


  const sendMessage = async () => {
    if (!selectedUser || !currentUser) {
      setToastMessage('Please select a user first');
      return;
    }

    if (!xmtpService) {
      setToastMessage('XMTP service not loaded yet');
      return;
    }

    if (!xmtpService.isInitialized()) {
      setToastMessage('XMTP not initialized. Please try again.');
      return;
    }

    const text = messageInput.trim();
    const hasText = text.length > 0;
    const hasFile = selectedFile !== null;

    if (!hasText && !hasFile) return;

    // Clear inputs
    setMessageInput('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      let content = text;

      // If there's a file, upload it to IPFS first
      if (hasFile) {
        const cid = await IPFSService.uploadFile(selectedFile);
        content = hasText ? `${text} [File: ${selectedFile.name}] - IPFS: ${cid}` : `[File: ${selectedFile.name}] - IPFS: ${cid}`;
      }

      // Send message via XMTP
      await xmtpService.sendMessage(selectedUser.wallet_address, content);

      // Add to local messages immediately
      const newMessage = {
        id: Date.now().toString(),
        sender: currentUser.wallet_address,
        receiver: selectedUser.wallet_address,
        content: content,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      setToastMessage('Error sending message');
    }
  };

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // Delete user from database
      const result = await ApiService.deleteUser(userToDelete.id);
      
      if (result) {
        // Remove user from local state
        setUsers(users.filter(u => u.id !== userToDelete.id));
        
        // If the deleted user was selected, clear selection
        if (selectedUser?.id === userToDelete.id) {
          setSelectedUser(null);
          setMessages([]);
        }
        
        setToastMessage(`Removed ${userToDelete.username || userToDelete.wallet_address} from contacts`);
      } else {
        setToastMessage('Failed to remove user from database');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      setToastMessage('Failed to remove user');
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleAddUser = async () => {
    if (!newUserWallet.trim()) {
      setToastMessage('Please enter a wallet address');
      return;
    }

    setIsAddingUser(true);
    try {
      const result = await ApiService.addUserByWallet(newUserWallet.trim());
      
      if (result) {
        // Add user to local state if not already present
        const existingUser = users.find(u => u.id === result.id);
        if (!existingUser) {
          setUsers(prev => [...prev, result]);
        }
        
        setToastMessage(result.message || 'User added successfully');
        setNewUserWallet('');
        setShowAddUserModal(false);
      } else {
        setToastMessage('Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      setToastMessage('Failed to add user');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleProfileUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser);
    setToastMessage('Profile updated successfully');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('profile_picture');
    router.push('/login');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const shortenAddress = (address: string): string => {
    if (!address) return '';
    if (address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">💬</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">💬</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Blockchain Chat</h1>
            <p className="text-sm text-gray-600 font-mono">{shortenAddress(currentUser.wallet_address)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Profile Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            title="View profile"
          >
            👤
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Users</h2>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-2 py-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors text-sm"
                title="Add user by wallet address"
              >
                ➕ Add
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`relative group rounded-lg transition-colors ${
                    selectedUser?.id === user.id
                      ? 'bg-blue-100 border-blue-300'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <button
                    onClick={() => selectUser(user)}
                    className="w-full p-3 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">👤</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {user.username || shortenAddress(user.wallet_address)}
                        </p>
                        <p className="text-xs text-gray-600 font-mono break-all">
                          {user.wallet_address}
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUser(user);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 text-red-500"
                    title="Remove user"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser && (
            <div className="bg-white p-4 border-b border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">👤</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedUser.username || shortenAddress(selectedUser.wallet_address)}
                  </h3>
                  <p className="text-sm text-gray-600 font-mono">
                    {shortenAddress(selectedUser.wallet_address)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {!selectedUser ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <span className="text-6xl mb-4 block">💬</span>
                  <h2 className="text-xl font-semibold mb-2">Welcome to Blockchain Chat!</h2>
                  <p>Select a user from the sidebar to start chatting</p>
                </div>
              </div>
            ) : isLoadingMessages ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <span className="text-4xl mb-4 block">✨</span>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender.toLowerCase() === currentUser.wallet_address.toLowerCase() ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.sender.toLowerCase() === currentUser.wallet_address.toLowerCase()
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender.toLowerCase() === currentUser.wallet_address.toLowerCase()
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="bg-white p-4 border-t border-gray-200">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 text-gray-900"
                    style={{ minHeight: '48px' }}
                  />
                  {selectedFile && (
                    <div className="mt-2 text-sm text-gray-600">
                      📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200"
                  title="Attach file"
                >
                  📎
                </button>

                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() && !selectedFile}
                  className={`px-6 py-3 rounded-xl text-white transition-all duration-200 shadow-md ${
                    (messageInput.trim() || selectedFile)
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 cursor-pointer hover:shadow-lg"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  🚀 Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      
      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={confirmDeleteUser}
          user={{
            ...userToDelete,
            displayNameOrUsername: userToDelete.username || userToDelete.wallet_address
          }}
        />
      )}

      {/* Profile Modal */}
      {currentUser && (
        <ProfileModal
          user={currentUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-black">Add User</h3>
            <p className="text-gray-600 mb-4">
              Enter the wallet address of the user you want to add to your contacts.
            </p>
            <input
              type="text"
              value={newUserWallet}
              onChange={(e) => setNewUserWallet(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUserWallet('');
                }}
                style={{cursor: 'pointer'}}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isAddingUser}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                style={{cursor: 'pointer'}}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
                disabled={isAddingUser || !newUserWallet.trim()}
              >
                {isAddingUser ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;