import asyncHandler from 'express-async-handler';
const registerUser = asyncHandler(async (req, res, next) => {
	res.status(200).json({
		success: true,
		message: 'Register User'
	})
});

const loginUser = asyncHandler(async (req, res, next) => {
	res.status(200).json({
		success: true,
		message: 'Login User'
	})
});


export {registerUser, loginUser};