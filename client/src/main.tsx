import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("Main.tsx - Starting React app");
const rootElement = document.getElementById("root");
console.log("Main.tsx - Root element:", rootElement);

if (!rootElement) {
  console.error("Main.tsx - Root element not found!");
} else {
  console.log("Main.tsx - Creating React root and rendering App");
  createRoot(rootElement).render(<App />);
  console.log("Main.tsx - App rendered");
}
