import React, { useState } from 'react';
import { IPFSService } from '@/services';

interface MessageBubbleProps {
  text: string;
  isMe: boolean;
  timestamp?: string;
  isFile?: boolean;
  fileData?: any;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, isMe, timestamp, isFile, fileData }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!fileData) return;

    setIsDownloading(true);
    try {
      const file = await IPFSService.downloadAndDecryptFile(
        fileData.cid,
        fileData.encryptionKey,
        fileData.iv,
        fileData.fileName
      );

      // Create download link
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${
          isMe
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
        }`}
      >
        {isFile && fileData ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📎</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isMe ? 'text-white' : 'text-gray-900'}`}>
                  {fileData.fileName}
                </p>
                <p className={`text-xs ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                  {(fileData.fileSize / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                isMe
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
          </div>
        ) : (
          <p className={`text-sm leading-relaxed font-medium ${isMe ? 'text-white' : 'text-gray-900'}`}>{text}</p>
        )}
        {timestamp && (
          <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
            {new Date(timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata'
            })}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;