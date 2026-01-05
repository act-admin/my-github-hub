import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// App initialization v3
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found in document');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
