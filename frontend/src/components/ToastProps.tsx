import React from 'react';

interface ToastProps {
    message: string;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({message, onClose}) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!message) return null;

    return (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className="relative bg-gray-900 text-white px-6 py-4 rounded shadow-lg">
      {message}
    </div>
  </div>
  );

};

export default Toast;