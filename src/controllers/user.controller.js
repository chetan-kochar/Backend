import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiErrors} from "../utils/ApiErrors.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/Cloudinary.js";
import {ApiResponses} from "../utils/ApiResponses.js";
import { rmSync } from "fs";


const generateAccess_RefreshToken = async (user_id)=>{
try {
        const user = await User.findOne({_id : user_id});
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

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

    // Creating options for sending cookies securely
    const options = {
        httpOnly : true,
        secure : true
    }

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



export {
    registerUser,
    loginUser,
    logoutUser
};