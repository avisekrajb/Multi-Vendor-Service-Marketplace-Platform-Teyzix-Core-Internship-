export const REQUEST_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const REQUEST_STATUS_FLOW = [
  REQUEST_STATUS.PENDING,
  REQUEST_STATUS.ACCEPTED,
  REQUEST_STATUS.IN_PROGRESS,
  REQUEST_STATUS.COMPLETED,
  REQUEST_STATUS.DELIVERED,
];

export const SERVICE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const DISPUTE_STATUS = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};