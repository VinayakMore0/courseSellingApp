const { Router } = require("express")
const courseRouter = Router();


courseRouter.post("/purchase", function(req, res) {
    res.json({
        message: "purchase endpoint"
    });
});

courseRouter.get("/preview", function(req, res) {
    res.json({
        message: "courses preview endpoint"
    });
}); 


module.exports = {
    courseRouter: courseRouter
}
