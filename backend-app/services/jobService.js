
import mongoose from "mongoose";
import Job from "../models/Job.js";
import Application from "../models/Application.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 1. Create a new job
export const createJob = async (recruiterId, jobData) => {
  const job = await Job.create({
    ...jobData,
    recruiterId,
    status: "draft",
  });

  return job;
};

// 2. Get all jobs created by a recruiter
export const getRecruiterJobs = async (recruiterId, filters = {}) => {
  const query = { recruiterId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    const search = { $regex: escapeRegex(filters.search), $options: "i" };
    query.$or = [
      { title: search },
      { company: search },
      { location: search },
      { skills: search },
      { optionalSkills: search },
    ];
  }

  const sort = filters.sort === "oldest"
    ? { createdAt: 1 }
    : { createdAt: -1 };
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const [jobs, total, statusCounts] = await Promise.all([
    Job.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Job.countDocuments(query),
    Job.aggregate([
      { $match: { recruiterId: new mongoose.Types.ObjectId(recruiterId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);
  const counts = { draft: 0, published: 0, closed: 0, archived: 0 };
  for (const { _id, count } of statusCounts) counts[_id] = count;
  return {
    jobs,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
    counts,
  };
};

// 3. Get a single job belonging to a recruiter
export const getRecruiterJobById = async (jobId, recruiterId) => {
  const job = await Job.findOne({
    _id: jobId,
    recruiterId,
  });

  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  return job;
};

// 4. Update job details
export const updateJob = async (jobId, recruiterId, updateData) => {
  const job = await getRecruiterJobById(jobId, recruiterId);

  const minExperience = updateData.minExperience ?? job.minExperience;
  const maxExperience =
    updateData.maxExperience === undefined
      ? job.maxExperience
      : updateData.maxExperience;
  if (maxExperience != null && minExperience > maxExperience) {
    const error = new Error(
      "Maximum experience must be at least minimum experience"
    );
    error.statusCode = 400;
    throw error;
  }

  Object.assign(job, updateData);

  await job.save();

  return job;
};

// 5. Publish, close, or return a job to draft
export const updateJobStatus = async (jobId, recruiterId, status) => {
  const job = await getRecruiterJobById(jobId, recruiterId);

  const allowedTransitions = {
    draft: ["published"],
    published: ["closed", "draft"],
    closed: ["archived", "draft"],
    archived: [],
  };
  if (!allowedTransitions[job.status]?.includes(status)) {
    const error = new Error(`Cannot change job status from ${job.status} to ${status}`);
    error.statusCode = 400;
    throw error;
  }

  if (
    status === "draft" &&
    (await Application.exists({ jobId: job._id }))
  ) {
    const error = new Error(
      "A job with applications cannot be returned to draft"
    );
    error.statusCode = 400;
    throw error;
  }

  if (status === "published" && job.status !== "published") {
    job.publishedAt = new Date();
  }

  if (status === "draft") {
    job.publishedAt = null;
  }

  job.status = status;

  await job.save();

  return job;
};

// 6. Delete a job
export const deleteJob = async (jobId, recruiterId) => {
  const job = await getRecruiterJobById(jobId, recruiterId);
  if (await Application.exists({ jobId: job._id })) {
    const error = new Error(
      "This job has applications and cannot be deleted. Close or archive it instead."
    );
    error.statusCode = 409;
    throw error;
  }

  await job.deleteOne();

  return job;
};
