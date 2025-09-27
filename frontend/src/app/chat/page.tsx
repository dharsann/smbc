'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ApiService, IPFSService, EthereumService, XMTPService } from '@/services';
import Toast from '@/components/ToastProps';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import ProfileModal from '@/components/ProfileModal';
import Sidebar from '@/components/Sidebar';
import { UserModel } from '@/types';

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
  const [isMessagingReady, setIsMessagingReady] = useState<boolean>(true); // Always ready since using backend
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
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

  // Initialize XMTP when user is loaded
  useEffect(() => {
    const initXMTP = async () => {
      if (currentUser && currentUser.walletAddress) {
        try {
          const signer = EthereumService.getSigner();
          if (signer) {
            const xmtpService = XMTPService.getInstance();
            await xmtpService.initialize(signer);
            setIsMessagingReady(true);
            console.log('XMTP initialized successfully');
          }
        } catch (error) {
          console.error('XMTP initialization failed:', error);
          setIsMessagingReady(false);
        }
      }
    };
    
    initXMTP();
  }, [currentUser]);

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
    if (!currentUser || !currentUser.walletAddress || !user.wallet_address) {
      console.error('Invalid user data for fetching messages');
      setToastMessage('Invalid user data');
      return;
    }

    setSelectedUser(user);
    setIsLoadingMessages(true);
    setMessages([]);

    try {
      // Fetch messages only from XMTP
      let messages = [];
      if (isMessagingReady) {
        try {
          const xmtpService = XMTPService.getInstance();
          const xmtpMessages = await xmtpService.getMessages(user.wallet_address);
          messages = xmtpMessages.map(msg => ({
            id: msg.id,
            sender: msg.sender,
            receiver: user.wallet_address,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
            isFile: msg.isFile,
            fileData: msg.fileData
          }));
        } catch (error) {
          console.error('Error fetching XMTP messages:', error);
        }
      }
      
      // Sort messages by timestamp
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(messages);
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

      // Send message only via XMTP
      if (isMessagingReady) {
        try {
          const xmtpService = XMTPService.getInstance();
          if (hasFile) {
            await xmtpService.sendFileMessage(selectedUser.wallet_address, selectedFile);
          } else {
            await xmtpService.sendMessage(selectedUser.wallet_address, content);
          }
          
          // Add to local messages immediately for better UX
          const newMessage = {
            id: Date.now().toString(),
            sender: currentUser.walletAddress,
            receiver: selectedUser.wallet_address,
            content: content,
            timestamp: new Date().toISOString(),
            isFile: hasFile,
            fileData: hasFile ? {
              fileName: selectedFile.name,
              fileSize: selectedFile.size,
              fileType: selectedFile.type
            } : null
          };
          setMessages(prev => [...prev, newMessage]);
        } catch (error) {
          console.error('XMTP send failed:', error);
          setToastMessage('Failed to send message via XMTP');
        }
      } else {
        setToastMessage('XMTP not ready. Please wait...');
      }

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
    } catch (error: any) {
      console.error('Error removing user:', error);
      if (error.message && error.message.includes('Session expired')) {
        setToastMessage(error.message);
        router.push('/login');
      } else {
        setToastMessage('Failed to remove user');
      }
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
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

  const handleAddUser = async (user: UserModel) => {
    // Add the new user to the state immediately for instant UI update
    setUsers(prev => [...prev, user]);
    setToastMessage('User added successfully');
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">💬</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">De Chat</h1>
            <p className="text-sm text-gray-600 font-mono">{shortenAddress(currentUser.walletAddress)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Messaging Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isMessagingReady ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-xs text-gray-600">
              {isMessagingReady ? 'XMTP Ready' : 'Initializing XMTP...'}
            </span>
          </div>

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
        <Sidebar
          users={users.map(user => UserModel.fromJson({
            id: user.id,
            wallet_address: user.wallet_address,
            username: user.username,
            profile_cid: user.profile_cid,
            is_active: user.is_active,
            is_online: user.is_online,
            created_at: user.created_at
          }))}
          selectedUser={selectedUser ? UserModel.fromJson({
            id: selectedUser.id,
            wallet_address: selectedUser.wallet_address,
            username: selectedUser.username,
            profile_cid: selectedUser.profile_cid,
            is_active: selectedUser.is_active,
            is_online: selectedUser.is_online,
            created_at: selectedUser.created_at
          }) : null}
          currentUser={currentUser ? UserModel.fromJson({
            id: currentUser.id,
            wallet_address: currentUser.wallet_address,
            username: currentUser.username,
            profile_cid: currentUser.profile_cid,
            is_active: currentUser.is_active,
            created_at: currentUser.created_at
          }) : null}
          onSelectUser={(user) => selectUser({
            id: user.id,
            wallet_address: user.walletAddress,
            username: user.username,
            profile_cid: user.profileCid,
            is_active: user.isActive,
            is_online: user.isOnline,
            created_at: user.createdAt.toISOString()
          })}
          onDeleteFriend={(user) => handleDeleteUser({
            id: user.id,
            wallet_address: user.walletAddress,
            username: user.username
          })}
          onAddUser={handleAddUser}
          onError={(message) => {
            setToastMessage(message);
            if (message.includes('Session expired')) {
              router.push('/login');
            }
          }}
          isMessagingReady={isMessagingReady}
        />

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
                  <h2 className="text-xl font-semibold mb-2">Welcome to De Chat!</h2>
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
                    className={`flex ${message.sender.toLowerCase() === currentUser.walletAddress.toLowerCase() ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.sender.toLowerCase() === currentUser.walletAddress.toLowerCase()
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      {message.isFile && message.fileData ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">📎</span>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                message.sender.toLowerCase() === currentUser.walletAddress.toLowerCase() 
                                  ? 'text-white' : 'text-gray-900'
                              }`}>
                                {message.fileData.fileName}
                              </p>
                              <p className={`text-xs ${
                                message.sender.toLowerCase() === currentUser.walletAddress.toLowerCase()
                                  ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {(message.fileData.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <p className={`text-xs mt-1 ${
                        message.sender.toLowerCase() === currentUser.walletAddress.toLowerCase()
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
                  disabled={(!messageInput.trim() && !selectedFile) || !isMessagingReady}
                  className={`px-6 py-3 rounded-xl text-white transition-all duration-200 shadow-md ${
                    (messageInput.trim() || selectedFile) && isMessagingReady
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 cursor-pointer hover:shadow-lg"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                  title="Send message"
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

    </div>
  );
};

export default ChatPage;