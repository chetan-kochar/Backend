import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req,res)=>{
    console.log("URL Hit")
    res.status(200).json({
        message : "Ok"
    })
})
export default registerUser;