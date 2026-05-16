import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./configs/db.js";
import validateEnv from "./configs/env.js";
import authRoutes from "./routes/authRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import buildOpenApiSpec from "./utils/openapi.js";
import protect from "./middleware/auth.js";
import { authLimiter, apiLimiter } from "./middleware/rateLimiter.js";
import { searchNotes } from "./controllers/notesController.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use("/register", authLimiter);
app.use("/login", authLimiter);
app.use(apiLimiter);

app.use("/", authRoutes);
app.use("/notes", notesRoutes);
app.get("/search", protect, searchNotes);

app.get("/openapi.json", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.status(200).json(buildOpenApiSpec(baseUrl));
});

app.get("/about", (req, res) => {
  res.status(200).json({
    name: "Apurv",
    email: "apurv@example.com",
    "my features": {
      "Pinned notes": "Users can pin important notes so they appear at the top of their list. Chosen because prioritising critical notes is the most common quality-of-life need in any notes app.",
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

const startServer = async () => {
  validateEnv();
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Notes API running on port ${PORT}`);
    console.log(`ENV: ${process.env.NODE_ENV || "development"}`);
    console.log(`OpenAPI spec: http://localhost:${PORT}/openapi.json`);
  });
};

startServer().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

export default app;
