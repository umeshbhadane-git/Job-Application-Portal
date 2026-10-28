
import User from "../models/User.js";

export const getMyAccount = async (userId) => {
  const user = await User.findById(userId).select(
    "fullName email role isActive createdAt updatedAt"
  );

  if (!user) {
    const error = new Error("User account not found");
    error.status = 404;
    throw error;
  }

  return user;
};

export const updateMyAccount = async (userId, data) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User account not found");
    error.status = 404;
    throw error;
  }

  if (data.email !== undefined && data.email !== user.email) {
    const existingUser = await User.findOne({
      email: data.email,
      _id: { $ne: userId },
    });

    if (existingUser) {
      const error = new Error("Email is already registered");
      error.status = 409;
      throw error;
    }
  }

  if (data.fullName !== undefined) {
    user.fullName = data.fullName;
  }

  if (data.email !== undefined) {
    user.email = data.email;
  }

  await user.save();

  return getMyAccount(userId);
};

