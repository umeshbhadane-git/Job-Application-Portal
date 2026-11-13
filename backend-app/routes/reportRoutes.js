import { Router } from "express";
import { submitJobReportController } from "../controllers/adminController.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();
router.post("/jobs/:jobId", authenticate, submitJobReportController);

export default router;
