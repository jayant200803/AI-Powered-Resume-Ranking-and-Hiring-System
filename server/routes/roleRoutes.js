import User from "../models/User.js";

export const roleRoutes = (app, isLoggedIn) => {
    app.post("/choose-role", isLoggedIn, async (req, res) => {
        try {
            const { role } = req.body;
            const userId = req.user._id;

            // replaces: UPDATE login SET role = $1 WHERE id=$2
            await User.findByIdAndUpdate(userId, { role });
            res.json({ "Success": "true" });
        } catch (err) {
            res.json({ "Success": "false" });
            console.error(err.message);
        }
    });
};
