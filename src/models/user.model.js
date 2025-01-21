import mongoose, {Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema({

    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true // for optimised searching of a field set index to true. it increases the computation a little. otherwise also we can search a field in the db.
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true, //automatically removes the white spaces at the beginning and end of the input
        index: true // for optimised searching of a field set index to true. it increases the computation a little. otherwise also we can search a field in the db.
    },
    avatar: {
        type: String, //cloudinary url will be taken here
        required: true
    },
    coverImage: {
        type: String 
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String,
    }
},

{
    timestamps:true
})

userSchema.pre("save", async function (next) { // this encryption and decryption take time hence the func has been made async.
    if(this.isModified("password"))// we want ot encrypt the password only if it has been modified. no if some othe r field like name or avatar is modified
    {
        this.password = bcrypt.hash(this.password, 10)// hash(what to encrypt , howo many rounds of encryption)
    }
    next()
})


//to check if the password that we are savin gafter incrption is actually correct
userSchema.methods.isPasswordCorrect = async function (password) {// we cannot use an arrow func here as it dosent accept instances like this.password
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY 
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY 
        }
    )
}


 

export const User = mongoose.model("User",userSchema)