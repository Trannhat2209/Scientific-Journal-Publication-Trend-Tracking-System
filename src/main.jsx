import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./loginEnhancements.css";
import "./i18n/config"; // Import i18n configuration

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
