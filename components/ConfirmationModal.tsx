import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  item?: {
    task: string;
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
  };
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  type = 'danger',
  item
}) => {
  if (!isOpen) return null;

  const typeConfigs = {
    danger: {
      icon: '🗑️',
      titleColor: 'text-red-600',
      confirmBg: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
      iconBg: 'bg-red-100',
      borderColor: 'border-red-200'
    },
    warning: {
      icon: '⚠️',
      titleColor: 'text-orange-600',
      confirmBg: 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800',
      iconBg: 'bg-orange-100',
      borderColor: 'border-orange-200'
    },
    info: {
      icon: 'ℹ️',
      titleColor: 'text-blue-600',
      confirmBg: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
      iconBg: 'bg-blue-100',
      borderColor: 'border-blue-200'
    }
  };

  const config = typeConfigs[type];

  const priorityConfigs = {
    low: { emoji: '🟢', name: 'ปกติ', color: 'text-green-700 bg-green-50' },
    medium: { emoji: '🟡', name: 'สำคัญ', color: 'text-yellow-700 bg-yellow-50' },
    high: { emoji: '🔴', name: 'เร่งด่วน', color: 'text-red-700 bg-red-50' }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg p-8 max-w-md w-full shadow-xl border ${config.borderColor} relative overflow-hidden animate-in fade-in zoom-in duration-300`}>
        {/* พื้นหลังทางการ */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-16 h-16 ${config.iconBg} rounded-full mb-4`}>
              <span className="text-3xl">{config.icon}</span>
            </div>
            <h3 className={`text-2xl font-bold ${config.titleColor} mb-2`}>
              {title}
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              {message}
            </p>
          </div>

          {/* Item Details */}
          {item && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 mb-2 text-lg">
                    &ldquo;{item.task}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`px-2 py-1 rounded-md font-medium ${priorityConfigs[item.priority].color} border`}>
                      {priorityConfigs[item.priority].emoji} {priorityConfigs[item.priority].name}
                    </span>
                    {item.due_date && (
                      <span className="text-gray-600 flex items-center gap-1">
                        📅 {new Date(item.due_date).toLocaleDateString('th-TH')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning Message */}
          {type === 'danger' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-xl">⚠️</span>
                <p className="text-red-700 font-medium">
                  การดำเนินการนี้ไม่สามารถยกเลิกได้
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-6 py-3 ${config.confirmBg} text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
