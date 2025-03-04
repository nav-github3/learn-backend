
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadImage } from '../utils/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


import asyncHandler from '../utils/asyncHandler.js';

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
});


//check for avatar and coverimage and validate 

const avataLocalPath = req.files?.avatar?.[0]?.path;
const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
console.log("req.files", req.files);

if(!avataLocalPath || !coverImageLocalPath) {
	throw new ApiError(400, "Avatar and cover image are required");
}






export { registerUser };