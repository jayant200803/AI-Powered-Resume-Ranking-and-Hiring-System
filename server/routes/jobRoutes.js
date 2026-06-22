import Job from "../models/Job.js";
import Employer from "../models/Employer.js";
import Application from "../models/Application.js";
import JobSeeker from "../models/JobSeeker.js";

export const jobRoutes = (app, isLoggedIn) => {

    // GET /find-job
    app.get("/find-job", isLoggedIn, async (req, res) => {
        try {
            const jobs = await Job.find()
                .populate({ path: "employerId", select: "company" })
                .lean();

            const result = jobs.map(j => ({
                job_id: j._id,
                job_title: j.job_title,
                job_description: j.job_description,
                job_role: j.job_role,
                company: j.employerId?.company || null,
            }));

            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /add-job
    app.post("/add-job", isLoggedIn, async (req, res) => {
        try {
            const { job_title, job_description, job_role } = req.body;
            const userId = req.user._id;

            const employer = await Employer.findOne({ userId });
            if (!employer) {
                return res.status(400).json({ "Success": "false", message: "Employer profile not found" });
            }

            await Job.create({ employerId: employer._id, job_title, job_description, job_role });
            res.json({ "Success": "true" });
        } catch (err) {
            console.error(err.message);
            res.json({ "Success": "false" });
        }
    });

    // DELETE /job/:job_id
    app.delete("/job/:job_id", isLoggedIn, async (req, res) => {
        try {
            const { job_id } = req.params;

            // Delete all applications first (mirrors FK cascade)
            await Application.deleteMany({ jobId: job_id });
            await Job.findByIdAndDelete(job_id);

            res.json({ success: true, message: "Job deleted successfully" });
        } catch (err) {
            console.error("Delete job error:", err.message);
            res.status(500).json({ success: false, message: "Failed to delete job" });
        }
    });

    // POST /job-apply
    app.post("/job-apply", isLoggedIn, async (req, res) => {
        try {
            const userId = req.user._id;
            const { job_id } = req.body;

            const seeker = await JobSeeker.findOne({ userId });
            if (!seeker) {
                return res.status(400).json({ success: false, message: "Job seeker profile not found." });
            }

            const existing = await Application.findOne({ jobId: job_id, jobSeekerId: seeker._id });
            if (existing) {
                return res.status(400).json({ success: false, message: "Already applied to this job." });
            }

            await Application.create({ jobId: job_id, jobSeekerId: seeker._id });
            res.json({ success: true, message: "Application submitted successfully." });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ success: false, message: "Something went wrong." });
        }
    });

    // GET /job/:job_id
    app.get("/job/:job_id", isLoggedIn, async (req, res) => {
        const { job_id } = req.params;
        try {
            const job = await Job.findById(job_id)
                .select("job_title job_description job_role");

            if (!job) {
                return res.json({ success: false, message: "Job not found" });
            }
            res.json({ success: true, job });
        } catch (err) {
            console.error("Error fetching job details:", err.message);
            res.status(500).json({ success: false });
        }
    });
};
