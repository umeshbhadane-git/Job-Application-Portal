import mongoose from "mongoose";

import Job from "../models/Job.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const availableJobFilter = () => ({
  status: "published",
  $or: [
    { closingDate: null },
    { closingDate: { $gte: new Date() } },
  ],
});

export const getPublicJobs = async (filters = {}) => {
  const query = availableJobFilter();

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  if (filters.location) {
    query.location = {
      $regex: escapeRegex(filters.location),
      $options: "i",
    };
  }

  if (filters.employmentType) {
    query.employmentType = filters.employmentType;
  }

  if (filters.workplaceType) query.workplaceType = filters.workplaceType;
  if (filters.skill) {
    const skillMatch = {
      $regex: escapeRegex(filters.skill),
      $options: "i",
    };
    query.$and = [
      ...(query.$and || []),
      { $or: [{ skills: skillMatch }, { optionalSkills: skillMatch }] },
    ];
  }
  if (filters.maxExperience !== undefined) {
    query.minExperience = { $lte: filters.maxExperience };
  }
  if (filters.minExperience !== undefined) {
    query.$and = [
      ...(query.$and || []),
      {
        $or: [
          { maxExperience: null },
          { maxExperience: { $gte: filters.minExperience } },
        ],
      },
    ];
  }

  const sort = {
    newest: { publishedAt: -1, createdAt: -1 },
    oldest: { publishedAt: 1, createdAt: 1 },
    "salary-asc": { "salary.min": 1, publishedAt: -1 },
    "salary-desc": { "salary.max": -1, publishedAt: -1 },
  }[filters.sort || "newest"];
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Job.countDocuments(query),
  ]);
  return {
    jobs,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const getPublicJobById = async (jobId) => {
  if (!mongoose.isValidObjectId(jobId)) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  const job = await Job.findOne({
    _id: jobId,
    ...availableJobFilter(),
  });

  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  return job;
};
