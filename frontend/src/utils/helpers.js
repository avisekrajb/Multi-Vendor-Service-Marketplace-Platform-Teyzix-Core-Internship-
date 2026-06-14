import { format } from 'date-fns';

// Format currency to NPR
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'रू 0';
  return new Intl.NumberFormat('ne-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  return format(new Date(date), formatStr);
};

// Format relative time
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Validate email
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validate phone (Nepal: 10 digits)
export const isValidPhone = (phone) => {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone);
};

// Validate password (min 6 chars)
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Calculate average rating
export const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
  return (sum / reviews.length).toFixed(1);
};

// Group by status
export const groupByStatus = (items, statusKey = 'status') => {
  if (!items) return {};
  return items.reduce((acc, item) => {
    const status = item[statusKey] || 'Unknown';
    if (!acc[status]) acc[status] = [];
    acc[status].push(item);
    return acc;
  }, {});
};

// Filter by search term
export const filterBySearch = (items, searchTerm, fields = ['name', 'title']) => {
  if (!searchTerm) return items;
  const term = searchTerm.toLowerCase();
  return items.filter(item => 
    fields.some(field => 
      item[field]?.toLowerCase().includes(term)
    )
  );
};

// Sort items
export const sortItems = (items, sortBy, order = 'desc') => {
  if (!items) return [];
  const sorted = [...items];
  sorted.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (sortBy === 'price') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }
    if (order === 'desc') {
      return aVal > bVal ? -1 : 1;
    }
    return aVal < bVal ? -1 : 1;
  });
  return sorted;
};

// Debounce function
export const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

// Download file
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Get file extension
export const getFileExtension = (filename) => {
  return filename?.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2) || '';
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

// Scroll to top
export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Detect mobile device
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};