import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./loginEnhancements.css";
import "./i18n/config"; // Import i18n configuration

const reportedFrontendErrors = new Set();
const reportFrontendError = (code, value) => {
  const message = String(value?.message || value || "Unknown frontend error").slice(0, 2000);
  const fingerprint = `${code}:${message}`;
  if (reportedFrontendErrors.has(fingerprint)) return;
  reportedFrontendErrors.add(fingerprint);
  fetch("/api/system-events/frontend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({ level: "Error", code, message, path: window.location.pathname }),
  }).catch(() => {});
};

window.addEventListener("error", (event) => reportFrontendError("FRONTEND-ERROR", event.error || event.message));
window.addEventListener("unhandledrejection", (event) => reportFrontendError("FRONTEND-UNHANDLED-REJECTION", event.reason));

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
