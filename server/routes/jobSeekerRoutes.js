import multer from "multer";
import JobSeeker from "../models/JobSeeker.js";
import Application from "../models/Application.js";

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

export const jobSeekerRoutes = (app, isLoggedIn) => {

    // POST /job-seeker-form
    app.post("/job-seeker-form", isLoggedIn, upload.single("resume"), async (req, res) => {
        try {
            const { name, college, degree, graduation_year } = req.body;
            const resumeFile = req.file;

            if (!resumeFile) {
                return res.status(400).json({ Success: "false", message: "No file uploaded" });
            }

            const userId = req.user._id;

            await JobSeeker.create({
                userId,
                name,
                college,
                degree,
                graduation_year: Number(graduation_year),
                resume_name: resumeFile.originalname,
                resume_data: resumeFile.buffer,
            });

            res.json({ Success: "true" });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ Success: "false" });
        }
    });

    // GET /job-seeker-profile
    app.get("/job-seeker-profile", isLoggedIn, async (req, res) => {
        const userId = req.user._id;

        try {
            const seeker = await JobSeeker.findOne({ userId });
            if (!seeker) {
                return res.json({ exists: false });
            }

            // replaces: LEFT JOIN job_applied + job_description
            const applications = await Application.find({ jobSeekerId: seeker._id })
                .populate({ path: "jobId", select: "job_title job_description job_role" })
                .lean();

            const jobs = applications
                .filter(app => app.jobId !== null)
                .map(app => ({
                    application_id: app._id,
                    job_id: app.jobId._id,
                    job_title: app.jobId.job_title,
                    job_description: app.jobId.job_description,
                    job_role: app.jobId.job_role,
                    status: (app.status || "applied").toLowerCase(),
                }));

            res.json({
                exists: true,
                data: {
                    name: seeker.name,
                    college: seeker.college,
                    degree: seeker.degree,
                    graduation_year: seeker.graduation_year,
                    resume_name: seeker.resume_name,
                    resume_data: seeker.resume_data,
                    jobs,
                }
            });
        } catch (err) {
            console.error("Job Seeker Profile Error:", err.message);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

    // GET /check/job-seeker
    app.get("/check/job-seeker", isLoggedIn, async (req, res) => {
        try {
            const userId = req.user._id;
            const seeker = await JobSeeker.findOne({ userId });
            res.json({ exists: !!seeker });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ exists: false });
        }
    });

    // GET /job-seeker-resume
    app.get("/job-seeker-resume", isLoggedIn, async (req, res) => {
        const userId = req.user._id;
        try {
            const seeker = await JobSeeker.findOne({ userId }).select("resume_name resume_data");

            if (!seeker || !seeker.resume_data) {
                return res.status(404).send("Resume not found.");
            }

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `inline; filename="${seeker.resume_name}"`);
            res.send(seeker.resume_data);
        } catch (err) {
            console.error("Resume fetch error:", err.message);
            res.status(500).send("Error retrieving resume.");
        }
    });
};
