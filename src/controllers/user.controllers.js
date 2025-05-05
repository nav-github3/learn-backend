import  { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import  { asyncHandler } from '../utils/asyncHandler.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'


const registerUser = asyncHandler(async (req, res) => {


  //1. Register the user 
  const { username , fullName , email , password } = req.body; 

  //2. validate weather fields are empty or not 
    if([fullName , email , password , username].some( (field) => field?.trim === "" )){
      throw new ApiError(400, "All fileds are required ")
    }


  //3. check uer is already register or not 
    const existedUser = await User.findOne({
      $or : [{username : username.toLoweCase()}, {email}]
    })

    if(existedUser){ 
      throw new ApiError(409 , "User already exists ")
    }

   //4. avatar is present or not in localPath 
    const avatarLocalpath = req?.files?.avatar[0]?.path
    const coverImageLocalpath = req?.files?.coverImage[0]?.path; 


    if(!avatarLocalpath){
      throw new ApiError(400, "Avatar is required for registreation  "); 
    }

    //5. upload on clodinary
    const avatar = await uploadOnCloudinary(avatarLocalpath); 
    const coverImage = await uploadOnCloudinary(coverImageLocalpath); 


    if(!avatar) {
      throw new ApiError(400, "Avatar is not uploaded properky on clodudinary")
    }


    //6. Create user 
    const user = await User.create({
      fullName, 
      avatar : avatar.url, 
      coverImage : coverImage.url, 
      email, 
      password, 
      usernmae : username.toLoweCase()
    }); 

    //7.  

})

const loginUser = asyncHandler(async(req, res) => {
    
  const {username , email , password } = req.body; 

  if(!(username || email)){
    throw new ApiError(4000, "Username or email required for login "); 
  }

  //check user already exists or not 
  const user = await User.findOne({ $or : [{username}, {email}]})
  if(!user){
    throw new ApiError(401, " Invalid username or email "); 
  }

  //check password 
  const isPasswordValid = await user.isPasswordMatch(password); 

  if(!isPasswordValid){
     throw new ApiError(401 ,  " Invalid password ")
  }; 


  //generate accessToken and refreshToken 

  const { accessToken , refreshToken } = await generateAccessTokenAndRefreshToken(user._id); 

  const logedInUser = await User.findById(user._id).select( "-password -refreshToeken"); 


  //send throw cookies 

  const options = {
    httpOnly : true, 
    secure : true
  }


  return res.status(200)
  .cookie("accessToken", accessToken , options)
  .cookie("refreshToken", refreshToken, options)
  .json( new ApiResponse(200, {
      user : logedInUser, refreshToken , accessToken
  }, " User logged in successfully ")); 

})


const loggOutUser = asyncHandler(async (req, res) => {


  // 🧠 Step 1: Remove the refresh token from the user’s document in MongoDB
  // `$unset` removes the `refreshToken` field from the user
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 }
  }, {
    new: true // return the updated document (optional, not used here)
  });



  // 🧹 Step 2: Clear the cookies from the client (browser)
  // This ensures the user cannot reuse tokens stored in cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");



  // ✅ Step 3: Send a response to the client indicating successful logout
  return res.status(200).json(
    new ApiResponse(200, {}, "User logged out successfully")
  );
});




const generateAccessTokenAndRefreshToken = async(userId)=>{   
try {
  const user = await User.findById(userId);
  const accessToken  = user.generateAccessToken(); 
  const refreshToken = user.generateRefreshToken(); 

  //save refrshToken in database 
  user.refreshToken = refreshToken; 
  await user.save({validateBeforeSave : false});
  
  return { accessToken , refreshToken };
}

catch(error) {
  throw new ApiError(501 , "Something went wrong while generating access token and refresh token "); 
}
}


 export { registerUser, 
  loginUser,
  loggOutUser,
  }; 