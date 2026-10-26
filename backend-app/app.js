
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import YAML from "yaml";

import authRoutes from "./routes/authRoutes.js";

const app = express();

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const contractPath = join(
  currentDirectory,
  "contracts",
  "auth-api.yaml"
);

const openApiDocument = YAML.parse(
  readFileSync(contractPath, "utf8")
);

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Job Portal API is running",
  });
});

app.use("/api/auth", authRoutes);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument)
);

export default app;
