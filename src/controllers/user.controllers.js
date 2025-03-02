import ApiHandler from '../utils/apiHandler';
import User from '../models/user.model';

import asyncHandler from 'express-async-handler';

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

});

export { registerUser };