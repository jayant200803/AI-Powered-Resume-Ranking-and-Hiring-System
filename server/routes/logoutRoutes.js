// Logout Route
export const logoutRoutes=(app)=>{
    app.get("/logout", (req, res) => {
        req.logout((err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        });
    });
};