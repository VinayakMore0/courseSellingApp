const { Router } = require("express");
const bcrypt = require("bcrypt");
const z = require("zod");
const { userModel, purchaseModel, courseModel } = require("../db")
const jwt = require("jsonwebtoken");
const { JWT_USER_PASSWORD } = require("../config");
const { userMiddleware } = require("../middleware/user");

const userRouter = Router();

userRouter.post("/signup", async function(req, res) {
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

        await userModel.create({
            email: email,
            password: hashedPassword,
            firstName: firstName, 
            lastName: lastName
        })

        res.json({
            message: "Signup Succeeded"
        });   
    } catch (error) {
        res.status(500).json({
            message: "Error while signing up"
        });
    }
});

userRouter.post("/signin", async function(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({
        email: email,
    });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (user && passwordMatch) {
        const token = jwt.sign({
            id: user._id.toString()
        }, JWT_USER_PASSWORD);
        
        res.json({
            token: token
        });
    } else {
        res.status(403).json({
            message: "Incorrect credentials"
        });
    }
});

userRouter.get("/purchases", userMiddleware, async function(req, res) {
    const userId = req.userId;

    const purchases = await purchaseModel.find({
        userId,
    })

    const couresData = await courseModel.find({
        _id: { $in: purchases.map(x => x.courseId) }
    })

    res.json({
        purchases,
        couresData
    });
});


module.exports = {
    userRouter: userRouter
}
