import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import Userback from "@userback/widget";

// Initialize Userback
const initUserback = async () => {
  const token = "A-bke5ah6cBwLt6mQwA9kQhOX0d";
  await Userback(token);
  console.log("✅ Userback initialized");
};

initUserback();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
