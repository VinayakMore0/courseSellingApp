const { Router } = require("express");
const bcrypt = require("bcrypt");
const z = require("zod");
const { adminModel }  = require("../db");
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

adminRouter.post("/course", adminMiddleware, function(req, res) {
    const adminId = req.userId;
    
    res.json({
        message: "create course endpoint"
    });
})

adminRouter.put("/course", function(req, res) {
    res.json({
        message: "edit course endpoint"
    });
})

adminRouter.get("/course/bulk", function(req, res) {
    res.json({
        message: "course endpoint"
    });
})

module.exports = {
    adminRouter: adminRouter
}


