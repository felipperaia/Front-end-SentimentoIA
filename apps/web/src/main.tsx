import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";

import "./index.css";

const queryClient = new QueryClient();

if (
  import.meta.env.PROD &&
  String(import.meta.env.VITE_ENABLE_PWA ?? "true") !== "false" &&
  globalThis.window !== undefined &&
  "serviceWorker" in navigator
) {
  globalThis.window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("[PWA] Service worker registration failed", error);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
