import "modern-normalize";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ModalFormPage from "./ModalFormPage";
import { ModalProvider } from "./modal/ModalHost";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ModalProvider>
      <ModalFormPage />
    </ModalProvider>
  </StrictMode>
);
