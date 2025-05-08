import { Router } from "express";
import { registerUser ,loginUser , logoutUser, refreshAcessToken,changePassword, getCurrentUser, updateAccountDetails, userUpdateAvatar, userUpdateCoverImage,  getChannelProfile, getWatchHistory   } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

    router.route("/login").post(loginUser)


    //secure router 
    router.route("/logout").post(verifyJWT,logoutUser)
    router.route("/refresh-token").post(refreshAcessToken); 
    router.route("/change-password").post(verifyJWT, changePassword);
    router.route("/me").get(verifyJWT, getCurrentUser)
    router.route("/update-account-details").put(verifyJWT, updateAccountDetails)
    router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), userUpdateAvatar)
    router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), userUpdateCoverImage)
    router.route("/:username").get(verifyJWT, getChannelProfile); 
    router.route("/watch-history").get(verifyJWT, getWatchHistory)



export default router