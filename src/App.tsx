
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CanvasEditorPage from "@/pages/CanvasEditorPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/editor/:canvasId" element={<CanvasEditorPage />} />
        <Route path="/editor" element={<CanvasEditorPage />} />
        <Route path="/" element={<CanvasEditorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
