import "./instrument.js";
import * as Sentry from "@sentry/node";

try {
  console.log("Triggering intentional error...");
  foo(); 
} catch (e) {
  console.log("Error caught, sending to Sentry:", e.message);
  Sentry.captureException(e);
}

// Sentry sends data asynchronously; we wait a bit to ensure it's sent before the process ends.
setTimeout(() => {
  console.log("Verification script complete.");
  process.exit(0);
}, 2000);
