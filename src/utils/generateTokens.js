import User from "../models/user.models.js"

export const generateTokens = async(userId)=>{
    const user = await User.findById({_id : userId})

    const accessToken = await user.generateAccessToken()
    const refreshtoken = await user.generateRefreshToken()
    
    user.refreshtoken = refreshtoken
    await user.save({validateBeforeSave : false})

    return {accessToken, refreshtoken}
}