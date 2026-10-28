
import { Router } from "express";

import {
  uploadResumeController,
  deleteResumeController,
  downloadResumeController,
} from "../controllers/resumeController.js";

import { authenticate } from "../middlewares/authenticate.js";
import { uploadResume } from "../middlewares/resumeUpload.js";

const router = Router();

// Upload or replace the logged-in user's resume
router.post(
  "/",
  authenticate,
  uploadResume,
  uploadResumeController
);

// Delete the logged-in user's resume
router.delete(
  "/",
  authenticate,
  deleteResumeController
);

router.get(
  "/",
  authenticate,
  downloadResumeController
);

export default router;
