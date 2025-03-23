
// import  { User }   from '../models/user.model.js';
// import {ApiError} from '../utils/ApiError.js'
// import { asyncHandler } from '../utils/asyncHandler.js';
// import { ApiResponse } from '../utils/ApiResponse.js';
// import { uploadOnCloudinary } from '../utils/cloudinary.js';
// import jwt from "jsonwebtoken"
// import mongoose from 'mongoose';

// const registerUser = asyncHandler(async (req, res) => {


// // 	update controllers in js

// // - where we first register the user. where we give the user information.
// // 1. get user details from frontend 
// // 2. get all validation { non empty } 
// // 3. check if the user already exists { unique email and username } 
// // 4. check for images 
// // 5. check for avatar 
// // 6. upload them to Cloudinary, check the avatar . 
// // 7. create user object - create entry in db
// // 8. remove password from refresh token field 
// // 9. check for user creation 
// // 10. return response  { or not done show error }


// const { username, email, fullName, password } = req.body;
// console.log(req.body);


// if (
// 	[fullName, email, username, password].some((field) => field?.trim() === "")
// ) {
// 	throw new ApiError(400, "All fields are required")
// }

// //check if the user already exists
// //check the value what even required under array 
// const existedUser = await User.findOne({
// 	$or: [{ username }, { email }]
// 	});

// 	if(existedUser) {
// 		throw new ApiError(409, "User already exists");
// 	}



// 	// Check for avatar and cover image and validate
// 	const avatarLocalPath = req.files?.avatar?.[0]?.path;
// 	const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
// 	// console.log("req.files", req.files);
	

// 	// Check weather the image is there 
// 	if (!avatarLocalPath || !coverImageLocalPath) {
// 		throw new ApiError(400, "Avatar and cover image are required");
// 	}


// 	// Upload on Clodimnay 
// 	const avatarUploadResult = await uploadOnCloudinary(avatarLocalPath); 
// 	const coverImageUploadResult = await uploadOnCloudinary(coverImageLocalPath); 


// 	//Avatar is not created 
// 	if(!avatar) {
// 		throw new ApiError(400, "Avatar is required");
// 	}

// 	//Create the user obkest and save to database 
// 	const newUser = new User({
// 		username : username.toLowerCase(), 
// 		email, 
// 		fullName, 
// 		password,
// 		avatar : avatarUploadResult.url?.url || "",

// 	})
	
// 	// await newUser.save(); 

// 	//Remove password from response 
// 	// newUser.password = undefined; 



// 	//check weather the usrer created or not 
// 	const createdUser = await User.findById(User._id).select(" -password - refreshToken") 

// 	if(!createdUser) {
// 		throw new ApiError(501, 'Something went wrong while registring the user ')
// 	}

// 	//Return Response 
// 	return res.status(201).json(
// 		new ApiResponse(200, createdUser, 'User has been registred Successfully')
// 	)

// });

// export { registerUser };





import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


// const generateAccessAndRefereshTokens = async(userId) =>{
//     try {
//         const user = await User.findById(userId)
//         const accessToken = user.generateAccessToken()
//         const refreshToken = user.generateRefreshToken()

//         user.refreshToken = refreshToken
//         await user.save({ validateBeforeSave: false })

//         return {accessToken, refreshToken}


//     } catch (error) {
//         throw new ApiError(500, "Something went wrong while generating referesh and access token")
//     }
// }

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )
