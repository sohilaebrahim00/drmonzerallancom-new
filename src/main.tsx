import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";
import { bootstrapNativeApp } from "./native/bootstrap";
import { injectAppHtmlMeta } from "./pwa/injectAppHtmlMeta";
import { registerServiceWorker } from "./pwa/registerServiceWorker";

injectAppHtmlMeta();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

bootstrapNativeApp();
registerServiceWorker();
