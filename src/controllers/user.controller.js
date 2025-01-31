import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import path from 'path'
import fs from 'fs';
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

export {registerUser}