import {
  getPublicJobById,
  getPublicJobs,
} from "../services/publicJobService.js";

import { publicJobsQuerySchema } from "../validators/JobValidator.js";

export const getPublicJobsController = async (req, res, next) => {
  try {
    const validation = publicJobsQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid job search filters",
        errors: validation.error.flatten(),
      });
    }

    const result = await getPublicJobs(validation.data);

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
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicJobController = async (req, res, next) => {
  try {
    const job = await getPublicJobById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Job fetched successfully",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};
