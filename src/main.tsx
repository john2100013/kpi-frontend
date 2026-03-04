import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import { ToastProvider } from './context/ToastContext'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'

// Global error handler to suppress browser extension errors
window.addEventListener('error', (event) => {
  // Suppress browser extension errors (React DevTools, Redux DevTools, etc.)
  if (event.message && event.message.includes('message channel closed')) {
    event.preventDefault();
    return false;
  }
});

// Handle unhandled promise rejections from browser extensions
window.addEventListener('unhandledrejection', (event) => {
  // Suppress browser extension promise rejection errors
  if (event.reason && typeof event.reason === 'string' && event.reason.includes('message channel closed')) {
    event.preventDefault();
    return false;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </Provider>
  </StrictMode>,
)
