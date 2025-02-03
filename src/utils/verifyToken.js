import jwt from 'jsonwebtoken';
export const  verifyToken  = async(token)=>{
    
    // console.log(token)
    return jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
} 