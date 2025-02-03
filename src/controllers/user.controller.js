import asyncHandler from '../utils/asyncHandler.js';

import { ApiError } from '../utils/ApiError.js'
import { upload } from '../middleware/multer.middleware.js'
import User from '../models/user.models.js'
import uploadOnCloudinary from "../utils/cloudinary.js"
const registerUser = asyncHandler( async (req, res) => {
    console.log(req.body)
    console.log(req.file)

    const { phone, bio, } = req.body

    if (!phone) {
        throw new ApiError(401, "phone number is required")
    }
    if (!req.file) {
        throw new ApiError(401, "profile image is required")
    }
    let profileImg = await uploadOnCloudinary(req.file.path)

    console.log(profileImg.secure_url)
    let user = await User.findOneAndUpdate({ phone: phone }, { bio: bio, profileImg: profileImg.secure_url })
    if (user) {
        await user.save({ validateBeforeSave: false })

    } else {
      
        user = await User.create({ phone: phone, bio: bio, profileImg: profileImg.secure_url })

    }
    console.log(user)


    return res.send(user)
})