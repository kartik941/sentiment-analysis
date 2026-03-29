import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { warmCache } from "./services/api.js";

// Warm the cache immediately on app start.
// All 4 brands + competitive + alerts are pre-fetched in the background.
// By the time the user clicks any tab, data is already in memory.
warmCache();

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
