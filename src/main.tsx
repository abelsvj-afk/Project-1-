import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import * as Sentry from "@sentry/react";
import { store } from './store';
import App from './App';
import './index.css';

console.log("ELDORIA: Core Boot Sequence Initiated");

Sentry.init({
  dsn: "https://206e07aac98475bf5f0f7936ce6f3371@o4511547934507008.ingest.us.sentry.io/4511547934834688",
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
