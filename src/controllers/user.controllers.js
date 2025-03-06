
import  User  from '../models/user.model.js';
import ApiErorr from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadImage } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiRsponse.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const registerUser = asyncHandler(async (req, res) => {


// 	update controllers in js

// - where we first register the user. where we give the user information.
// 1. get user details from frontend 
// 2. get all validation { non empty } 
// 3. check if the user already exists { unique email and username } 
// 4. check for images 
// 5. check for avatar 
// 6. upload them to Cloudinary, check the avatar . 
// 7. create user object - create entry in db
// 8. remove password from refresh token field 
// 9. check for user creation 
// 10. return response  { or not done show error }


const { username, email, fullName, password } = req.body;
console.log(req.body);


//check for empty fields
if (!username || !email || !fullName || !password) {
	throw new ApiError(400,"Please fill all the fields");
}


//check if the user already exists
//check the value what even required under array 
const existedUser = await User.findOne({
	$or: [{ email }, { username }]
	});

	if(existedUser) {
		throw new ApiError(400, "User already exists");
	}



	// Check for avatar and cover image and validate
	const avatarLocalPath = req.files?.avatar?.[0]?.path;
	const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
	console.log("req.files", req.files);
	

	// Check weather the image is there 
	if (!avatarLocalPath || !coverImageLocalPath) {
		throw new ApiError(400, "Avatar and cover image are required");
	}


	// Upload on Clodimnay 
	const avatarUploadResult = await uploadonCloudinary(avatarLocalPath); 
	const coverImageUploadResult = await uploadonCloudinary(coverImageLocalPath); 

	//Create the user obkest and save to database 
	const newUser = new User({
		username : username.toLowerCase(), 
		email, 
		fullName, 
		password,
		avatar : avatarUploadResult.secure_url,
		coverImage : coverImageUploadResult.secure_url

	})
	
	await newUser.save(); 

	//Remove password from response 
	newUser.password = undefined; 



	//check weather the usrer created or not 
	const createdUser = await User.findById(User._id).select(" -password - refreshToken") 

	if(!createdUser) {
		throw new ApiError(501, 'Something went wrong while registring the user ')
	}

	//Return Response 
	return res.status(201).json(
		new ApiResponse(200, createdUser, 'User has been registred ')
	)

});




export { registerUser };