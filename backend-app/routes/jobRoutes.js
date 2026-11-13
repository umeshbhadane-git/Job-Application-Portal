
import { Router } from "express";

import {
  createJobController,
  getRecruiterJobsController,
  getRecruiterJobController,
  updateJobController,
  updateJobStatusController,
  deleteJobController,
} from "../controllers/jobController.js";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

// All job management routes require recruiter authentication.
router.use(authenticate, authorize("recruiter"));

// Create a job
router.post("/", createJobController);

// Get all jobs created by the recruiter
router.get("/", getRecruiterJobsController);

// Get one job
router.get("/:id", getRecruiterJobController);

// Update job details
router.patch("/:id", updateJobController);

// Publish, close, or move to draft
router.patch("/:id/status", updateJobStatusController);

// Delete a job
router.delete("/:id", deleteJobController);

export default router;
