import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock API endpoint to match user's request structure
  // Note: For actual AI verification in this preview, the frontend calls Gemini directly
  app.post("/api/predict", upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // In a real production app with Python, this would call the scikit-learn model
    // For this preview, we handle verification in the frontend using Gemini API
    res.json({ 
      prediction: "Processing...", 
      confidence: 0.0,
      note: "For live AI verification, please use the frontend upload which connects directly to Gemini."
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
