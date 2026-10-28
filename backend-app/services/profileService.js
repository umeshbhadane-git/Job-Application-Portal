
import Profile from "../models/Profile.js";

const getOrCreateProfile = async (userId) => {
  let profile = await Profile.findOne({ userId });

  if (!profile) {
    profile = await Profile.create({ userId });
  }

  return profile;
};

export const getMyProfile = async (userId) => {
  return getOrCreateProfile(userId);
};

export const updateMyProfile = async (userId, data) => {
  const profile = await getOrCreateProfile(userId);

  const allowedFields = [
    "headline",
    "phone",
    "location",
    "bio",
    "skills",
    "experience",
    "education",
    "portfolioUrl",
    "linkedInUrl",
    "githubUrl",
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      profile[field] = data[field];
    }
  }

  await profile.save();

  return profile;
};
