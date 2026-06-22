import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    jobSeekerId: { type: mongoose.Schema.Types.ObjectId, ref: "JobSeeker", required: true },
    rank: { type: Number, default: 0 },
    status: { type: String, enum: ["applied", "rejected", "selected"], default: "applied" }
}, { timestamps: true });

// Prevent duplicate applications (same job + same seeker)
applicationSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);
export default Application;
