import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initFrontendSentry(): void {
  if (!SENTRY_DSN) {
    console.log('[Sentry] Frontend disabled — no VITE_SENTRY_DSN set');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    release: `talentnest-frontend@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.httpClientIntegration(),
    ],
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Don't send errors from localhost
      if (window.location.hostname === 'localhost') {
        return null;
      }
      return event;
    },
  });

  console.log('[Sentry] Frontend initialized');
}

export default Sentry;
