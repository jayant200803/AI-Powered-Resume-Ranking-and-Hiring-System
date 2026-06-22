import mongoose from "mongoose";

const jobSeekerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String },
    college: { type: String },
    degree: { type: String },
    graduation_year: { type: Number },
    resume_name: { type: String },
    resume_data: { type: Buffer }
}, { timestamps: true });

const JobSeeker = mongoose.model("JobSeeker", jobSeekerSchema);
export default JobSeeker;
