import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global error handler to suppress browser extension errors
window.addEventListener('error', (event) => {
  // Suppress browser extension errors (React DevTools, Redux DevTools, etc.)
  if (event.message && event.message.includes('message channel closed')) {
    event.preventDefault();
    console.warn('⚠️ Browser extension error suppressed:', event.message);
    return false;
  }
});

// Handle unhandled promise rejections from browser extensions
window.addEventListener('unhandledrejection', (event) => {
  // Suppress browser extension promise rejection errors
  if (event.reason && typeof event.reason === 'string' && event.reason.includes('message channel closed')) {
    event.preventDefault();
    console.warn('⚠️ Browser extension promise rejection suppressed:', event.reason);
    return false;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
