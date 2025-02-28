import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser = asyncHandler( async (req, res) => {
    
         const {fullName, username, email,  password } = req.body;

         if ([fullName, username, email,   password].some((field)=> field?.trim() === "")) {

            throw new ApiError(400, "all fields are required !!") 
            
         }

         const existedUser = User.findOne({
            $or : [{username},{email}]
         })

         if(existedUser){
            throw new ApiError(409,"user with email or username exist ")
         }

        const avatarLOcanPath= req.files?.avtar[0]?.path   
        const coverImageLocalPath = req.files?.coverImage[0]?.path

        if(!avatarLOcanPath){
            throw new ApiError(400,"avtar is required")
        }

      const avatar =  await  uploadOnCloudinary(avatarLOcanPath)
        const coverImage  = await uploadOnCloudinary(coverImageLocalPath)
        
        if(!avatar){
            throw new ApiError(400,"avtar is required")
      
        }

       const user= await  User.creat({
            fullName,
            avatar : avatar.url,
            coverImage : coverImage?.url ||"",
            email,
            password,
              username  : username.toLowerCase()
        })

       const createdUser =  await User.findById(user._id).select(
        "-password -refreshToken"
       )

       if(!createdUser){
        throw new ApiError(500,"somthing went wrong when ragiste ring  the user")
       }
       return res.status(201).json(
        new ApiResponse(200, createdUser,"User register Succesfully" )
       )


} )     


export {
    registerUser,
}