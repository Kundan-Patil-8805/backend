import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
// Helper function to generate access and refresh tokens
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token to the user document
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, email, password } = req.body;

    // Validate input fields
    if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    // Handle avatar and cover image file paths
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // Upload avatar and cover image to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if (!avatar || !avatar.url) {
        throw new ApiError(400, "Failed to upload avatar");
    }

    // Create the user in the database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    // Retrieve the created user without sensitive fields
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Failed to register user");
    }

    // Respond with the created user details
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

// Login a user
const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Validate input fields
    if (!username && !email) {
        throw new ApiError(400, "Username or Email is required");
    }

    // Find the user by username or email
    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Validate password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // Retrieve the logged-in user without sensitive fields
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Set cookie options
    const options = {
        httpOnly: true,
        secure: true,
    };

    // Respond with tokens and user details
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully")
        );
});

// Logout a user
const LogOutUser = asyncHandler(async (req, res) => {
    // Update the user's refreshToken to null
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null,
            },
        },
        { new: true }
    );

    // Set cookie options
    const options = {
        httpOnly: true,
        secure: true,
    };

    // Clear cookies and respond
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

//refreshAccessToken
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request: Refresh token is missing");
    }

    try {
        // Verify the incoming refresh token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Find the user associated with the token
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(404, "Invalid refresh token: User not found");
        }

        // Check if the incoming refresh token matches the one stored in the database
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        // Generate new access and refresh tokens
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        // Set cookie options
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "strict", // Optional: Adds additional security
        };

        // Send the new tokens in the response
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})

//changePassword
const changeUsesrPassword = asyncHandler(async (req,res) => {
    const { oldPassword, newPassword }  = req.body;


    // auth midd
       const user = await User.findById(req.user?._id)

       //in user model we have is password correct method 

      const isPasswordCorrect=   await user.isPasswordCorrect(oldPassword)

      if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid old Password")
      }

      user.password = newPassword;
      user.save({ validateBeforeSave: false})

      return res
      .status(200)
      .json(new ApiResponse(200, {}, "password change succesfully "))
})

const getCurrentUser = asyncHandler( async (req,res)=>{
    return res
    .status(200)
    .json(200, req.user, "Current User fetched successfully")
})

const UpdateAccountDetail = asyncHandler(async (req,res)=>{
    const { fullName , email }= req.body;

    if( !fullName || !email){
        throw new ApiError(400, "all fielda are required ")

        User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullName,
                    email
                }
            },
            {new : true }

        ).select("-password ")

        return res
        .status(200)
        .json(new ApiResponse(200, user, "User details updated successfyl"))
    }
})

const UpdateUserAvatar = asyncHandler(async (req, res)=>{
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")

    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Erro while uploading avatar ")
    }

    const user= await User.findByIdAndUpdate(
       req.user?._id
        ,
        {
$set: {
    avatar: avatar.url
}
        },
        {new : true }
    )

        // TO do delete old image from cloudinary

        
// Helper Function: Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    const cloudinary = require("cloudinary").v2; // Ensure Cloudinary is configured
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
    }
};
    
    return res.status(200).json(new ApiResponse(200, user, "user cover image updated successfully"))
})


const UpdateUserCoverImage = asyncHandler(async (req, res)=>{
    const CoverImageLocalPath = req.file?.path;
    if(!CoverImageLocalPath){
        throw new ApiError(400, "coverImage is required")

    }

    const CoverImage = await uploadOnCloudinary(CoverImageLocalPath)

    if(!CoverImage.url){
        throw new ApiError(400, "Erro while uploading avatar ")
    }

   const user=  await User.findByIdAndUpdate(
       req.user?._id
        ,
        {
$set: {
    CoverImage: CoverImage.url
}
        },
        {new : true }
    )


    return res.status(200).json(new ApiResponse(200, user, "user cover image updated successfully"))
})

 
const getUserChanelProfile= asyncHandler(async ( req,res)=>{

    const { username } =req.params;

    if(!username){
        throw new ApiError(400 , " username is missing ")
    }a
        
// we use this  aggrigation pipline to get the user profile and the user  post 

    const channel = await User.aggregate([
        {
            $match: {   username : username?.toLowerCase()}
        },
        {
            $lookup: {
                from: "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            },
        },
        {
             $lookup : {
                from: "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscriberTo"
             }
        },
        {
            $addFields : {
                subscribersCount : { 
                    $size : " $subscribers "
                },
                channelSubscribedToCount : {
                    $size : "$subscriberTo"
                },
                isSubscribed : {
                    if : {
                        $in: [req.user?._id, "$subscribers.subscriber"]
                        then : true ,
                        else : false
                    }
                }
            }
        }
        {

            // $project is used to select the fields that we want to tetrun 
            $project : {
                fullName : 1,
                Username : 1,
                subscribersCount : 1,
                channelSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1,



            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(400, "Channel not found || not exist ")
    }
    return res
    .status(200)
    .join( new ApiResponse(200, channel[0], "channel profile fetched successfully "))
})


const getWatchHistory = asyncHandler(async ( req, res)=> {
    const user = await User.aggregate([
        {
            $match : {
                _id : mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : " _id",
                as: "watchHistory",
                pipline : [
                    {
                        $lookup: {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipline : [
                                $project{
                                    fullName : 1,
                                    username : 1,
                                    avatar : 1
                                },
                                
                            ]
                        }
                    },{
                        $addFields : {
                            owner : { $first : "$owner"}
                        }
                    }
                ]


            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200,
        user[0].watchHistory,
        "watch history fetch successfuly=ly"
    ))
})


export { registerUser,
     loginUser,
     LogOutUser ,
     refreshAccessToken,
     getCurrentUser ,
     changeUsesrPassword ,
     UpdateAccountDetail,
     UpdateUserCoverImage,
     getWatchHistory,
     UpdateUserAvatar};