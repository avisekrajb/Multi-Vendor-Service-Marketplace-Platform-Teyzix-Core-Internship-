import React from 'react';

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 animate-slideUp">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title || 'Confirm Action'}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message || 'Are you sure you want to proceed?'}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;