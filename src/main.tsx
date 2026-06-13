import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import * as Sentry from "@sentry/react";
import { store } from './store';
import App from './App';
import './index.css';

console.log("ELDORIA: Core Boot Sequence Initiated");

// --- GLOBAL DIAGNOSTIC LOGGING (UI Interactions) ---
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const interactiveElement = target.closest('button, a, [role="button"]');
  
  if (interactiveElement) {
    const label = interactiveElement.getAttribute('aria-label') || 
                  interactiveElement.textContent?.trim().substring(0, 30) || 
                  'Unknown Element';
    const id = interactiveElement.id || 'no-id';
    
    console.log(`%c UI INTERACTION: [${interactiveElement.tagName}] "${label}" (ID: ${id})`, 'color: #FF9800; font-weight: bold;');
    
    Sentry.addBreadcrumb({
      category: 'ui.click',
      message: `Clicked ${interactiveElement.tagName}: ${label}`,
      data: {
        id,
        tagName: interactiveElement.tagName,
        classes: interactiveElement.className,
      },
      level: 'info',
    });
  }
}, true); // Use capture phase to ensure we catch it before other handlers if needed

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
