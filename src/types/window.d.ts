// Extend the Window interface to include the toast property for global toast notifications
import { ToastContextType } from '../context/ToastContext';

declare global {
  interface Window {
    toast: ToastContextType;
  }
}

export {};