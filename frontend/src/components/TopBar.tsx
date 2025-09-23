import React from 'react';

interface TopBarProps {
  onLogout: () => void;
  onProfileClick?: () => void;
  isConnected?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ onLogout, onProfileClick, isConnected = false }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center shadow-lg">
      <h1 className="text-xl font-bold">💬 Chat</h1>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 mr-4"> 
          <span className="text-sm opacity-90">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
        {onProfileClick && (
          <button
            onClick={onProfileClick}
            style={{cursor: 'pointer'}}
            className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            👤 Profile 
          </button>
        )}
        <button
          onClick={onLogout}
          style={{cursor: 'pointer'}}
          className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg text-sm transition-colors"
        >
          🚪 Logout
        </button>
      </div>
    </header>
  );
};

export default TopBar;