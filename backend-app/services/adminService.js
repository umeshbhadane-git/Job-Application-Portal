import mongoose from "mongoose";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import JobReport from "../models/JobReport.js";
import User from "../models/User.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getPlatformStats = async () => {
  const [users, jobs, applications, activeJobs] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: "$role",
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
        },
      },
    ]),
    Job.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Job.countDocuments({
      status: "published",
      $or: [{ closingDate: null }, { closingDate: { $gte: new Date() } }],
    }),
  ]);
  return {
    users: Object.fromEntries(users.map(({ _id, total, active }) => [_id, { total, active }])),
    jobs: {
      ...Object.fromEntries(jobs.map(({ _id, count }) => [_id, count])),
      active: activeJobs,
    },
    applications: {
      total: applications.reduce((sum, item) => sum + item.count, 0),
      byStatus: Object.fromEntries(applications.map(({ _id, count }) => [_id, count])),
    },
    pendingReports: await JobReport.countDocuments({ status: "pending" }),
  };
};

export const getAdminUsers = async ({ role, status, search, page, limit }) => {
  const query = {};
  if (role) query.role = role;
  if (status) {
    if (status === "active") {
      query.isActive = true;
      query.$or = [{ accountStatus: "active" }, { accountStatus: { $exists: false } }];
    } else {
      query.accountStatus = status;
    }
  }
  if (search) {
    query.$and = [
      ...(query.$and || []),
      {
        $or: [
          { fullName: { $regex: escapeRegex(search), $options: "i" } },
          { email: { $regex: escapeRegex(search), $options: "i" } },
        ],
      },
    ];
  }
  const [users, total] = await Promise.all([
    User.find(query)
      .select("fullName email role isActive accountStatus createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);
  return { users, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
};

export const updateUserStatus = async (targetId, actorId, status) => {
  if (!mongoose.isValidObjectId(targetId)) throw fail("User not found", 404);
  if (targetId === actorId && status !== "active") {
    throw fail("You cannot deactivate or suspend your own admin account", 400);
  }
  const user = await User.findById(targetId);
  if (!user) throw fail("User not found", 404);
  user.accountStatus = status;
  user.isActive = status === "active";
  await user.save();
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    accountStatus: user.accountStatus,
  };
};

export const getAdminJobs = async ({ status, search, page, limit }) => {
  const query = {};
  if (status) query.status = status;
  if (search) {
    const regex = { $regex: escapeRegex(search), $options: "i" };
    query.$or = [{ title: regex }, { company: regex }, { location: regex }];
  }
  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate("recruiterId", "fullName email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Job.countDocuments(query),
  ]);
  return { jobs, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
};

export const moderateJob = async (jobId, status) => {
  if (!mongoose.isValidObjectId(jobId)) throw fail("Job not found", 404);
  const job = await Job.findById(jobId);
  if (!job) throw fail("Job not found", 404);
  if (job.status === "archived") throw fail("Archived jobs cannot be changed", 400);
  job.status = status;
  await job.save();
  return job;
};

export const submitJobReport = async (jobId, reporterId, reason) => {
  if (!mongoose.isValidObjectId(jobId)) throw fail("Job not found", 404);
  const job = await Job.findOne({ _id: jobId, status: "published" });
  if (!job) throw fail("Job not found or unavailable", 404);
  try {
    return await JobReport.create({ jobId, reporterId, reason });
  } catch (error) {
    if (error.code === 11000) throw fail("You have already reported this job", 409);
    throw error;
  }
};

export const getJobReports = async (status = "pending") =>
  JobReport.find({ status })
    .populate("jobId", "title company location status")
    .sort({ createdAt: -1 })
    .lean();

export const updateReportStatus = async (reportId, status) => {
  if (!mongoose.isValidObjectId(reportId)) throw fail("Report not found", 404);
  const report = await JobReport.findById(reportId);
  if (!report) throw fail("Report not found", 404);
  if (report.status !== "pending") {
    throw fail("This report has already been reviewed", 400);
  }
  report.status = status;
  await report.save();
  return report;
};
