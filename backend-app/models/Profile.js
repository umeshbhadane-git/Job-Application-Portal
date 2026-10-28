
import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      trim: true,
      required: true,
    },
    jobTitle: {
      type: String,
      trim: true,
      required: true,
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      default: "full-time",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    currentlyWorking: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  { _id: true }
);

const educationSchema = new mongoose.Schema(
  {
    institution: {
      type: String,
      trim: true,
      required: true,
    },
    degree: {
      type: String,
      trim: true,
      required: true,
    },
    fieldOfStudy: {
      type: String,
      trim: true,
    },
    startDate: Date,
    endDate: Date,
  },
  { _id: true }
);

const resumeSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
    },
    storageKey: {
      type: String,
    },
    uploadedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    headline: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 25,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    experience: {
      type: [experienceSchema],
      default: [],
    },

    education: {
      type: [educationSchema],
      default: [],
    },

    portfolioUrl: {
      type: String,
      trim: true,
      default: "",
    },

    linkedInUrl: {
      type: String,
      trim: true,
      default: "",
    },

    githubUrl: {
      type: String,
      trim: true,
      default: "",
    },

    resume: {
      type: resumeSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
