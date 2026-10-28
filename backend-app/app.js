
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import profileRoutes from "./routes/profileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

const app = express();


const currentDirectory = dirname(fileURLToPath(import.meta.url));
const contractsDirectory = join(currentDirectory, "contracts");

app.use(cors());
app.use(express.json());

// NEW: Connect to MongoDB before handling API routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Job Portal API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/resumes", resumeRoutes);

app.use("/api-docs", express.static(contractsDirectory));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerUrl: "/api-docs/openapi.yaml",
  })
);

export default app;
