import { Router } from "express";
import {
  addApplicationNoteController,
  applyForJobController,
  downloadApplicantResumeController,
  getJobApplicationsController,
  getMyApplicationStatsController,
  getMyApplicationsController,
  getRecruiterApplicationStatsController,
  updateApplicationStatusController,
  withdrawApplicationController,
} from "../controllers/applicationController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.use(authenticate);
router.post("/", authorize("jobSeeker"), applyForJobController);
router.get("/me", authorize("jobSeeker"), getMyApplicationsController);
router.get("/me/stats", authorize("jobSeeker"), getMyApplicationStatsController);
router.get(
  "/recruiter/stats",
  authorize("recruiter"),
  getRecruiterApplicationStatsController
);
router.get(
  "/jobs/:jobId",
  authorize("recruiter"),
  getJobApplicationsController
);
router.get(
  "/:applicationId/resume",
  authorize("recruiter"),
  downloadApplicantResumeController
);
router.patch(
  "/:applicationId/status",
  authorize("recruiter"),
  updateApplicationStatusController
);
router.post(
  "/:applicationId/notes",
  authorize("recruiter"),
  addApplicationNoteController
);
router.patch(
  "/:applicationId/withdraw",
  authorize("jobSeeker"),
  withdrawApplicationController
);

export default router;
