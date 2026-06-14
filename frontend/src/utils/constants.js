export const CATEGORIES = ['All', 'Web Dev', 'Design', 'Marketing', 'Content', 'Video', 'SEO'];

export const REQUEST_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DELIVERED: 'Delivered'
};

export const REQUEST_STATUS_FLOW = [
  REQUEST_STATUS.PENDING,
  REQUEST_STATUS.ACCEPTED,
  REQUEST_STATUS.IN_PROGRESS,
  REQUEST_STATUS.COMPLETED,
  REQUEST_STATUS.DELIVERED
];

export const STATUS_COLORS = {
  'Pending': '#f59e0b',
  'Accepted': '#3b82f6',
  'In Progress': '#8b5cf6',
  'Completed': '#10b981',
  'Delivered': '#06b6d4'
};

export const USER_ROLES = {
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
  ADMIN: 'admin'
};

export const ICONS = ['💻', '🎨', '📱', '✍️', '📊', '🎬', '🔧', '📧', '🌐', '📷', '🎯', '🛒', '🏆', '⚡', '🔑'];

export const formatPrice = (price) => `रू ${Number(price).toLocaleString('ne-NP')}`;

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ne-NP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getInitials = (name) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};