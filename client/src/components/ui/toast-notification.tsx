import React, { useState, useEffect } from 'react';

type ToastVariant = 'default' | 'success' | 'error' | 'info';

interface ToastNotificationProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
  visible?: boolean;
}

export default function ToastNotification({
  message,
  variant = 'default',
  duration = 3000,
  onClose,
  visible = true,
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(visible);
  
  useEffect(() => {
    setIsVisible(visible);
    
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);
  
  if (!isVisible) return null;
  
  // Define colors based on variant
  let bgColor = 'bg-neutral-800';
  let icon = 'check_circle';
  
  switch (variant) {
    case 'success':
      bgColor = 'bg-neutral-800';
      icon = 'check_circle';
      break;
    case 'error':
      bgColor = 'bg-error';
      icon = 'error';
      break;
    case 'info':
      bgColor = 'bg-primary-700';
      icon = 'info';
      break;
    default:
      bgColor = 'bg-neutral-800';
      icon = 'check_circle';
  }
  
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${bgColor} text-white flex items-center space-x-2 z-50 animate-in fade-in slide-in-from-bottom-5`}>
      <span className="material-icons">{icon}</span>
      <span>{message}</span>
    </div>
  );
}
