
import {
  createJob,
  getRecruiterJobs,
  getRecruiterJobById,
  updateJob,
  updateJobStatus,
  deleteJob,
} from "../services/jobService.js";

import {
  createJobSchema,
  recruiterJobsQuerySchema,
  updateJobSchema,
  updateJobStatusSchema,
} from "../validators/JobValidator.js";

// Create a job
export const createJobController = async (req, res, next) => {
  try {
    const validation = createJobSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const job = await createJob(req.user.id, validation.data);

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// Get all jobs created by the logged-in recruiter
export const getRecruiterJobsController = async (req, res, next) => {
  try {
    const validation = recruiterJobsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid job listing filters",
        errors: validation.error.flatten(),
      });
    }

    const result = await getRecruiterJobs(req.user.id, validation.data);

    return res.status(200).json({
      success: true,
      message: "Jobs fetched successfully",
      data: result.jobs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      },
      counts: result.counts,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single job
export const getRecruiterJobController = async (req, res, next) => {
  try {
    const job = await getRecruiterJobById(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Job fetched successfully",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// Update job details
export const updateJobController = async (req, res, next) => {
  try {
    const validation = updateJobSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const job = await updateJob(
      req.params.id,
      req.user.id,
      validation.data
    );

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// Publish, close, or move a job to draft
export const updateJobStatusController = async (req, res, next) => {
  try {
    const validation = updateJobStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid job status",
        errors: validation.error.flatten(),
      });
    }

    const job = await updateJobStatus(
      req.params.id,
      req.user.id,
      validation.data.status
    );

    return res.status(200).json({
      success: true,
      message: `Job ${validation.data.status} successfully`,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a job
export const deleteJobController = async (req, res, next) => {
  try {
    await deleteJob(req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
