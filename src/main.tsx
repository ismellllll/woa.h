import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import UpdatesPage from "./UpdatesPage";
import { AuthProvider } from "./auth";
import QuestionsPage from "./QuestionsPage"
import NotFoundPage from "./NotFoundPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/updates" element={<UpdatesPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="*" element={<NotFoundPage />} />   {/* 👈 catch-all */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
