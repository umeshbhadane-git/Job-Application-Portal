import mongoose from "mongoose";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Profile from "../models/Profile.js";
import User from "../models/User.js";

const statusTransitions = {
  applied: ["under-review", "withdrawn"],
  "under-review": ["shortlisted", "interview-scheduled", "selected", "rejected", "withdrawn"],
  shortlisted: ["interview-scheduled", "selected", "rejected", "withdrawn"],
  "interview-scheduled": ["selected", "rejected", "withdrawn"],
  selected: [],
  rejected: [],
  withdrawn: [],
};

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const requireObjectId = (id, message) => {
  if (!mongoose.isValidObjectId(id)) throw fail(message, 404);
};

const countYearsExperience = (experience = []) => {
  const ranges = experience
    .map((item) => {
      const start = new Date(item.startDate).getTime();
      const end = item.currentlyWorking || !item.endDate
        ? Date.now()
        : new Date(item.endDate).getTime();
      return Number.isFinite(start) && end >= start ? [start, end] : null;
    })
    .filter(Boolean)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let currentEnd = 0;
  for (const [start, end] of ranges) {
    if (end <= currentEnd) continue;
    total += end - Math.max(start, currentEnd);
    currentEnd = end;
  }
  return Math.round((total / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10;
};

export const applyForJob = async (jobId, jobSeekerId) => {
  requireObjectId(jobId, "Job not found");
  const job = await Job.findOne({
    _id: jobId,
    status: "published",
    $or: [{ closingDate: null }, { closingDate: { $gte: new Date() } }],
  });
  if (!job) throw fail("This job is no longer accepting applications", 404);

  const [user, profile] = await Promise.all([
    User.findById(jobSeekerId).select("fullName email isActive"),
    Profile.findOne({ userId: jobSeekerId }),
  ]);
  if (!user || !user.isActive) throw fail("Active job seeker account required", 403);
  if (!profile?.resume?.storageKey) {
    throw fail("Upload a resume to your profile before applying", 400);
  }
  if (!mongoose.isValidObjectId(profile.resume.storageKey)) {
    throw fail("Your saved resume reference is invalid. Please upload it again.", 400);
  }

  try {
    return await Application.create({
      jobId: job._id,
      recruiterId: job.recruiterId,
      jobSeekerId: user._id,
      candidateSnapshot: {
        fullName: user.fullName,
        email: user.email,
        headline: profile.headline,
        location: profile.location,
        phone: profile.phone,
        bio: profile.bio,
        skills: profile.skills,
        experience: countYearsExperience(profile.experience),
        experienceHistory: profile.experience.map((item) => ({
          company: item.company,
          jobTitle: item.jobTitle,
          startDate: item.startDate,
          endDate: item.endDate,
          currentlyWorking: item.currentlyWorking,
          description: item.description,
        })),
        education: profile.education.map((item) => ({
          institution: item.institution,
          degree: item.degree,
          fieldOfStudy: item.fieldOfStudy,
          startDate: item.startDate,
          endDate: item.endDate,
        })),
        portfolioUrl: profile.portfolioUrl,
        linkedInUrl: profile.linkedInUrl,
        githubUrl: profile.githubUrl,
      },
      resumeStorageKey: profile.resume.storageKey,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw fail("You have already applied for this job", 409);
    }
    throw error;
  }
};

export const getMyApplications = async (jobSeekerId) =>
  Application.find({ jobSeekerId })
    .select("-notes -recruiterId -resumeStorageKey")
    .populate("jobId", "title company location employmentType workplaceType")
    .sort({ createdAt: -1 })
    .lean();

export const getMyApplicationStats = async (jobSeekerId) => {
  const [counts, recent] = await Promise.all([
    Application.aggregate([
      { $match: { jobSeekerId: new mongoose.Types.ObjectId(jobSeekerId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Application.find({ jobSeekerId })
      .select("-notes -recruiterId -resumeStorageKey")
      .populate("jobId", "title company location")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);
  return {
    total: counts.reduce((total, item) => total + item.count, 0),
    byStatus: Object.fromEntries(counts.map(({ _id, count }) => [_id, count])),
    recent,
  };
};

const getOwnedJob = async (jobId, recruiterId) => {
  requireObjectId(jobId, "Job not found");
  const job = await Job.findOne({ _id: jobId, recruiterId }).select("_id");
  if (!job) throw fail("Job not found", 404);
  return job;
};

export const getJobApplications = async (jobId, recruiterId, filters) => {
  await getOwnedJob(jobId, recruiterId);
  const query = { jobId };
  if (filters.status) query.status = filters.status;
  if (filters.skill) {
    query["candidateSnapshot.skills"] = {
      $regex: filters.skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }
  const sort = filters.sort === "oldest"
    ? { createdAt: 1 }
    : filters.sort === "experience"
      ? { "candidateSnapshot.experience": -1, createdAt: -1 }
      : { createdAt: -1 };

  return Application.find(query).select("-resumeStorageKey").sort(sort).lean();
};

export const updateApplicationStatus = async (applicationId, recruiterId, status) => {
  requireObjectId(applicationId, "Application not found");
  const application = await Application.findOne({ _id: applicationId, recruiterId });
  if (!application) throw fail("Application not found", 404);
  if (!statusTransitions[application.status]?.includes(status)) {
    throw fail(`Cannot change application status from ${application.status} to ${status}`, 400);
  }
  application.status = status;
  await application.save();
  return application;
};

export const addApplicationNote = async (applicationId, recruiterId, authorId, body) => {
  requireObjectId(applicationId, "Application not found");
  const application = await Application.findOne({ _id: applicationId, recruiterId });
  if (!application) throw fail("Application not found", 404);
  application.notes.push({ authorId, body });
  await application.save();
  return application;
};

export const withdrawApplication = async (applicationId, jobSeekerId) => {
  requireObjectId(applicationId, "Application not found");
  const application = await Application.findOne({ _id: applicationId, jobSeekerId });
  if (!application) throw fail("Application not found", 404);
  if (!statusTransitions[application.status]?.includes("withdrawn")) {
    throw fail("This application can no longer be withdrawn", 400);
  }
  application.status = "withdrawn";
  await application.save();
  return application;
};

export const getRecruiterApplicationStats = async (recruiterId) => {
  const [statuses, jobs] = await Promise.all([
    Application.aggregate([
      { $match: { recruiterId: new mongoose.Types.ObjectId(recruiterId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $match: { recruiterId: new mongoose.Types.ObjectId(recruiterId) } },
      {
        $group: {
          _id: "$jobId",
          applications: { $sum: 1 },
          shortlisted: {
            $sum: { $cond: [{ $eq: ["$status", "shortlisted"] }, 1, 0] },
          },
          selected: {
            $sum: { $cond: [{ $eq: ["$status", "selected"] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
        },
      },
      { $sort: { applications: -1 } },
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $project: {
          jobId: "$_id",
          title: { $ifNull: [{ $first: "$job.title" }, "Job listing unavailable"] },
          applications: 1,
          shortlisted: 1,
          selected: 1,
          rejected: 1,
        },
      },
    ]),
  ]);
  const publishedJobs = await Job.countDocuments({
    recruiterId,
    status: "published",
  });

  return {
    publishedJobs,
    totalApplications: statuses.reduce((total, item) => total + item.count, 0),
    byStatus: Object.fromEntries(statuses.map(({ _id, count }) => [_id, count])),
    byJob: jobs,
  };
};

export const getApplicationResumeForRecruiter = async (applicationId, recruiterId) => {
  requireObjectId(applicationId, "Application not found");
  const application = await Application.findOne({ _id: applicationId, recruiterId });
  if (!application) throw fail("Application not found", 404);
  return application.resumeStorageKey;
};
