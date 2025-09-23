import React, { useState, useRef } from 'react';
import { UserModel } from '@/types';
import { ApiService, IPFSService } from '@/services';
import UserAvatar from './UserAvatar';

interface ProfileModalProps {
  user: UserModel;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: UserModel) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [username, setUsername] = useState(user.username || '');
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [avatarCid, setAvatarCid] = useState(user.avatarCid || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAvatarUrl = avatarCid ? IPFSService.getGatewayUrl(avatarCid) : user.avatarUrl;

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const cid = await IPFSService.uploadFile(file);
      setAvatarCid(cid);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const profileData = {
        displayName: displayName || null,
        avatarCid: avatarCid || null,
      };
      const profileCid = await IPFSService.uploadJSON(profileData);

      const updatedUser = await ApiService.updateProfile({
        username: username || null,
        profile_cid: profileCid,
      });
      if (updatedUser) {
        onUpdate(updatedUser);
        onClose();
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-black font-bold">Edit Profile</h2>
          <button
            onClick={onClose}
            style={{ cursor: 'pointer' }}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <UserAvatar
              src={currentAvatarUrl || undefined}
              size={80}
              className="mb-4"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
              disabled={isUploading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {isUploading ? 'Uploading...' : 'Change Avatar'}
            </button>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Your Display Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Your Username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Address
              </label>
              <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                {user.walletAddress}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              style={{ cursor: 'pointer' }}
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              style={{ cursor: 'pointer' }}
              onClick={handleSaveProfile}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;