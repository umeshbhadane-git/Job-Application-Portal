import mongoose from "mongoose";

const userSchema = new mongoose.Schema(

    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 50

        },

        email: {
            type: String,
            required: true,
            trim: true,
            unique:true,
            lowercase: true
        },

        password: {
            type: String,
            required: true,
            trim: true,
            select: false
        },

        role: {
            type: String,
            required: true,
            enum: ["jobSeeker", "recruiter", "admin"],
            default: "jobSeeker"
        },

        isActive: {
            type: Boolean,
            default: true
        },
    },
    {
        timestamps: true,
    }

);

const user = mongoose.model("User", userSchema);

export default user;