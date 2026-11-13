import mongoose from "mongoose";

const jobReportSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

jobReportSchema.index({ jobId: 1, reporterId: 1 }, { unique: true });

const JobReport = mongoose.model("JobReport", jobReportSchema);

export default JobReport;
