
import {
  getMyProfile,
  updateMyProfile,
} from "../services/profileService.js";

import { updateProfileSchema } from "../validators/profileValidator.js";

export const getProfile = async (req, res, next) => {
  try {
    const profile = await getMyProfile(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const validation = updateProfileSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Profile validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const profile = await updateMyProfile(
      req.user.id,
      validation.data
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};
