
import { Router } from "express";

import {
  getProfile,
  updateProfile,
} from "../controllers/profileController.js";

import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

// Get the logged-in user's profile
router.get("/me", authenticate, getProfile);

// Update the logged-in user's profile
router.put("/me", authenticate, updateProfile);

export default router;
