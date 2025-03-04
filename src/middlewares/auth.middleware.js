import {ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"

export const verifyJwt =  asyncHandler( async(req, res , next)=>{
  try {
      //we use athorization for mobile app and cookie for web app 
         const  token =  req.cookies.accessToken || req.headers("Authorization")?.replace("Bearer", "")
  
         if(!token){
                throw new ApiError(401, "Unauthorized requst ")
         }
  
      const decodedToken =    jwt.verify(token,  process.env.ACCESS_TOKEN_SECRET)
  
     const user = await User.findById(decodedToken._id).select("-password -refreshToken")
  
     if(!user){
      throw new ApiError("404", "Invalid Access Token ")
     }
  
  
  
  
     req.user = user;
     next()
  } catch (error) {
    throw new ApiError(401,error?.message ||  "Invalid access token ")
  }
})