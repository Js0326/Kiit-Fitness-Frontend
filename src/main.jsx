import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { InstallPrompt, UpdatePrompt, OfflineBanner } from './components/PWA';
import ServerWakeup from './components/ServerWakeup';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ServerWakeup>
          <AuthProvider>
            <OfflineBanner />
            <UpdatePrompt />
            <App />
            <InstallPrompt />
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #2a2a2a',
                  fontFamily: 'DM Sans, sans-serif',
                },
                success: { iconTheme: { primary: '#FF6B00', secondary: '#fff' } },
              }}
            />
          </AuthProvider>
        </ServerWakeup>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
