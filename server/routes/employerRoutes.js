import Employer from "../models/Employer.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import JobSeeker from "../models/JobSeeker.js";

export const employerRoutes = (app, isLoggedIn) => {

    // POST /job-employer-form
    app.post("/job-employer-form", isLoggedIn, async (req, res) => {
        try {
            const { name, company, post } = req.body;
            const userId = req.user._id;

            await Employer.create({ userId, name, company, post });
            res.json({ "Success": "true" });
        } catch (err) {
            res.json({ "Success": "false" });
            console.error(err.message);
        }
    });

    // GET /employer-profile
    app.get("/employer-profile", isLoggedIn, async (req, res) => {
        try {
            const userId = req.user._id;

            const employer = await Employer.findOne({ userId });
            if (!employer) {
                return res.json({ exists: false });
            }

            // replaces: LEFT JOIN job_description jd ON e.employer_id = jd.employer_id
            const jobs = await Job.find({ employerId: employer._id })
                .select("_id job_title job_description job_role")
                .lean();

            res.json({
                exists: true,
                data: {
                    name: employer.name,
                    company: employer.company,
                    post: employer.post,
                    jobs: jobs.map(j => ({
                        job_id: j._id,
                        job_title: j.job_title,
                        job_description: j.job_description,
                        job_role: j.job_role,
                    }))
                }
            });
        } catch (err) {
            console.error("Employer Profile Error:", err.message);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

    // GET /check/employer
    app.get("/check/employer", isLoggedIn, async (req, res) => {
        try {
            const userId = req.user._id;
            const employer = await Employer.findOne({ userId });
            res.json({ exists: !!employer });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ exists: false });
        }
    });

    // GET /job/:job_id/applicants
    app.get("/job/:job_id/applicants", isLoggedIn, async (req, res) => {
        const { job_id } = req.params;
        try {
            const applications = await Application.find({ jobId: job_id })
                .populate({
                    path: "jobSeekerId",
                    select: "name college degree graduation_year resume_name"
                })
                .lean();

            const applicants = applications.map(app => ({
                job_seeker_id: app.jobSeekerId._id,
                name: app.jobSeekerId.name,
                college: app.jobSeekerId.college,
                degree: app.jobSeekerId.degree,
                graduation_year: app.jobSeekerId.graduation_year,
                resume_name: app.jobSeekerId.resume_name,
                rank: app.rank,
                application_id: app._id,
                status: app.status,
            }));

            // Sort: ranked (rank > 0) ascending first, unranked last, then by name
            applicants.sort((a, b) => {
                const aRanked = a.rank > 0;
                const bRanked = b.rank > 0;
                if (aRanked && !bRanked) return -1;
                if (!aRanked && bRanked) return 1;
                if (aRanked && bRanked) return a.rank - b.rank;
                return (a.name || "").localeCompare(b.name || "");
            });

            res.json({ success: true, applicants });
        } catch (err) {
            console.error("Error fetching applicants:", err.message);
            res.status(500).json({ success: false, error: "Internal Server Error" });
        }
    });

    // GET /resume/:job_seeker_id
    app.get("/resume/:job_seeker_id", isLoggedIn, async (req, res) => {
        const { job_seeker_id } = req.params;
        try {
            const seeker = await JobSeeker.findById(job_seeker_id)
                .select("resume_name resume_data");

            if (!seeker || !seeker.resume_data) {
                return res.status(404).send("Resume not found.");
            }

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `inline; filename="${seeker.resume_name}"`);
            res.send(seeker.resume_data);
        } catch (err) {
            console.error("Error fetching resume:", err.message);
            res.status(500).send("Error retrieving resume.");
        }
    });

    // PATCH /applications/:application_id/status
    app.patch("/applications/:application_id/status", isLoggedIn, async (req, res) => {
        const { application_id } = req.params;
        const { status } = req.body;

        const allowed = ["applied", "rejected", "selected"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        try {
            const updated = await Application.findByIdAndUpdate(
                application_id,
                { status },
                { new: true }
            );

            if (!updated) {
                return res.status(404).json({ success: false, message: "Application not found" });
            }

            res.json({ success: true, application: { id: updated._id, status: updated.status } });
        } catch (err) {
            console.error("Error updating status:", err.message);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    });
};
