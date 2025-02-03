import User from "./models/user.models.js"
import Chat from "./models/chat.model.js"
const ws0 = (io, socket)=>{
    

    socket.on('join', async (phone) => {
        console.log(phone)
        let user = await User.findOneAndUpdate({ phone: phone }, { socketId: socket.id , isOnline : true})
        if (!user) {
            user = await User.create({ phone: phone, socketId: socket.id, isOnline : true })
        }
        io.emit('join', `${user} joined`)
        console.log(user)
    })
    socket.on('chat', async (msg, target, phone) => {
     
        const sender = await User.findOne({ phone: phone })
        const receiver = await User.findOne({ phone: target })
        if(!sender || !receiver){
            console.log("user not exists")
        }
        const a = await User.findOneAndUpdate({phone : sender.phone},{
            $addToSet : {chats : receiver._id}
        })
        const b = await User.findOneAndUpdate({phone :  receiver.phone},{
            $addToSet : {chats : sender._id}
        })

        console.log(sender._id)
        console.log(a._id)
        console.log(receiver._id)
        console.log(b._id)


        const chat = await Chat.create({sender : sender._id, receiver : receiver._id, content : msg})
        io.to(receiver.socketId).emit('chat', {  msg : chat }) 
        io.to(sender.socketId).emit('chat', { msg : chat })
       
    })
 
    socket.on('previousChat',async(sender, receiver)=>{
        console.log(sender)
        console.log(receiver)
        const s = await User.findOne({phone : sender})
        const r = await User.findOne({phone :  receiver})
        const chats = await Chat.find({
            $or: [
              { sender: s, receiver: r },
              { sender: r, receiver: s }
            ]
          }).sort({ createdAt: 1 }); 
          
        console.log(chats)
        chats.forEach((chat) =>{

            io.to(socket.id).emit('chat',{msg : chat})
        }) 
  
    })

    socket.on('chatList', async(sender)=>{
        const user = await User.findOne({phone : sender})
     user.chats.forEach(async(chat)=>{
        const con = await User.findOne({_id : chat._id})
         io.to(user.socketId).emit("chatList" ,{chat : con})
         console.log(chat)
     })
        // console.log(user.chats)
    })



    
    socket.on('chat', async (data) => {
        const { phone, token, msg } = data
        const senderId = await verifyToken(token)
        const sender = await User.findById(senderId?._id).select("-refreshtoken")
        console.log(phone)
        console.log(sender)
        const receiver = await User.findOne({ phone: phone }).select("-refreshtoken")
        console.log(receiver)

        if (!sender || !receiver) {
            throw new ApiError(401, "sender or receiver not found")

        }
        const chat = await Chat.create({ sender: sender._id, receiver: receiver._id, content: msg })



        let sName = null
        receiver.contacts.forEach(async (contact) => {
            if (contact.userInfo === sender._id) {
                sName = contact.name
            }
        })


        let rName = null
        sender.contacts.forEach(async (contact) => {
            if (contact.userInfo === receiver._id) {
                rName = contact.name
            }
        })

        const chatU1 = { name: sName || sender.phone, userInfo: receiver._id };
        const chatU2 = { name: rName || receiver.phone, userInfo: sender._id };

        console.log(chatU1, chatU2)

        const user = await User.findOne({

            $and: [
                { phone: receiver.phone }, {
                    $or: [
                        { "chats.name": sender.phone },
                        { "chats.name": sName }
                    ]
                }
            ]
        });
        if (!user) {
            const updatedUser = await User.findOneAndUpdate(
                { phone: receiver.phone },
                { $addToSet: { chats: chatU1 } },
                { new: true }
            );

            // this is to be updated
            io.to(receiver?.socketId).emit("chatList", { chat: chatU2 })

            console.log("Chat added:", updatedUser);
        } else {
            console.log("Chat already exists");
        }
        user.chats.forEach(async (chat) => {
            const u = await User.findById(chat.userInfo).select("-refreshtoken -socketId -chats -contacts")
            const lastChat = await Chat.findOne({
                $or: [
                    { sender: u._id },
                    { receiver: u._id }
                ]
            }).sort({ createdAt: -1 })
            // console.log(lastChat)
            const chatInfo = {
                name: chat.name,
                user_id: chat.userInfo._id,
                profileImg: u.profileImg,
                phone: u.phone,
                bio: u.bio,
                isOnline: u.isOnline,
                lastSeen: u.updatedAt,
                lastChat: {
                    isSended: lastChat.sender === user._id,
                    content: lastChat.content,
                    time: lastChat.createdAt
                }

            }
            io.to(user.socketId).emit("chatList", { chat: chatInfo })
            // console.log(chat)
        })
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
            io.to(sender?.socketId).emit("chatList", { chat: chatU1 })

            console.log("Chat added:", updatedUser);
        } else {
            console.log("Chat already exists");
        }

        console.log(chat)


        io.to(receiver?.socketId).emit('chat', { msg: chat })
        io.to(sender?.socketId).emit('chat', { msg: chat })


    })

    socket.on('chatList', async (token) => {
        const user_id = await verifyToken(token)
        const user = await User.findById(user_id?._id)

        user.chats.forEach(async (chat) => {
            const u = await User.findById(chat.userInfo).select("-refreshtoken -socketId -chats -contacts")
            const lastChat = await Chat.findOne({
                $or: [
                    {
                        $and: [
                            {
                                sender: u._id
                            },
                            {
                                receiver : user._id
                            }
                        ]
                    },
                    {
                        $and: [
                            {
                                receiver: u._id
                            },
                            {
                                sender : user._id
                            }
                        ]
                    },
                ]
            }).sort({ createdAt: -1 })

            const chatInfo = {
                name: chat.name,
                user_id: chat.userInfo._id,
                profileImg: u.profileImg,
                phone: u.phone,
                bio: u.bio,
                isOnline: u.isOnline,
                lastSeen: u.updatedAt,
                lastChat: {
                    isSended: lastChat.sender === user._id,
                    content: lastChat.content,
                    time: lastChat.createdAt
                }

            }

            console.log(chatInfo)
            io.to(user.socketId).emit("chatList", { chat: chatInfo })
            // console.log(chat)
        })
        // console.log(user.chats)
    })
    
    socket.on('chat0', async (phone, msg, token) => {

        const senderId = await verifyToken(token)

        console.log(phone, "phone")
        console.log(msg, "msg")
        console.log(token, "token")

        const sender = await User.findById(senderId?._id)
        const receiver = await User.findOne({ phone: phone })

        console.log(sender)
        console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
        console.log(receiver)

        if (!sender || !receiver) {
            console.log("user not exists")
        }

        const chatU1 = { name: sender.phone, userInfo: receiver._id };
        const chatU2 = { name: receiver.phone, userInfo: sender._id };
        chatU1._id = ""
        chatU2._id = ""
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
            io.to(receiver.socketId).emit("chatList", { chat: chatU2 })

            console.log("Chat added:", updatedUser);
        } else {
            console.log("Chat already exists");
        }


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
            io.to(sender.socketId).emit("chatList", { chat: chatU1 })

            console.log("Chat added:", updatedUser);
        } else {
            console.log("Chat already exists");
        }

        const chat = await Chat.create({ sender: sender._id, receiver: receiver._id, content: msg })



        io.to(receiver.socketId).emit('chat', { msg: chat })
        io.to(sender.socketId).emit('chat', { msg: chat })


    })


    socket.on('previousChat', async (data) => {
        console.log("------------------------------")
        // const {token, receiverId} = data
        // console.log(data.token, "token")
        // console.log(data.receiverId)
        const userId = await verifyToken(data.token)
        const user = await User.findById(userId?._id)
        // console.log(user)
        console.log("jjjjjjjjjjjjjjjjjjjjjjjjjjj")
        console.log(user.socketId)
        // console.log(receiver)
        return
        const s = await User.findOne({ phone: sender })
        const r = await User.findOne({ phone: receiver })
        const chats = await Chat.find({
            $or: [
                { sender: s, receiver: r },
                { sender: r, receiver: s }
            ]
        }).sort({ createdAt: 1 });

        console.log(chats)
        chats.forEach((chat) => {

            io.to(socket.id).emit('chat', { msg: chat })
        })

    })
}

export default ws