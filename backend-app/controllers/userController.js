
import {
  getMyAccount,
  updateMyAccount,
} from "../services/userService.js";

import { updateUserSchema } from "../validators/userValidator.js";

export const getMyAccountController = async (req, res, next) => {
  try {
    const user = await getMyAccount(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Account details fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyAccountController = async (req, res, next) => {
  try {
    const validation = updateUserSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Account validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const user = await updateMyAccount(
      req.user.id,
      validation.data
    );

    return res.status(200).json({
      success: true,
      message: "Account details updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
