
import {
  uploadResumeForUser,
  deleteResumeForUser,
  downloadResumeForUser
} from "../services/resumeService.js";

export const uploadResumeController = async (req, res, next) => {
  try {
    const resume = await uploadResumeForUser(req.user.id, req.file);

    return res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      data: resume,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResumeController = async (req, res, next) => {
  try {
    await deleteResumeForUser(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const downloadResumeController = async (req, res, next) => {
  try {
    const { file, stream } = await downloadResumeForUser(req.user.id);

    const safeFileName = file.filename.replace(/["\r\n]/g, "_");

    res.setHeader(
      "Content-Type",
      file.metadata?.contentType || "application/octet-stream"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFileName}"`
    );

    stream.on("error", (error) => {
      if (!res.headersSent) {
        next(error);
      } else {
        res.destroy(error);
      }
    });

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};
