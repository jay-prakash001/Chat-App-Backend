import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
export const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    userInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
})

export const Contact = mongoose.model('contact', contactSchema)
const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true
    },
    socketId: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        default: "Hey there I am using Chat app."
    },
    profileImg: {
        type: String,
        default: "https://res.cloudinary.com/dm7a2laej/image/upload/v1734884267/h13iy6gckawrxgc6icdh.png"
    },
    // chats: [contactSchema],
    chats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    contacts: [contactSchema],
    isOnline: {
        type: Boolean,
        default: false
    },
    refreshtoken: {
        type: String,
        default: null
    }
}, { timestamps: true })
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}
const User = mongoose.model('user', userSchema)
export default User 