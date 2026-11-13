import { Router } from "express";

import {
  getPublicJobController,
  getPublicJobsController,
} from "../controllers/publicJobController.js";

const router = Router();

router.get("/", getPublicJobsController);
router.get("/:id", getPublicJobController);

export default router;
