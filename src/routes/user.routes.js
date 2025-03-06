import { Router } from "express";
import { registerUser,
    loginUser,
    LogOutUser ,
    refreshAccessToken,
    getCurrentUser ,
    changeUsesrPassword ,
    UpdateAccountDetail,
    UpdateUserCoverImage,
    getWatchHistory,
    UpdateUserAvatar} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {ApiError} from '../utils/ApiError.js';
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
                 name : "avatar",
                 maxCount:1
        }
        ,
        {
                 name : "coverImage",
                 maxCount:1
        }
    ])
    ,registerUser);

router.route("/login").post(loginUser)

// secure route
router.route("/logout").post( verifyJwt, LogOutUser)

router.route("/refresh-token").post(refreshAccessToken)    

router.route("/change-password").post(verifyJwt, changeUsesrPassword)

router.route("current-user").get(verifyJwt, getCurrentUser)

router.route("/update-account").path(verifyJwt, UpdateAccountDetail)

router.route("/avatar").patch(verifyJwt, upload.single("avatar"), UpdateUserAvatar)

router.route("/cover-image").patch(verifyJwt, upload.single("coverImage"), UpdateUserCoverImage)

router.route("/c/:username").get(verifyJwt, getUserChanelProfile)

router.route("/history").get(verifyJwt, getWatchHistory)
export default router    