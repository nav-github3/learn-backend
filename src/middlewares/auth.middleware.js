import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandller.js";
import jwt from "jsonwebtoken" 
import { User } from "../models/user.models.js";


export const verifyJWT = asyncHandler(async (req,res, next) => {
try {
		const token = req.cookies?.accessToken  || req.header("Authorization")?.replace("Bearer ","")
	
		if(!token) {
			throw new ApiError(401, "Unautherizes Error !! "); 
		}
	
	
		const decodedToken =jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
		const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
	
		
		if(!user){
			// Next :  Todo disscuss about frontend 
			throw new ApiError(401, "Unautherizes Error !! ");
		}
	
	
		req.user = user;
		next();
	
} catch (error) {
	throw new ApiError(401, " Invalid access token ", error?.message)
}

})