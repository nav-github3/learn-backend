import  { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import  { asyncHandler } from '../utils/asyncHandler.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'


const registerUser = asyncHandler(async (req, res) => {

    // Regsiter user
    const {fullName , email , password , username} = req.body;

    // 2. Validate weather filed is empty or not 
    if([ fullName, email , password , username].some( (field) => field?.trim() === "")){
        throw new ApiError(400 , "All fields are reqsuired "); 
    }


    // 3. Check of user already exists or not 
    const existedUser = await User.findOne({$or : [{ email } , { username } ]});
    
    if(existedUser){
        throw new ApiError(409 , "User already exists ");
    }


    // 4. Check avatar and  cover iamge 

    const avatarLocalpath = req?.file?.avatar[0]?.path
    const coverImageLocalpath = req?.file?.coverImage[0]?.path


    if(!avatarLocalpath){
        throw new ApiError(400 , "Please upload avatar");
    }


    // 5. uplload on Cloudinary 

    const avatar = await uploadOnCloudinary(avatarLocalpath); 
    const coverImage = await uploadOnCloudinary(coverImageLocalpath); 

    if(!avatar){
        throw new ApiError(500 , "Unable to upload avatar on cloudinary ");
    }


    // 6 . Create user 
    
    const user = await User.create({
        fullName, 
        avatar : avatar?.url,
        coverImage : coverImage?.url || "",
        email, 
        password, 
        username : username.toLowerCase()
    }); 


//7. Remove password 
  const createdUser = await User.findByid(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user ")
  }

  return res.status(201).json(
    new ApiResponse(200,createdUser, "User registered successfuly")
  ) 

 })



 export { registerUser }; 