import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./font-sizes.css";
import { Toaster } from "react-hot-toast"; // import Toaster

// Add Google OAuth script
const script = document.createElement("script");
script.src = "https://accounts.google.com/gsi/client";
script.async = true;
script.defer = true;
document.head.appendChild(script);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />

    <Toaster position="top-right" reverseOrder={false} />
  </React.StrictMode>
);
