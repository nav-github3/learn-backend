import { asyncHandler } from "../utils/asyncHandller.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary  } from "../utils/cloudinary.js"
import { ApiResponse  } from "../utils/ApiRespose.js";
import jwt from "jsonwebtoken"
import { upload } from "../middlewares/multer.middleware.js";
  

  // 1. get user details from frontend / postman 
  // 2. validation of the inputes from the users -- "not empty"
  // 3. Check if user already exists  -- check email / uername 
  // 4. files are present or not  --check for images and avatar 
  // 5. Upload them to clodinary  --get url 
  // 6. Create user object - create entry in db 
  // 7. Remove password and refresh token filed from response 
  // 8. Check for user creation 
  // 9. Return9ing the response 



  const generateAccessAndRefereshTokens = async (userId) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error("User not found for ID:", userId);
        throw new ApiError(404, "User not found");
      }
  
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
  
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
  
      return { accessToken, refreshToken };
    } catch (error) {
      console.error("Token generation error:", error);
      throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
  };
  

// 1. Register user
  const registerUser = asyncHandler(async (req, res) => {
    const {fullName , email , username , password } = req.body; 



// 2. validiate fileds are empty or not  
  if([fullName , email , username , password ].some( (field) => field?.trim() === "")){
   throw new ApiError(400,'all fields are required '); 
  }

// 3. Check user aready there or not 
  const existUser = await User.findOne({
    $or : [{ username : username.toLowerCase() } , { email }]
  })
  
  if(existUser) {
    throw new ApiError( 409 , "User already exists")
  }


  // console.log(req.files)

// 4. check images and avatar 
  
  const avatarLocalpath = req.files?.avatar[0]?.path
  const coverImageLocalpath = req.files?.coverImage[0]?.path; 


  if(!avatarLocalpath) {
    throw new ApiError(400, "Avatar file is required ")
  }

  //5. Upload them to Cloudinry 
  
  const avatar = await uploadOnCloudinary(avatarLocalpath)
  const coverImage = await uploadOnCloudinary(coverImageLocalpath)

  if(!avatar) {
    throw new ApiError(400, "Avatar is file is rrquired ")
  }

  //6. upload on database 
  const user = await User.create({
    fullName, 
    avatar : avatar.url, 
    coverImage : coverImage.url || "", 
    email,
    password, 
    username : username.toLowerCase() 
  }); 


  //7. Remove password 
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user ")
  }

  return res.status(201).json(
    new ApiResponse(200,createdUser, "User registered successfuly")
  )


  }); 

  const loginUser = asyncHandler(async (req, res) => {
      // 1. Todo list 
      // 2. get the username or email from the user 
      // 3. check weather user is present or not 
      // 4. check password check 
      // 5. access and refresh token generation 
      // 6. send cookie secure cookie 


      const { username, email , password } = req.body

      if(!(username || email)){
        throw new ApiError(400, 'username or email is require')
      }

      //2. check username or email 
      const user = await User.findOne({ $or : [{username} , {email} ]})
      if(!user){
        throw new ApiError(404, "User doen't exists ")
      }

      //3. check Password 
      const isPasswordValid = await user.isPasswordCorrect(password)

      if(!isPasswordValid) {
        throw new ApiError(401 , "Invalid user credentials ")
      }

      //4. Generate Access token and RefreshToken
      const { accessToken , refreshToken } = await generateAccessAndRefereshTokens(user._id)

 
      const loggedInUser = await User.findById(user._id).select( "-password -refreshToeken"); 

      //5. Send through cookies
      
      const options = {
        httpOnly : true, //access through server n
        secure : true
      }

      return res.status(200)
      .cookie( "accessToken" , accessToken , options)
      .cookie("refreshToken" , refreshToken , options)
      .json(
        new ApiResponse( 
          200 , {
          user : loggedInUser , accessToken , refreshToken
        }, "User loggein successfully ")
      )

  })


  const logoutUser = asyncHandler(async (req, res) => {
      await User.findByIdAndUpdate(req.user_id,
        {
        $set : {
          refreshToken : undefined
        }
        }, 
        {
          new :true
        }
    ) 
    
    //options for cookie  
    const options = {
      httpOnly : true, //access through server 
      secure : true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, {}, "User logged out successfully")
    )


  })


  

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  
  // 1. Check if refresh token is provided
  if(!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required")
  }

  try {
    //2. verify the refresh Token 
    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET); 
    
    //3. Check if user exists
    const user = await User.findById(decodedToken?._id)
    
    if(!user) {
      throw new ApiError(401, "Invalid refresh Token ")
    }
  
    //4. check refreshToken and refreshToken in db 
    if(incomingRefreshToken !== user?.refreshToken){
      throw new  ApiError(401, "Invalid refresh token is Expired  ")
    }  
  
    //5. make new generate Access Token and Refrehs Token 
    
    const options = { 
      httpOnly : true, //access through server
      secure : true
    }
  
    const {accessToken, newRefreshToken } = await user.generateAccessAndRefereshTokens(user._id); 
   
    return res.status(200)
    .accessToken("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshTokenreshToken, options)
    .json(new ApiResponse(
       200,{accessToken, refreshToken:newRefreshToken }, "Acess token generated successfully"
    ))
  } catch (error) {
    new ApiError(401, error?.message || "Invalid refresh token is Expired "); 
  }


})

const changeCurrentPassowrd = asyncHandler(async (req, res) => {
  const { currentPassword , newPassword } = req.body; 

  //2. find the user 
  const user = await User.findById(req.user?._id); 
  //3. check password
  const isPasswordCorrect = await user.isPasswordMatch(currentPassword)  
  if(!isPasswordCorrect) {
    throw new ApiError(401, "Invalid current password ")
  }

  //4. Update the password 
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  //5. send response
  return res.status(200).json(
    new ApiResponse(200, {}, "Password changed successfully")
  )
})


const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, req.user, "User fetched successfully")
  )
})


const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email, username } = req.body;

  if(!fullName || !email || !username) {
    throw new ApiError(400, "All fields are required")
  }

  //2.find the user 
  const user = await User.findById(
    req.user._id, 
    {
      $set : {
        fullName,
        email,
        username 
      }
    }, 
    {new : true}
  ).select("-password -refreshToken"); 



  return res.status(200).json(
    new ApiResponse(200, user, "User updated successfully")
  )


})


const updateAvatar = asyncHandler(async (req, res) => {

const avatarLocalpath = req.file?.path;
if(!avatarLocalpath) {
  throw new ApiError(400, "Avatar is required")
}

// upload on cloudinary
const avatar = await uploadOnCloudinary(avatarLocalpath);
  if(!avatar) {
    throw new ApiError(400, "Avatar is not  uploaded peoperly")
  }


//3. upadte the user 
const user = await User.findByIdAndUpdate(req.user._id, 
  {
    $set : {
      avatar : avatar.url
    }
  },   
  {
    new : true
  }).select("-password");


  return res.status(200).json(
    new ApiResponse(200, user, "Avatar updated successfully")
  )

})



const updateCoverImage = asyncHandler(async (req, res) => {


  const coverImageLocalpath = req.file?.path;
  if(!coverImageLocalpath) {
    throw new ApiError(400, "Cover image is required")
  }

  //upload on cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalpath); 
  if(!coverImage) {
    throw new ApiError(400, "Cover image is not  uploaded peoperly")
  }

  //3. upadte the user
  User.findByIdAndUpdate(req.user._id, 
    {
      $set :{
        coverImage : coverImage.url
      }
    }, 
    { new : true}
  ).select("-password");


  return res.status(200).json(
    new ApiResponse(200, user, "Cover image updated successfully")
  )

})





export { 
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  changeCurrentPassowrd, 
  updateUserDetails, 
  updateAvatar, 
  updateCoverImage

};

