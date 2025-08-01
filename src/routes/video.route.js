import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJwt} from "../middlewares/auth.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const videoRouter = Router()

videoRouter.route("/publishVideo").post(
    verifyJwt,
    upload.fields([
        {
            name : video,
            maxCount : 1
        },
        {
            name : thumbnail,
            maxCount : 1
        }
    ])
    ,publishAVideo)

videoRouter.route("/all_videos").get(getAllVideos)

videoRouter.route("/c/:videoId").get(getVideoById)

videoRouter.route("/update/c/:videoId").patch(verifyJwt, upload.single("thumbnail"), updateVideo)

videoRouter.route("/delete/c/:videoId").delete(verifyJwt , deleteVideo)

videoRouter.route("toggle/c/:videoId").patch(verifyJwt , togglePublishStatus)





export {videoRouter}