import mongoose from "mongoose";

const employerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String },
    company: { type: String },
    post: { type: String }
}, { timestamps: true });

const Employer = mongoose.model("Employer", employerSchema);
export default Employer;
