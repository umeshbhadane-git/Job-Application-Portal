import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobSeekerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    candidateSnapshot: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      headline: { type: String, default: "" },
      location: { type: String, default: "" },
      phone: { type: String, default: "" },
      bio: { type: String, default: "" },
      skills: { type: [String], default: [] },
      experience: { type: Number, default: 0 },
      experienceHistory: [{
        company: { type: String, required: true },
        jobTitle: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, default: null },
        currentlyWorking: { type: Boolean, default: false },
        description: { type: String, default: "" },
      }],
      education: [{
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        fieldOfStudy: { type: String, default: "" },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
      }],
      portfolioUrl: { type: String, default: "" },
      linkedInUrl: { type: String, default: "" },
      githubUrl: { type: String, default: "" },
    },
    resumeStorageKey: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "applied",
        "under-review",
        "shortlisted",
        "interview-scheduled",
        "selected",
        "rejected",
        "withdrawn",
      ],
      default: "applied",
      index: true,
    },
    notes: {
      type: [noteSchema],
      default: [],
    },
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true });
applicationSchema.index({ jobSeekerId: 1, createdAt: -1 });
applicationSchema.index({ recruiterId: 1, status: 1, createdAt: -1 });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
