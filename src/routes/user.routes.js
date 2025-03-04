import { Router } from "express";
import { registerUser , loginUser, LogOutUser } from "../controllers/user.controller.js";
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

    

export default router    