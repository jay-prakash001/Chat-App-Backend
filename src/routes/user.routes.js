import { Router } from "express";
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { upload } from '../middleware/multer.middleware.js'
import User, { Contact, contactSchema } from '../models/user.models.js'
import Chat from '../models/chat.model.js'
import uploadOnCloudinary from "../utils/cloudinary.js"
import { verifyJWT } from "../middleware/auth.middleware.js";
import { generateTokens } from "../utils/generateTokens.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router()

router.route("/login").post(async (req, res) => {
    const { phone } = req.body

    if (!phone) {
        throw new ApiError(401, "phone number is required.")
    }
    const user = await User.findOne({ phone: phone })
    if (!user) {
        throw new ApiError(404, "user not found with phone number.")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const { accessToken, refreshtoken } = await generateTokens(user._id)
    user.refreshtoken = refreshtoken
    await user.save({ validateBeforeSave: false })



    return res.status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshtoken,options) 
    .json(new ApiResponse(200, { user, accessToken, refreshtoken }, "user logged in successfully"))
})

router.route("/register").post(upload.single("profileImg"), async (req, res) => {
    console.log("=======================")
    console.log(req.body)
    console.log(req.file)
    const { phone, bio, } = req.body
 
    if (!phone) {
        throw new ApiError(401, "phone number is required")
    }

    if (!req.file) {
        throw new ApiError(401, "profile image is required")
    }
    let profileImg = await uploadOnCloudinary(req.file.path)

    console.log(profileImg.secure_url)
    let user = await User.findOneAndUpdate({ phone: phone }, { bio: bio, profileImg: profileImg.secure_url })
    if (user) {
        await user.save({ validateBeforeSave: false })

    } else {

        user = await User.create({ phone: phone, bio: bio, profileImg: profileImg.secure_url })

    }
    console.log(user)
    const options = { httpOnly: true, secure: true }
    const { accessToken, refreshtoken } = await generateTokens(user._id)
    user.refreshtoken = refreshtoken

    await user.save({ validateBeforeSave: false })
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshtoken, options).json(
            new ApiResponse(200, {
                user: user,
                accessToken,
                refreshtoken
            },
                "user loggedin")
        )
})


router.route('/get').get(verifyJWT, (req, res) => {
    console.log(req.user)
    return res.status(200).json(req.user)
})

router.route("/add_contact").post(verifyJWT, asyncHandler(async (req, res) => {

    console.log(req.body)
    const { name, phone } = req.body
    if (!name || !phone) {
        throw new ApiError(400, "phone and name both are required")
    }
    const contact = await User.findOne({ phone: phone }).select("-refreshtoken -socketId -chats -contacts -_v -createdAt -isOnline")

    if (!contact) {
        throw new ApiError("User is not in Chat App. Please invite them.")
    }
    const _id = req.user._id
    const contactUser = { name: name, userInfo: contact }
    console.log("======================")
    // console.log(contactUser) 
    // await contactUser.save()

    const isAdded = await User.find({ _id: _id, "contacts.userInfo": contact._id })
    console.log(_id)
    console.log(contact._id)
    console.log(isAdded, isAdded.length)
    if (isAdded.length == 0) {


        const user = await User.findByIdAndUpdate({ _id }, {
            $push: {
                contacts: contactUser
            }
            // $addToSet: {
            //     contacts: contactUser
            // }
        })
        await user.save({ validateBeforeSave: false })
    }
    return res.status(200).json(new ApiResponse(200, contactUser, "contact added successfully"))
}))


router.route("/send_chat").post(verifyJWT, asyncHandler(async (req, res) => {

    const senderId = req.user._id
    const { phone, msg, name } = req.body

    const sender = await User.findById(senderId?._id)
    const receiver = await User.findOne({ phone: phone })

    console.log(sender, receiver)
    if (!sender || !receiver) {
        console.log("user not exists")
    }

    const chatU1 = { name: sender.phone, userInfo: receiver._id };

    const user = await User.findOne({
        phone: receiver.phone,
        "chats.name": sender.phone
    });

    if (!user) {
        const updatedUser = await User.findOneAndUpdate(
            { phone: receiver.phone },
            { $addToSet: { chats: chatU1 } },
            { new: true }
        );

        console.log("Chat added:", updatedUser);
    } else {
        console.log("Chat already exists");
    }

    const chatU2 = { name: receiver.phone, userInfo: sender._id };

    const user2 = await User.findOne({
        phone: sender.phone,
        "chats.name": receiver.phone
    });

    if (!user2) {
        const updatedUser = await User.findOneAndUpdate(
            { phone: sender.phone },
            { $addToSet: { chats: chatU2 } },
            { new: true }
        );

        console.log("Chat added:", updatedUser);
    } else {
        console.log("Chat already exists");
    }

    const chat = await Chat.create({ sender: sender._id, receiver: receiver._id, content: msg })

    console.log(chat)
    return res.send(chat)

}))

router.route("/get_contacts").get(verifyJWT, asyncHandler(async (req, res) => {
    const user = req.user;
    const users = await Promise.all(
        user.contacts.map(async (contact) => {
            const contactUser = await User.findById(contact.userInfo)
                .select("-refreshtoken -socketId -chats -contacts -_v -createdAt -isOnline");

            return { name: contact.name, userInfo: contactUser };
        })
    );

    return res.status(200).json(new ApiResponse(200, users, "Fetched successfully"));

}))
export default router 