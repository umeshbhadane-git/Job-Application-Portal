import {
  adminJobStatusSchema,
  adminJobsQuerySchema,
  adminUsersQuerySchema,
  accountStatusSchema,
  reportStatusSchema,
  jobReportSchema,
} from "../validators/adminValidator.js";
import {
  getAdminJobs,
  getAdminUsers,
  getJobReports,
  getPlatformStats,
  moderateJob,
  submitJobReport,
  updateReportStatus,
  updateUserStatus,
} from "../services/adminService.js";

const respondError = (res, error) => {
  const status = error.statusCode || error.status || 500;
  if (status >= 500) console.error("Administrative request failed:", error);
  return res.status(status).json({
    success: false,
    message: status >= 500 ? "Internal server error" : error.message,
  });
};

const validate = (schema, input, res, message) => {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  res.status(400).json({
    success: false,
    message,
    errors: result.error.flatten(),
  });
  return null;
};

export const getPlatformStatsController = async (_req, res) => {
  try {
    return res.json({ success: true, data: await getPlatformStats() });
  } catch (error) {
    return respondError(res, error);
  }
};

export const getAdminUsersController = async (req, res) => {
  const filters = validate(adminUsersQuerySchema, req.query, res, "Invalid user filters");
  if (!filters) return;
  try {
    return res.json({ success: true, ...await getAdminUsers(filters) });
  } catch (error) {
    return respondError(res, error);
  }
};

export const updateUserStatusController = async (req, res) => {
  const input = validate(accountStatusSchema, req.body, res, "Invalid account status");
  if (!input) return;
  try {
    const user = await updateUserStatus(req.params.userId, req.user.id, input.status);
    return res.json({ success: true, data: user });
  } catch (error) {
    return respondError(res, error);
  }
};

export const getAdminJobsController = async (req, res) => {
  const filters = validate(adminJobsQuerySchema, req.query, res, "Invalid job filters");
  if (!filters) return;
  try {
    return res.json({ success: true, ...await getAdminJobs(filters) });
  } catch (error) {
    return respondError(res, error);
  }
};

export const moderateJobController = async (req, res) => {
  const input = validate(adminJobStatusSchema, req.body, res, "Invalid moderation status");
  if (!input) return;
  try {
    return res.json({ success: true, data: await moderateJob(req.params.jobId, input.status) });
  } catch (error) {
    return respondError(res, error);
  }
};

export const getJobReportsController = async (req, res) => {
  const status = req.query.status === undefined ? "pending" : req.query.status;
  if (!["pending", "reviewed", "dismissed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid report status" });
  }
  try {
    return res.json({ success: true, data: await getJobReports(status) });
  } catch (error) {
    return respondError(res, error);
  }
};

export const updateReportStatusController = async (req, res) => {
  const input = validate(reportStatusSchema, req.body, res, "Invalid report decision");
  if (!input) return;
  try {
    return res.json({
      success: true,
      data: await updateReportStatus(req.params.reportId, input.status),
    });
  } catch (error) {
    return respondError(res, error);
  }
};

export const submitJobReportController = async (req, res) => {
  const input = validate(jobReportSchema, req.body, res, "Invalid job report");
  if (!input) return;
  try {
    return res.status(201).json({
      success: true,
      data: await submitJobReport(req.params.jobId, req.user.id, input.reason),
    });
  } catch (error) {
    return respondError(res, error);
  }
};
