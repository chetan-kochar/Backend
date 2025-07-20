import { Router } from "express";
import { loginUser, logoutUser ,registerUser, refreshAccessToken, getCurrentUser, PassChange, updateEmail, updateFullName, updateAvatar, updatecoverImage } from "../controllers/user.controller.js";
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


userRouter.route("/refresh-AccessToken").post(refreshAccessToken);

userRouter.route("/get-current-user",verifyJwt,getCurrentUser);

userRouter.route("/change-password",verifyJwt,PassChange);

userRouter.route("/update_email",verifyJwt,updateEmail);

userRouter.route("/update_fullName",verifyJwt,updateFullName);

userRouter.route("/update_avatar",verifyJwt,upload.single("avatar"),updateAvatar);

userRouter.route("/update_cover_image",verifyJwt,upload.single("coverImage"),updatecoverImage);

export {userRouter};