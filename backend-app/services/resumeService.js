
import mongoose from "mongoose";
import { Readable } from "node:stream";
import { getResumeBucket } from "../config/gridfs.js";
import Profile from "../models/Profile.js";
import { ObjectId } from "mongodb";

export const uploadResumeForUser = async (userId, file) => {
  if (!file) {
    const error = new Error("Please select a resume to upload");
    error.status = 400;
    throw error;
  }

  const bucket = getResumeBucket();

  // Create a readable stream from the uploaded file buffer.
  const readableStream = Readable.from([file.buffer]);

  const uploadStream = bucket.openUploadStream(file.originalname, {
    metadata: {
      userId: new mongoose.Types.ObjectId(userId),
      contentType: file.mimetype,
      size: file.size,
    },
  });

  // Wait until GridFS finishes saving the file.
  await new Promise((resolve, reject) => {
    readableStream
      .pipe(uploadStream)
      .on("finish", resolve)
      .on("error", reject);

    readableStream.on("error", reject);
  });

  let profile;

  try {
    profile = await Profile.findOne({ userId });

    if (!profile) {
      profile = await Profile.create({ userId });
    }

    // Remove the previous file after the new upload succeeds.
    const previousFileId = profile.resume?.storageKey;

    profile.resume = {
      fileName: file.originalname,
      fileUrl: "",
      storageKey: uploadStream.id.toString(),
      uploadedAt: new Date(),
    };

    await profile.save();

    if (previousFileId && mongoose.isValidObjectId(previousFileId)) {
      try {
        await bucket.delete(
          new mongoose.Types.ObjectId(previousFileId)
        );
      } catch (error) {
        console.error("Could not delete previous resume:", error);
      }
    }

    return profile.resume;
  } catch (error) {
    // Avoid leaving an unreferenced file if profile saving fails.
    try {
      await bucket.delete(uploadStream.id);
    } catch (cleanupError) {
      console.error("Could not clean up uploaded resume:", cleanupError);
    }

    throw error;
  }
};

export const deleteResumeForUser = async (userId) => {
  const profile = await Profile.findOne({ userId });

  if (!profile?.resume?.storageKey) {
    const error = new Error("No resume found for this user");
    error.status = 404;
    throw error;
  }

  const bucket = getResumeBucket();
  const fileId = profile.resume.storageKey;

  if (!mongoose.isValidObjectId(fileId)) {
    const error = new Error("Stored resume reference is invalid");
    error.status = 500;
    throw error;
  }

  await bucket.delete(new mongoose.Types.ObjectId(fileId));

  profile.resume = null;
  await profile.save();

  return true;
};


export const downloadResumeForUser = async (userId) => {
  const profile = await Profile.findOne({ userId });

  if (!profile?.resume?.storageKey) {
    const error = new Error("No resume found for this user");
    error.status = 404;
    throw error;
  }

  if (!mongoose.isValidObjectId(profile.resume.storageKey)) {
    const error = new Error("Stored resume reference is invalid");
    error.status = 500;
    throw error;
  }

  const bucket = getResumeBucket();
  const fileId = new ObjectId(profile.resume.storageKey);

  const files = await bucket.find({ _id: fileId }).toArray();
  const file = files[0];

  if (!file) {
    const error = new Error("Resume file not found in storage");
    error.status = 404;
    throw error;
  }

  return {
    file,
    stream: bucket.openDownloadStream(fileId),
  };
};
