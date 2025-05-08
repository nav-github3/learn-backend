import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";




const generateAccessTokenAndRefreshTokens = async(userId) => {

 try {
   const user = await User.findById(userId);
   if(!user) {
     console.log(" User not found ", userId); 
     throw new ApiError(400 , "User not found");
   }
 
   const accessToken = user.generateAccessToken(); 
   const refreshToken = user.generateRefreshToken(); 
 
   user.refreshToken = refreshToken;
   await user.save(); 
   return { accessToken , refreshToken };
   
 } catch (error) {
    console.log("Error in generating access and refresh token ", error);
    throw new ApiError(500 , "Internal Server Error");
 }
  
  
}


const registerUser = asyncHandler(async(req, res) =>{

  //1. get the data from the user 
  const { fullName , email , password , username} = req.body; 

  //2. validate the data 
  if([fullName , email , password , username].some((field) => field?.trim() === "" )){
    throw new  ApiError(400 , "All fields are required");
  }

  //3. Check if the usder already exixts or not 
  const existedUser = await User.findOne({ $or : [{ username : username.toLowerCase() }, { email : email.toLowerCase() }] })

  if(existedUser){
    throw new ApiError(400 , "User already exists");
  }

  //4. check wether the avatr and coverImage are send properly or not
  
  const avatarLocalPath = req.files?.avatar[0]?.path; 
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if(!avatarLocalPath){
    throw new ApiError(400 , "Avatar is required");
  }

  // 5. upload the avatar and coverImage to cloudinary 
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath); 

  if(!avatar){
    throw new ApiError(400 , "Avatar is required for user registration");
  }

//6. create a new user 
const user = await User.create({
  fullName, 
  avatar : avatar.url,
  coverImage : coverImage?.url || null,
  email : email.toLowerCase(),
  password, 
  username : username.toLowerCase(),
})
//7. send the response 
const createdUser = await User.findById(user._id).select("-password -refreshToken")

if(!createdUser){
  throw new ApiError(400 , "Something went wrong while registerin the user"); 
}

return res.status(201).json( new ApiResponse(201 , createdUser , "User registered successfully"));

}); 






const loginUser = asyncHandler(async(req, res) =>{
  
//1. get the data from the user data
const { username , email , password } = req.body; 


//2. validate the data
if(!(username || email)){
  throw new ApiError(400 , "Username or Email is required");
}

//3.check if the user exists or not
const user = await User.findOne({ $or : [{username}, {email}] })
if(!user){
  throw new ApiError(400 , "Invalid login  credentials");
}


//4. check if the password is correct or not
const isPasswordCorrect = await user.isPasswordCorrect(password); 
if(!isPasswordCorrect){
  throw new ApiError(400 , "Invalid login credentials");

}


//6. generate the access and refresh Token 
const { accessToken , refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);
const loggedInUser = await User.findById(user._id).select("-password -refreshToken");


// 7. send the response through cookies 

const options = {
  httpOnly : true,
  secure : true,
}

return res.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken , options)
.json((
  new ApiResponse(200 , loggedInUser , "User logged in successfully") 
))


})



const logoutUser = asyncHandler(async(req, res, next) =>{

await User.findByIdAndUpdate(req.user._id, 
    {
      $set :{
        refreshToken: undefined
      }
    }, {
      new : true
    }
  )

  
  const options = {
    httpOnly : true, 
    secure : true
  }

  return res.status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(
    new ApiResponse(200 , {} , "User logged out successfully")
  )

})


//making refresh Token 
const refreshAcessToken = asyncHandler(async(req, res, next) => {

  ///requesting the refreshToken to backend 
  const incominRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incominRefreshToken){
    throw new ApiError(401 , "unautherised request");
  }

 try {
   
   //verify the refresh token
   const decodedToken = jwt.verify(incominRefreshToken , process.env.REFRESH_TOKEN_SECRET);
  
   const user = await User.findById(decodedToken?._id)
   if(!user){
     throw new ApiError(401 , "Invalid refresh token");
   }
 
   // check the incoming refreshToken is same as the one  whih is stored in the database 
   if(incominRefreshToken !== user.refreshToken){
     throw new ApiError(401 , "Refred token is used ");
   }
 
   //generate the new access and refresh token
   const {accessToken , newRefreshToken } = await generateAccessTokenAndRefreshTokens(user._id);  
 
   options = { 
     httpOnly : true, 
     secure : true,
   }
 
   return res.status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("newRefreshToken", newRefreshToken , options)
   .json(
     new ApiResponse(200 , {} , "Access token refreshed successfully")
   )
 } catch (error) {
    throw new ApiError(401 , "Invalid refresh token");
 }

}); 



const changePassword = asyncHandler(async(req, res, next) => {

  //1. get the data from the user 
  const { oldPassword , newPassword } = req.body; 
  
  //2. find the user and check pasowowrd 
  const user = await User.findById(req.user._id); 

  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);
  if(!isPasswordCorrect){
    throw new ApiError(400 , "Old password is incorrect");
  }


  //set new passowrd 
  user.password = newPassword;

  await user.save({ validateBeforeSave : false }); 

  return res.status(200).json(
    new ApiResponse(200 , {} , "Password changed successfully")
  )

})



const getCurrentUser = asyncHandler(async(req, res, next) => {

  res.status(200).json(
    new ApiResponse(200 , req.user , "User fetched successfully")
  )
})


const updateAccountDetails = asyncHandler(async(req, res, next) => {
   
  const { fullName , username , email } = req.body;
  
  if(!fullName || !username || !email){
    throw new ApiError(400 , "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id, 
    {
      $set : {
        fullName : fullName,
        username : username,
        email : email
      }
    },
    {
      new : true, 
    }
  ).select("-password");


  res.status(200).json(
    new ApiResponse(200 , user , "User details has been updated successfully")
  )
})


const userUpdateAvatar = asyncHandler(async(req, res, next) => {
  
  const avatarLocalPath = req.file?.path; 

  if(!avatarLocalPath){
    throw new ApiError(400 , "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath) 

  if(!avatar){
    throw new ApiError(400 , "Avatar while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(req.user?._id, 
    {
      $set:{
        avatar : avatar.url
      }
    }, 
    {
      new : true,
    }
  ).select("-password");

  return res.status(200).json(
    new ApiResponse(200 , user , "Avatar has been updated successfully")
  )

})


const userUpdateCoverImage = asyncHandler(async(req, res, next) => {

  const coverImageLocalPath = req.file?.path;

  if(!coverImageLocalPath){
    throw new ApiError(400 , "Cover image is required");
  }


  const coverImage =  await uploadOnCloudinary(coverImageLocalPath);
  if(!coverImage){
    throw new ApiError(400 , "Error while uploadig cover image");
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set : {
        coverImage : coverImage.url
      }
    }, 
    { 
      new : true, 
    }
  ).select("-password");


  return res.status(200).json(
    new ApiResponse(200 , user , "Cover image has been updated successfully")
  )

})




const getChannelProfile = asyncHandler(async(req, res, next) => {

  const { username } = req.params;
  if(!username.trim()){
    throw new ApiError(404, " username is missing here "); 
  }


  const channel =  await User.aggregate([
    {
      $match: {
          username : username.toLowerCase()
      }
    }, 
    {
      $lookup : {
        from : "subscriptions", 
        localField : "_id", 
        foreignField : "channel", 
        as : "subscribers", 
      }
    }, 
    {
      $lookup : {
        from : "subscriptions",
        localField : "_id", 
        foreignField : "subscriber", 
        as : "subscribedTo"
      }
    }, 
    {
      $addFields : {
        subsriberCount : {
          $size : "$subscribers"
        }, 
        channelSubcribedTo : {
          $size : "$subscribedTo"
        }, 
        
        isSubscribed : {
          $cond : {
            $if : { $in : [req.user?._id ,"$subscibers.subsciber"] }           
          }, 
          then : true,
          else : false
        }

      }
    }, 
    
    {
      $project: {
          fullName: 1,
          username: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1

      }
  }

  ])

  if(!channel.length){
    throw new ApiError(404 , " Channel not found ");
  }
  
  return res.status(200).json(
    new ApiResponse(200, channel[0] , " Channel profile fetched successfully ")
  )

})



const getWatchHistory = asyncHandler(async(req, res, next) => {
    
    const user = await User.aggregate([
      {
        $match : { _id : mongoose.Types.ObjectId(req.user._id) }
      }, 

      { 
         $lookup : {
          from : "videos", 
          localField : "watchHistory", 
          foreignField : "_id", 
          as : "watchHistory",

          pipeline : [
            { 
              $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",  
                as : "owner", 

                pipeline : [
                  {
                    $project : {
                      fullName : 1,
                      username : 1, 
                      avatar : 1 
                    }
                  },
                  {
                    $addFields : {
                      owner : {
                        $first : "$owner"
                      }
                    }
                  }
                ]

              }
            }
           ]

         }, 

      }, 
    ])

    return res.status(200).json(
      new ApiResponse( 200, user[0].getWatchHistory, " watch history fetched successfully ")
    )

})

      







export { registerUser ,
         loginUser , 
         logoutUser, 
         refreshAcessToken,
         changePassword, 
         getCurrentUser, 
         updateAccountDetails, 
         userUpdateAvatar, 
         userUpdateCoverImage, 
         getChannelProfile, 
         getWatchHistory
         };