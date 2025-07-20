const { Router } = require("express");
const bcrypt = require("bcrypt");
const z = require("zod");
const { adminModel, courseModel }  = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_ADMIN_PASSWORD } = require("../config");
const { adminMiddleware } = require("../middleware/admin")

const adminRouter = Router();

adminRouter.post("/signup", async function(req, res) {
    const requiredBody = z.object({
        email: z.string().min(3).max(100).email(),
        password: z.string().min(3).max(100)
        .refine((val) => /[A-Z]/.test(val), { error: "Must include an uppercase letter"})
        .refine((val) => /[a-z]/.test(val), { error: "Must include a lowercase letter" })
        .refine((val) => /[^A-Za-z0-9]/.test(val), { error: "Must include a special character" }),
        firstName: z.string().min(3).max(100),
        lastName: z.string().min(3).max(100),
    });

    const parsedData = requiredBody.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: parsedData.error
        });
    }

    try {
        const { email, password, firstName, lastName } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        await adminModel.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
        });

        res.json({
            message: "Signup Successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error while signing up"
        }); 
    }
})

adminRouter.post("/signin", async function(req, res){
    const {email, password} = req.body;

    const admin = await adminModel.findOne({
        email
    });

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if(admin && passwordMatch) {
        const token = jwt.sign({
            id: admin._id.toString()
        }, JWT_ADMIN_PASSWORD);
        
        res.json({
            token: token
        });
    } else {
        res.status(403).json({
            message: "Incorrect credentials"
        });
    }
});

adminRouter.post("/course", adminMiddleware, async function(req, res) {
    const adminId = req.userId;

    const { title, description, price, imageUrl } = req.body;

    const course = await courseModel.create({
        title, 
        description, 
        price, 
        imageUrl, 
        creatorId: adminId
    })
    
    res.json({
        message: "Course created",
        courseId: course._id
    });
})

adminRouter.put("/course", adminMiddleware, async function(req, res) {
    const adminId = req.userId;

    const { title, description, price, imageUrl, courseId } = req.body;

    const course = await courseModel.updateOne({
        _id: courseId,
        creatorId: adminId
    }
    ,{
        title, 
        description, 
        price, 
        imageUrl, 
    })
    
    res.json({
        message: "Course updated",
        courseId: course._id
    });
})

adminRouter.get("/course/bulk", adminMiddleware, async function(req, res) {
    const adminId = req.userId;

    const courses = await courseModel.find({
        creatorId: adminId
    });
    
    res.json({
        message: "All you're Courses",
        courses
    });
})

module.exports = {
    adminRouter: adminRouter
}


