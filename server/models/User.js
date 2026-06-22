import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    google_id: { type: String, required: true, unique: true },
    role: { type: String, enum: ["none", "job seeker", "employer"], default: "none" }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
