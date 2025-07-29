import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {ApiResponses} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/Cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description , typeOfVideo } = req.body;

    const videoLocalPath = req.files?.video[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if((!title || !description || !videoLocalPath || !thumbnailLocalPath)){
        throw new ApiErrors(402,"All fields are required")
    }

    const video = await uploadOnCloudinary(videoLocalPath , "video")
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath , "image")

    if(!video || !thumbnail){throw new ApiErrors(502 , "Something went wrong while uploading files to cloudinary" + video?.error?.message +"\n" + thumbnail?.error?.message )}

    const newVideo = await Video.create({
        videoFile : video.secure_url,
        thumbnail : thumbnail.secure_url,
        title,
        description,
        duration : video.duration,
        isPublished:  Boolean(typeOfVideo),
        owner : req.user?._id
    })

    const result = await Video.findById(newVideo._id)

    if(!result){throw new ApiErrors(502 , "Something went wrong while publishing video")}

    return res
    .status(200)
    .json(new ApiResponses(
        200,
        result,
        "Video successfully published"
    ))


    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}