import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {ApiResponses} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {removeFromCloudinary, uploadOnCloudinary} from "../utils/Cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    
     if(!query || !sortBy || !sortType || !userId){
        throw new ApiErrors(401 , "All fields are required")
     }

    const videos = await Video
    .aggregate([
        {
            $match : {"owner"  : mongoose.Types.ObjectId(userId),
                "title" : {
                    $regex : query , $options : "i"
                }
            }
        },
        {
            $lookup : {
                from: "users",
                localField : "owner",
                foreignField : "_id",
                as: "owner",
                pipeline:[
                    {$project : {
                        "username" : 1,
                        "email" : 1,
                        "fullName" : 1 ,
                        "avatar" : 1,
                       "coverImage ": 1
                    }}
                ]

            }
        },
        {
            $unwind : "owner"
        },
        {
            $sort : {[sortBy] : sortType === "1" ? 1 : -1}
        },
        {
            $skip : (parseInt(page)-1)*parseInt(limit) 
        },
        {
            $limit : parseInt(limit) || 10
        }
    ])    
    

    return res
    .status(200)
    .json(new ApiResponses(
        200,
        videos,
        "Videos fetched successfully"
    ))


    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description , typeOfVideo ,views} = req.body;

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
        owner : req.user?._id,
        views
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
    
    if(!videoId){throw new ApiErrors(401 , "Video ID is required")}

    const video = await Video.findById(videoId).populate("owner" , "_id username avatar");

    if(!video){throw new ApiErrors(501 , "Video not found")}

    return res
    .status(200)
    .json(new ApiResponses(
        200,
        video,
        "Video fetched successfully"
    ))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {newTitle , newDescription} = req.body
    newThumbnailLocalPath = req.file?.path;
    let newThumbnail = {}
    let updatedfields = {}

    if((!newTitle || !newDescription)){
        throw new ApiErrors(401 , "Atleast one field is required")
    }
     
    if(!videoId){throw new ApiErrors(401 , "Video ID is required")}


    if(newThumbnailLocalPath){
        newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath)

        if(!newThumbnail){throw new ApiErrors(502 , "Something went wrong while uploading thumbnail to cloudinary\n" + newThumbnail?.error?.message )}

        if(!(await removeFromCloudinary(newThumbnail.secure_url))){
            throw new ApiErrors(501 , "Something went wrong while removing old thumbnail from cloudinary")
        }

        updatedfields.thumbnail = newThumbnail.secure_url
    }

    if(newTitle){updatedfields.title = newTitle}
    if(newDescription){updatedfields.description = newDescription}


    const video = await Video.findByIdAndUpdate(videoId,{
        $set : updatedfields
    },
        {new : true}
);

    if(!video){throw new ApiErrors(501 , "Video not found")}

    return res
    .status(200)
    .json(new ApiResponses(
        200,
        video,
        "Fields updated successfully"
    ))
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){throw new ApiErrors(401 , "Video ID is required")}

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if(!deletedVideo){throw new ApiErrors(501 , "Video not found")}

    if(!(await removeFromCloudinary(deletedVideo.thumbnail))){
            throw new ApiErrors(501 , "Something went wrong while removing thumbnail from cloudinary")
        }
    if(!(await removeFromCloudinary(deletedVideo.videoFile))){
            throw new ApiErrors(501 , "Something went wrong while removing video from cloudinary")
        }
    

    return res
    .status(200)
    .json(new ApiResponses(
        200,
        {},
        "Video successfully deleted"
    ))

    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { isPublished } = req.body

    if(!videoId || !isPublished){throw new ApiErrors(401 , "All fileds are required")}

    const video = await Video.findByIdAndUpdate(videoId,{
        $set : {
            isPublished : Boolean(isPublished)
        }
    },{new:true});

    if(!video){throw new ApiErrors(501 , "Video not found")}

    return res
    .status(200)
    .json(new ApiResponses(
        200,
        {},
        "Video Publishing Status updated"
    ))


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}