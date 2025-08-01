import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiErrors} from "../utils/ApiErrors.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary ,removeFromCloudinary} from "../utils/Cloudinary.js";
import {ApiResponses} from "../utils/ApiResponses.js";
import jwt from "jsonwebtoken"
import { Subscription } from "../models/subscription.models.js";
import mongoose from "mongoose";

// Creating options for sending cookies securely
const options = {
    httpOnly : true,
    secure : true
}

const generateAccess_RefreshToken = async (user_id)=>{
try {
        const user = await User.findOne({_id : user_id});

        if(!user){throw new ApiErrors(501,"User not found")}

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        if(accessToken && refreshToken){console.log("New tokens generated")};

        return {
           accessToken,
           refreshToken
        }
} catch (error) { throw new ApiErrors(501 ,"Something went wrong while generating referesh and access token\n"+ error?.message )
}
}

const registerUser = asyncHandler(async (req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    // Step 1 : Fetching user data from form
    const {username , email , fullName , password} = req.body;
    
    // Step 2 : Validation
    if(
        [username , email , fullName , password].some((field)=>field?.trim()=="")
    ){
        throw new ApiErrors("400","All fields are required");
    }

    // Step 3 : Checking for already registered user
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiErrors(409, "User with same username or email already exists")
    };

    // Step 4 : Checking if files stored in local system
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverLocalPath = req.files?.coverImage[0]?.path;
    let coverLocalPath="";
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverLocalPath = req.files.coverImage[0].path;
    }
    if(!avatarLocalPath){throw new ApiErrors(400,"Avatar is required")};

    // Step 5 : Upload from local to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverLocalPath);

    if(!avatar){throw new ApiErrors(400,"Avatar is required")};

    // Step 6 : Creating entry in User dB
    const user = await User.create({
        username : username.toLowerCase()
        ,avatar: avatar.secure_url
        ,coverImage : coverImage?.secure_url || ""
        ,fullName
        ,email
        ,password
    });

    // Step 7 : Removing password and refreshToken from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

     // Step 8 : Checking if user registered to dB
    if(!createdUser){throw new ApiErrors(500,"Something went wrong while registering the user")};

    // Step 9 : Returning a response
    return res.status(200).json(
        new ApiResponses(200,createdUser,"User successfully registered")
    );


})

const loginUser = asyncHandler(async (req,res)=>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    const {username , email ,password} = req.body;

    if(!(username || email)){throw new ApiErrors(401,"All fields are required")};

    const user = await User.findOne(
        {$or : [{ username } ,{ email }]}
    )

    if(!user){throw new ApiErrors(404,"User not exist")};

    const isPasswordRight = await user.isPasswordCorrect(password);

    if(!isPasswordRight){throw new ApiErrors(401,"Invalid user credentials")};

    const {accessToken , refreshToken} = await generateAccess_RefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    if(!loggedInUser){throw new ApiErrors(501 , "LoggedIn User not found")}

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave : false});

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponses(
            200,
            loggedInUser,
            "User successfully logged in"
        )
    )

}
)

const logoutUser = asyncHandler(async (req,res)=>{
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken : 1
            }
        },
        {
            new : true
        }
    )

    if(!user){
        throw new ApiErrors(502,"Could'nt find the user")
    }

     const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponses(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    try {
        const userRefreshToken = req.cookies?.accessToken || req.body?.refreshToken;
        
        if(!userRefreshToken){throw new ApiErrors(401 , "Unauthorized Access")}
    
        const decodedToken = await jwt.verify(
            userRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        
        if(!decodedToken){throw new ApiErrors(501 , "Something went wrong while decoding refresh token")}

        const user = await User.findById(decodedToken?._id)
        
        if(!user){throw new ApiErrors(401,"Invalid Refresh Token")}
    
        if(user.refreshToken !== userRefreshToken){
            throw new ApiErrors(401, "Refresh token is expired or used")
        }
    
        const {accessToken , refreshToken } = await generateAccess_RefreshToken(user._id);

        if(accessToken && refreshToken){console.log("New tokens assigned to variables")}
    
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false})
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponses(
                200,
                {accessToken : accessToken, refreshToken: refreshToken},
                "Access Token refreshed"
            )
        )
    } 
    catch (error) {
        throw new ApiErrors(400 , error?.message || "Invalid Refresh Token")        
    }   
})

const PassChange = asyncHandler(async (req ,res)=>{
    try {
        const {oldPass , newPass , confirmPass} = req.body;
        
        if(!(newPass === confirmPass )){throw new ApiErrors(401 , "New password and current password must be matching")}

        const user = await User.findById(req.user?._id)
        
        if(!user){throw new ApiErrors(502, error.message || "User not found")}

        if(!(await user.isPasswordCorrect(oldPass))){throw new ApiErrors("401" , "Incorrect old password")}

        user.password  = newPass;
        await user.save({validateBeforeSave : false})

        return res
        .status(200)
        .json(new ApiResponses(
            200,
            {},
            "Password Successfully changed"
        ))
    } 
    catch (error) {
        throw new ApiErrors(401 ,error?.message || "Something went wrong while changing password")        
    }
})

const getCurrentUser = asyncHandler( async(req , res) => {
    return res
    .status(200)
    .json(new ApiResponses(
        200,
        req.user,
        "User successfully fetched"
    ))
})

const updateEmail = asyncHandler(async (req , res)=>{
    const {newEmail} = req.body ; 
    if(!(newEmail)){throw new ApiErrors(401 , "New Email is required")};

    const user = await User.findByIdAndUpdate(
        {_id : req.user?._id},
        {
            $set : {
                email : newEmail
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponses(
        200,
        user,
        "Email changed successfully"
    ))
})

const updateFullName = asyncHandler(async (req , res)=>{
    const {newFullName} = req.body ; 
    if(!(newFullName)){throw new ApiErrors(401 , "New Email is required")};

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName : newFullName
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponses(
        200,
        user,
        "Full Name changed successfully"
    ))
})

const updateAvatar = asyncHandler(async (req , res) =>{
    const avatarLocalPath = req.file?.path;
   
    if(!avatarLocalPath){throw new ApiErrors(400, "Avatar file is missing")}

    const newAvatar = await uploadOnCloudinary(avatarLocalPath);

    if(!newAvatar){throw new ApiErrors(501 , "Something went wrong while uploading file to cloudinary\n" + newAvatar?.result)}

    console.log("New Avatar successfully uploaded to cloudinary");

    const removeOldAvatar = removeFromCloudinary(req.user?.avatar);

    if(!removeOldAvatar){throw new ApiErrors(501,"Something went wrong while removing old avatar from cloudinary")};

    console.log("Old Avatar successfully removed from cloudinary");

    const user = await User.findByIdAndUpdate(
        {_id : req.user?._id},
        {
            $set : {
                avatar : newAvatar.secure_url
            }
        },
        {new : true}
    )

    return res
    .status(200)
    .json(new ApiResponses(
        200,
        user,
        "Avatar changed successfully"
    ))
})

const updatecoverImage = asyncHandler(async (req , res) =>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){throw new ApiErrors(400, "CoverImage file is missing")}

    const newCoverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!newCoverImage){throw new ApiErrors(501 , "Something went wrong while uploading file to cloudinary\n" + newCoverImage?.result)}

    console.log("New CoverImage successfully uploaded to cloudinary");

    const removeOldCoverImage = removeFromCloudinary(req.user?.coverImage);

    if(!removeOldCoverImage){throw new ApiErrors(501,"Something went wrong while uploading to cloudinary")};

    console.log("Old CoverImage successfully removed from cloudinary");

    const user = await User.findByIdAndUpdate(
        {_id : req.user?._id},
        {
            $set : {
                coverImage : newCoverImage.secure_url
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponses(
        200,
        user,
        "CoverImage changed successfully"
    ))
})

const getUserChannelProfile = asyncHandler(async (req , res)=>{

    const { username } = req.params ; 

    if(!username?.trim()){throw new ApiErrors(401, "User is missing")}

    const channelInfo = await User.aggregate([
        {
            $match : {username : username?.toLowerCase()}
        },
        {
            $lookup : {
                from: "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as: "Subscribers"
            }
        },
        {
            $lookup : {
                from: "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as: "SubscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$Subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$SubscribedTo"
                }
            }
        },
        {
            $project : {
                _id:1,
                fullName: 1,
                username: 1,
                subscribersCount:1,
                channelsSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    if(!channelInfo?.length){throw new ApiErrors(404 , "Channel does not exists")};

    let isSubscribed = false;
    if(req.user._id){
        isSubscribed = Boolean(await Subscription.exists({
            channel : channelInfo[0]._id ,
            subscriber : req.user._id
        })) 
    }

    return res
    .status(200)
    .json( new ApiResponses(
        200,
        {...channelInfo[0],isSubscribed},
        "Channel Info fetched Successfully"
    ) )
})

const getWatchHistory = asyncHandler(async (req, res)=>{
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from : "videos",
                foreignField : "_id",
                localField : "watchHistory",
                as : "watchHistory",
                pipeline :[{
                    $lookup:{
                        from : "users",
                        foreignField : "_id",
                        localField : "owner",
                        as: "owner",
                        pipeline : [{
                            $project: {
                                username : 1,
                                fullName : 1,
                                avatar : 1,
                                coverImage:1
                            }
                        }]
                    },
                },
                {
                    $addFields : {
                        "owner" : {
                            "$first" : "$owner"
                        }
                    }
                }
            ]
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponses(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    PassChange,
    getCurrentUser,
    updateEmail,
    updateFullName,
    updateAvatar,
    updatecoverImage,
    getUserChannelProfile,
    getWatchHistory
};