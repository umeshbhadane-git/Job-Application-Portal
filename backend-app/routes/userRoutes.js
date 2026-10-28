
import { Router } from "express";

import {
  getMyAccountController,
  updateMyAccountController,
} from "../controllers/userController.js";

import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

// Get the logged-in user's account details
router.get("/me", authenticate, getMyAccountController);

// Update the logged-in user's account details
router.patch("/me", authenticate, updateMyAccountController);

export default router;
