import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/table.css";
import "./styles/cards.css";
import "./styles/video.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
