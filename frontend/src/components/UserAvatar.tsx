import React from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = 'User avatar',
  size = 40,
  className = ''
}) => {
  return (
    <div
      className={`rounded-full overflow-hidden bg-gray-300 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="object-cover"
        />
      ) : (
        <span className="text-gray-600 text-lg">👤</span>
      )}
    </div>
  );
};

export default UserAvatar;