import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiErrors} from "../utils/ApiErrors.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/Cloudinary.js";
import {ApiResponses} from "../utils/ApiResponses.js";

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
    const coverLocalPath = req.files?.coverImage[0]?.path;
    if(avatarLocalPath){throw new ApiErrors(400,"Avatar is required")};

    // Step 5 : Upload from local to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverLocalPath);

    if(!avatar){throw new ApiErrors(400,"Avatar is required")};

    // Step 6 : Creating entry in User dB
    const user = await User.create({
        username : username.toLowerCase()
        ,avatar: avatar.url
        ,coverImage : coverImage?.url || ""
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
        ApiResponses(200,createdUser,"User successfully registered")
    );


})
export default registerUser;