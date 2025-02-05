import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import path from 'path'
import fs from 'fs';
import jwt from 'jsonwebtoken'
import mongoose from "mongoose"


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access token")
    }
}
const registerUser = asyncHandler ( async (req , res) => {


    //get details from frontend
    //validation of the details (not empty)
    //check if user already exists : username , email
    //check for images, avatar
    //upload them to cloudinary
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //if user formed return response


    const {fullname, email, username, password} = req.body
    //console.log(req.body)
    console.log("email :" , email)

    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({// returns true if it find a user with that usernaem or email
        $or: [{ username }, { email }]
    })

    if(existedUser) {
        throw new ApiError(409, "User with this email or username already exists")
    }

    const avatarLocalPath = path.resolve(req.files?.avatar[0]?.path);
    const coverImageLocalPath = path.resolve(req.files?.coverImage[0]?.path);

    //console.log(req.files)
    
    
  
    if(!avatarLocalPath) {
       throw new ApiError(400, "Avatar file is required")
    }

 
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }


    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url,
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
 
})

const loginUser = asyncHandler ( async (req, res) => {
    // get data from req body
    // verify using username or email
    // find if the user exists in db
    // then check password
    // if password matches give access and refresh token
    //send cookie
  
    const {email, username, password} = req.body
   
    if(!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(400, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, "Password incorrect")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser =  await User.findById(user._id).select("-password -refreshToken")

   const options = {
        httpOnly: true,
        secure: true//these teo fields ensure that only our server can modify the cookies not the front end
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
    new ApiResponse(
        200,
        {
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged in successfully"
    )
   )

         

})

const logoutUser = asyncHandler (async (req , res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true//these teo fields ensure that only our server can modify the cookies not the front end
   }


   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "User logged out"))
    
})

const refreshAccessToken = asyncHandler ( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if(!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized access")

    }

   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user) {
         throw new ApiError(401, "invalid refresh token")
     }
 
     if(incomingRefreshToken  !== user?.refreshToken) {
         throw new ApiError(401, "refresh token is expired or used")
 
     }
 
     const options = {
         httpOnly: true,
         secure: true
     }  
 
     const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
 
     return res
     .status(200)
     .cookie("accessToken" , accessToken , options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         new ApiResponse(
             200,
             {accessToken, refreshToken : newRefreshToken},
             "Access token refreshed"
         )
         
     )
   } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token  " )
   }

})

const changeCurrentPassword = asyncHandler (async (req, res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400 , "Incorrect old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password changed successfully")
    )
})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .send(200)
    .json(
        new ApiResponse(200, req.user, "current user fetched successfully")
    )

})

const updateAccountDetails = asyncHandler (async (req, res) => {
    const {fullname, email} = req.body

    if(!fullname || !email) {
        throw new ApiError(400, "All fiels are required")
    }


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email// this is same as email :  email (js syntax)
            }
        },
        {
            new: true // tells that th e new valuse(updated ones) are ti be stored into user
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details updated successfully")
    )
})

const updateUserAvatar = asyncHandler (async (req, res) => {
    const avatarLocalPath = req.file?.path
    
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successsfully")
    )

    
})

const updateUserCoverImage = asyncHandler (async (req, res) => {
    const coverImageLocalPath = req.file?.path //since we have a single file in req we use file. but in registration we had 2 hende files.
    
    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successsfully")
    )
})

const getUserChannelProfile = asyncHandler (async (req, res) => {
    const {username} = req.params

    if(!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedTo: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                         if: {$in: [req.user?._id, "subscribers.subscriber"]},
                         then: true,
                         else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedTo: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler (async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(String(req.user._id))// here we do not write id: req.user._id directly because req.user._id returns a string actually like objectId(2474729378p0394) . in simple dq queries liek findById mongoose automatically converts this srting to id. but this cannot be done in aggration 
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        
                        $lookup: {
                        
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    )
})

 
export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar , updateUserCoverImage, getUserChannelProfile, getWatchHistory}