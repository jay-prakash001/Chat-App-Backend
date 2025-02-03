import { v2 as cloudinary } from "cloudinary";

import fs from 'fs';

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key :process.env.CLOUDINARY_API_KEY
,   api_secret : process.env.CLOUDINARY_API_SECRET


})

const uploadOnCloudinary = async(localFilePath)=>{

    try {
        if(!localFilePath) return null
        const res = await cloudinary.uploader.upload(localFilePath, {resource_type : "auto"})
        console.log("uploaded successfully")
        fs.unlinkSync(localFilePath)
        return res
    } catch (error) {
        console.log('file upload failed due to ', error)

        fs.unlinkSync(localFilePath)
        return null
    }
}

export default uploadOnCloudinary