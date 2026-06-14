// frontend/src/components/Common/Avatar.jsx
import React, { useState } from 'react';

const Avatar = ({ src, name, size = 40, className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') {
      return '?';
    }
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = name || 'User';
  const initials = getInitials(displayName);

  // Show image if src exists and no error
  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={displayName}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Show initials if no src or image failed to load
  return (
    <div
      className={`rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
};

export default Avatar;