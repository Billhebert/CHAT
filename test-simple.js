import express from "express";

const PORT = 9999;
const app = express();

app.get("/api/status", (req, res) => {
  res.json({ running: true, port: PORT, time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
});
