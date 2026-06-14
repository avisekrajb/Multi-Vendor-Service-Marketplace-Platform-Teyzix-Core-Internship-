import React from 'react';

const statusColors = {
  'Pending': '#f59e0b',
  'Accepted': '#3b82f6',
  'In Progress': '#8b5cf6',
  'Completed': '#10b981',
  'Delivered': '#06b6d4',
  'approved': '#10b981',
  'pending': '#f59e0b',
  'rejected': '#ef4444'
};

const Badge = ({ label, color }) => {
  const bgColor = color || statusColors[label] || '#6b7280';
  
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: `${bgColor}20`, color: bgColor, border: `1px solid ${bgColor}40` }}
    >
      {label}
    </span>
  );
};

export default Badge;