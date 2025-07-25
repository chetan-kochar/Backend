import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import { ApiErrors } from './ApiErrors.js';

 cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME , 
        api_key:process.env.CLOUDINARY_API_KEY , 
        api_secret:process.env.CLOUDINARY_API_SECRET
    });

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        console.log("File successfully deleted from local storage and is kept on cloudinary")
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        console.log("File upload failed.\nFile successfully deleted from local storage")
        return null;
    }
}

const publicIdExtract = (cloudinaryUrl)=>{
    if(!cloudinaryUrl){throw new ApiErrors(401 , "URL is required")}
    const parts = cloudinaryUrl.split("/upload/")
    if (parts.length < 2) throw new ApiErrors(401, "Invalid Cloudinary URL");
    // removing the version
    let publicId = parts[1].replace(/v\d+\//,"");
    // removing extension
    publicId = publicId.replace(/\.\w+$/,"");
    return publicId;
}

const removeFromCloudinary = async(cloudinaryUrl)=>{
    try {
        const publicId = publicIdExtract(cloudinaryUrl)
        const result = await cloudinary.uploader.destroy(publicId)
    
        if(!result || result?.result !== "ok"){throw new ApiErrors(501 , "Something went wrong while removing file from cloudinary\n" + result?.result)}
    
        return true;
    } catch (error) {
        throw new ApiErrors(501 , error?.message || "Something went wrong while removing file from cloudinary")
    }
}

export {
    uploadOnCloudinary,
    publicIdExtract,
    removeFromCloudinary
};