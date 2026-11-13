
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      minlength: 30,
    },

    location: {
      type: String,
      required: [true, "Job location is required"],
      trim: true,
      maxlength: 150,
    },

    workplaceType: {
      type: String,
      enum: ["onsite", "remote", "hybrid"],
      required: true,
      default: "onsite",
    },

    employmentType: {
      type: String,
      enum: [
        "full-time",
        "part-time",
        "contract",
        "internship",
      ],
      required: true,
    },

    experienceLevel: {
      type: String,
      enum: ["entry", "junior", "mid", "senior", "lead"],
      required: true,
      default: "entry",
    },

    minExperience: {
      type: Number,
      min: 0,
      default: 0,
    },

    maxExperience: {
      type: Number,
      min: 0,
      default: null,
    },

    openings: {
      type: Number,
      min: 1,
      default: 1,
    },

    salary: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: "INR",
        uppercase: true,
        trim: true,
      },
    },

    skills: {
      type: [String],
      default: [],
    },

    optionalSkills: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["draft", "published", "closed", "archived"],
      default: "draft",
      index: true,
    },

    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    closingDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ title: "text", company: "text", description: "text" });
jobSchema.index({ recruiterId: 1, status: 1, createdAt: -1 });
jobSchema.pre("validate", function validateExperienceRange() {
  if (
    this.maxExperience !== null &&
    this.maxExperience !== undefined &&
    this.minExperience > this.maxExperience
  ) {
    this.invalidate("maxExperience", "Maximum experience must be at least minimum experience");
  }
});

const Job = mongoose.model("Job", jobSchema);

export default Job;
