import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employer", required: true },
    job_title: { type: String },
    job_description: { type: String },
    job_role: { type: String }
}, { timestamps: true });

const Job = mongoose.model("Job", jobSchema);
export default Job;
