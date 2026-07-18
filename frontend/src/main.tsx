import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeProvider.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { SocketProvider } from './contexts/SocketContext.tsx';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { Toaster } from 'sonner';
import { GamificationListener } from './components/gamification/GamificationListener';
import { initFrontendSentry } from './lib/sentry';

initFrontendSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Keep previous data while fetching new data for smoother UX
      placeholderData: (previousData: any) => previousData,
    },
    mutations: { retry: 0 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="talentnest-theme">
          <AuthProvider>
            <SocketProvider>
              <App />
              <Toaster position="top-right" />
              <GamificationListener />
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
