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


  // Todo list 
  
  const loginUser = asyncHandler(async (req, res) => {
    
    //1. get the username, password  and email 
    const { username, email, password} = req.body; 

    if(!username || !email){
      throw new ApiError(400, 'username and password is required '); 
    }

    //2. check email or password 
    const user = await User.findOne({ $or: [{username} , {email}] }); 
    
    if(!user){
      throw new ApiError(404 , 'username or email not find ')
    }

    //3. Check Password 

    const isPasswordValid = await user.isPasswordMatch(password); 

    if(!isPasswordValid){
      throw new ApiError(401, ' Invalid user credentails '); 
    }


    //4. Generate accessToken and refreshToken  
    const { accessToken , refreshToken } = await generateAccessTokenAndRefreshToken(user._id); 

    const logedInUser = user.findById(user._id).select("-password -refreshToken"); 

    //5. Send thhrough cookies 

    const option ={
      httpOnly : true, 
      secure : true
    }

    return res.status(200)
    .cookie("accessToken" , accessToken , options) 
    .cookie("refreshToken" , refreshToken , options) 
    .json(
      new ApiResponse( 200 , {
          user : logedInUser, accessToken , refreshToken
      } , "User logedIn Successfully ")
    )

  })


  const generateAccessTokenAndRefreshToken = async(userId) => {

    try{
      const user = await User.findById(userId); 
      const accessToken = user.generateAccessToken(); 
      const refreshToken = user.generateRefreshToken(); 
      
      //save refreshToken to databases 
      user.refreshToken = refreshToken; 
      await user.save({validateBeforeSave : false })

      return { accessToken, refreshToken }

    } 
      catch(err){
        throw new ApiError(501, " Something went wrong while generateToken and refreshToken ")
      }

  }



 export { registerUser }; 