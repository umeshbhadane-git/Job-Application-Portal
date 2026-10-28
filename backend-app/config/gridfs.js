
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let resumeBucket;

export const getResumeBucket = () => {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB is not connected");
  }

  if (!resumeBucket) {
    resumeBucket = new GridFSBucket(db, {
      bucketName: "resumes",
    });
  }

  return resumeBucket;
};
