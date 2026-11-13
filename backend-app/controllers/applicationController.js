import mongoose from "mongoose";
import {
  addApplicationNote,
  applyForJob,
  getApplicationResumeForRecruiter,
  getJobApplications,
  getMyApplications,
  getMyApplicationStats,
  getRecruiterApplicationStats,
  updateApplicationStatus,
  withdrawApplication,
} from "../services/applicationService.js";
import {
  applicationNoteSchema,
  applicationStatusSchema,
  applyForJobSchema,
  recruiterApplicationsQuerySchema,
} from "../validators/applicationValidator.js";
import { downloadResumeByStorageKey } from "../services/resumeService.js";

const respondError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "You have already applied for this job",
    });
  }
  const status = error.statusCode || error.status || 500;
  if (status >= 500) console.error("Application request failed:", error);
  return res.status(status).json({
    success: false,
    message: status >= 500 ? "Internal server error" : error.message,
  });
};

const validateApplicationId = (id) => mongoose.isValidObjectId(id);

const serializeApplication = (application, forJobSeeker = false) => {
  const data = application.toObject ? application.toObject() : { ...application };
  delete data.resumeStorageKey;
  if (forJobSeeker) {
    delete data.recruiterId;
    delete data.notes;
  }
  return data;
};

export const applyForJobController = async (req, res) => {
  const validation = applyForJobSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid job application",
      errors: validation.error.flatten(),
    });
  }
  try {
    const application = await applyForJob(validation.data.jobId, req.user.id);
    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: serializeApplication(application, true),
    });
  } catch (error) {
    return respondError(res, error);
  }
};

export const getMyApplicationsController = async (req, res) => {
  try {
    const applications = await getMyApplications(req.user.id);
    return res.json({ success: true, data: applications });
  } catch (error) {
    return respondError(res, error);
  }
};

export const getMyApplicationStatsController = async (req, res) => {
  try {
    const stats = await getMyApplicationStats(req.user.id);
    return res.json({ success: true, data: stats });
  } catch (error) {
    return respondError(res, error);
  }
};

export const getJobApplicationsController = async (req, res) => {
  try {
    const validation = recruiterApplicationsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid application filters",
        errors: validation.error.flatten(),
      });
    }
    const applications = await getJobApplications(
      req.params.jobId,
      req.user.id,
      validation.data
    );
    return res.json({ success: true, data: applications });
  } catch (error) {
    return respondError(res, error);
  }
};

export const updateApplicationStatusController = async (req, res) => {
  const validation = applicationStatusSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid application status",
      errors: validation.error.flatten(),
    });
  }
  try {
    const application = await updateApplicationStatus(
      req.params.applicationId,
      req.user.id,
      validation.data.status
    );
    return res.json({
      success: true,
      message: "Application status updated",
      data: serializeApplication(application),
    });
  } catch (error) {
    return respondError(res, error);
  }
};

export const addApplicationNoteController = async (req, res) => {
  const validation = applicationNoteSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid application note",
      errors: validation.error.flatten(),
    });
  }
  try {
    const application = await addApplicationNote(
      req.params.applicationId,
      req.user.id,
      req.user.id,
      validation.data.body
    );
    return res.json({
      success: true,
      message: "Internal note added",
      data: serializeApplication(application),
    });
  } catch (error) {
    return respondError(res, error);
  }
};

export const withdrawApplicationController = async (req, res) => {
  try {
    const application = await withdrawApplication(
      req.params.applicationId,
      req.user.id
    );
    return res.json({
      success: true,
      message: "Application withdrawn",
      data: serializeApplication(application, true),
    });
  } catch (error) {
    return respondError(res, error);
  }
};

export const getRecruiterApplicationStatsController = async (req, res) => {
  try {
    const stats = await getRecruiterApplicationStats(req.user.id);
    return res.json({ success: true, data: stats });
  } catch (error) {
    return respondError(res, error);
  }
};

export const downloadApplicantResumeController = async (req, res) => {
  try {
    if (!validateApplicationId(req.params.applicationId)) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }
    const storageKey = await getApplicationResumeForRecruiter(
      req.params.applicationId,
      req.user.id
    );
    const { file, stream } = await downloadResumeByStorageKey(storageKey);
    const safeFileName = file.filename.replace(/["\r\n]/g, "_");
    res.setHeader("Content-Type", file.metadata?.contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);
    stream.on("error", (error) => {
      if (!res.headersSent) return respondError(res, error);
      res.destroy(error);
    });
    return stream.pipe(res);
  } catch (error) {
    return respondError(res, error);
  }
};
