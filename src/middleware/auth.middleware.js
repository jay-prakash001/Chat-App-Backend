import jwt from 'jsonwebtoken';
import User from '../models/user.models.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js';

export const verifyJWT = asyncHandler(async(req, res_, next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")//make sure to have a " " space after Bearer

        console.log(token)
        if(!token){
            throw new ApiError(401, "unauthorized access request")
        }

        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log(decodedtoken)
        const user = await User.findById(decodedtoken?._id)

        if(!user){
            throw new ApiError(401, "Invalid access token")
        }

        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || " Invalid access token error")
    }
})