import { Router } from "express";
import {
  getAdminJobsController,
  getAdminUsersController,
  getJobReportsController,
  getPlatformStatsController,
  moderateJobController,
  updateReportStatusController,
  updateUserStatusController,
} from "../controllers/adminController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();
router.use(authenticate, authorize("admin"));

router.get("/stats", getPlatformStatsController);
router.get("/users", getAdminUsersController);
router.patch("/users/:userId/status", updateUserStatusController);
router.get("/jobs", getAdminJobsController);
router.patch("/jobs/:jobId/status", moderateJobController);
router.get("/reports", getJobReportsController);
router.patch("/reports/:reportId", updateReportStatusController);

export default router;
