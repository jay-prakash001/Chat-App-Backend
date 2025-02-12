import User from "./models/user.models.js"
import Chat from "./models/chat.model.js"
import { verifyToken } from "./utils/verifyToken.js"
import sendNotification from "./utils/notification.js"
import uploadOnCloudinary from "./utils/cloudinary.js"
import uploadFileOnLocalPath from './utils/uploadFileInLocalPath.js'
const ws = (io, socket) => {

    const sendChatList = async (user) => {
        console.log("sending the chat list")
        user.chats.forEach(async (chat) => {
            console.log("-=--------------------------")
            // console.log(chat)
            const u = await User.findById(chat).select("-refreshtoken -socketId -chats -contacts")
            if (u) {

                const name = await findContactName(user, u) || u.phone
                // console.log(u)
                const lastChat = await Chat.findOne({
                    $or: [
                        { sender: u._id },
                        { receiver: u._id }
                    ]
                }).sort({ createdAt: -1 })

                if (!lastChat) return
                // console.log(lastChat)
                const chatInfo = {
                    name: name,
                    user_id: u._id,
                    profileImg: u.profileImg,
                    phone: u.phone,
                    bio: u.bio,
                    isOnline: u.isOnline,
                    lastSeen: u.updatedAt,
                    lastChat: {
                        isSended: lastChat.sender.toString() === user._id.toString(),
                        content: lastChat.content,
                        time: lastChat.createdAt
                    }

                }

                // console.log(chatInfo)
                io.to(user.socketId).emit('chatList', chatInfo)
            }
        })
    }

    const getUserInfo = async (userName, userData, user) => {
        const details = {
            name: userName,
            user_id: userData._id,
            profileImg: userData.profileImg,
            phone: userData.phone,
            bio: userData.bio,
            isOnline: userData.isOnline,
            lastSeen: userData.updatedAt,
        }
        if (user) {

            io.to(user.socketId).emit("getUserInfo", details)
        } else {
            socket.emit("getUserInfo", details)
        }
    }
    const findContactName = async (user, receiver) => {
        let name = receiver?.phone
        await user.contacts.forEach((contact) => {

            if (contact.userInfo.toString() === receiver._id.toString()) {
                name = contact.name
            }

        })
        return name
    }
    socket.on('join', async (data) => {

        const { token, firebaseNotificationToken } = data


        if (!token) return
        const user_id = await verifyToken(token)

        const user = await User.findByIdAndUpdate(user_id?._id).select("-refreshtoken")

        user.socketId = socket.id
        user.isOnline = true;
        user.fcmToken = firebaseNotificationToken
        await user.save({ validateBeforeSave: false })

        sendChatList(user)
        // console.log(socket.id)
        // console.log("user Joind ",user.socketId)
        // console.log(firebaseNotificationToken)
        console.log("=============")

        // console.log(user.fcmToken) 1
        // console.log(user) 
        const details = {
            name: user.phone,
            user_id: user._id,
            profileImg: user.profileImg,

            phone: user.phone,
            bio: user.bio,
            isOnline: true,
            lastSeen: user.updatedAt,
        }
        io.emit("getUserInfo", details)

    })

    socket.on("chat", async (data) => {
        const { token, phone, msg } = data
        const user_id = await verifyToken(token)
        const user = await User.findById(user_id?._id)

        const receiver = await User.findOne({ phone: phone })

        const a = await User.findOneAndUpdate({ phone: user.phone }, {
            $addToSet: { chats: receiver._id }
        })
        const b = await User.findOneAndUpdate({ phone: receiver.phone }, {
            $addToSet: { chats: a._id }
        })





        const chat = await Chat.create({ sender: user._id, receiver: receiver._id, content: msg })
        sendChatList(b)
        sendChatList(a)


        io.to(user.socketId).emit("chat", { chat: chat, senderBio: user.bio })
        io.to(receiver.socketId).emit("chat", { chat: chat, senderBio: user.bio })
        //         io.to(receiver.socketId).emit('chat', {  msg : chat }) 
        const senderName = await findContactName(b, a)
        // console.log(senderName)

        // console.log(a, b)
        await sendNotification(senderName, chat.content, a.profileImg, b.fcmToken)


    })

    socket.on("updateProfileImg", async (data) => {
        const { img, fileType, token } = data
        // console.log(fileType)
        console.log(data)
        try {
            const localPath = await uploadFileOnLocalPath(img, fileType)

            if (!localPath) return
            const url = await uploadOnCloudinary(localPath)
            const user_id = await verifyToken(token)
            const user = await User.findByIdAndUpdate(user_id._id,{
                profileImg : url.secure_url
            },{new : true})
            await getUserInfo(user.bio, user,user)
        } catch (error) {
            console.log(error)
        }


    })

    socket.on("previousChat", async (data) => {
        // console.log(data)

        const { token, receiverId } = data

        const user_id = await verifyToken(token)
        const user = await User.findById(user_id._id)
        const receiver = await User.findById(receiverId)
        const chats = await Chat.find({
            $or: [
                {
                    $and: [
                        { sender: user._id },
                        { receiver: receiver._id }
                    ]
                },
                {
                    $and: [
                        { receiver: user._id },
                        { sender: receiver._id }
                    ]
                }
            ]
        })
        // console.log(chats)
        chats.forEach((chat) => {
            const senderBio = chat.sender.toString() === user._id.toString() ? user.bio : receiver.bio


            io.to(user.socketId).emit("chat", { chat: chat, senderBio: senderBio })

        })

    })


    socket.on("chatList", async (token) => {

        console.log(token)
        const user_id = await verifyToken(token)
        const user = await User.findById(user_id._id)
        await sendChatList(user)
    })
    socket.on("getUserInfo", async (data) => {
        const { token, userId } = data
        console.log(data)
        const user_id = await verifyToken(token)
        const user = await User.findById(user_id._id)
        const userData = await User.findById(userId)
        const userName = await findContactName(user, userData)
        console.log(userData)
        console.log(userName)

        await getUserInfo(userName, userData, user)


    })

    socket.on("getProfile", async (data) => {
        const { token } = data
        const user_id = await verifyToken(token)
        const user = await User.findById(user_id._id).select("-contacts -chats -refreshtoken -fcmToken")

        console.log('djjjjjjjjjjjjjjj')
        console.log(user)
        console.log('djjjjjjjjjjjjjjj')

        socket.to(user.socketId).emit("userProfile")

        await getUserInfo(user.bio, user, user)



    })


    socket.on("mediaChat",async(data)=>{

        console.log(data)
    })




}

export default ws