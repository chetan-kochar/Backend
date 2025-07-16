import { Router } from "express";
import { loginUser, logoutUser ,registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJwt} from "../middlewares/auth.middleware.js";


const userRouter = Router();

userRouter.route("/register").post(
    //Middleware for file handling using multer
    upload.fields([ 
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]) 
    // Passing control
    ,registerUser
    );

userRouter.route("/login").post(loginUser);


userRouter.route("/logout").post(verifyJwt,logoutUser);

export {userRouter};