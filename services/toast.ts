import { createRoot } from 'react-dom/client';

type ToastType = 'success' | 'error' | 'info';

interface ToastEvent {
  message: string;
  type: ToastType;
  id: number;
}

// Simple Event Emitter
const listeners: ((toast: ToastEvent) => void)[] = [];

export const toast = {
  success: (message: string) => emit('success', message),
  error: (message: string) => emit('error', message),
  info: (message: string) => emit('info', message),
  onChange: (callback: (toast: ToastEvent) => void) => {
    listeners.push(callback);
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    };
  }
};

const emit = (type: ToastType, message: string) => {
  const id = Date.now();
  listeners.forEach(listener => listener({ message, type, id }));
};
