import User from "./models/user.models.js"
import express from 'express'
import http from 'http'
import { url } from 'inspector';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import Chat from "./models/chat.model.js";
import ws from "./ws.js";
import router from "./routes/user.routes.js";
const app = express();

const server = http.createServer(app);
// const user = new Map()
const io = new Server(server)
io.on('connection', async (socket) => {
    console.log('user connected', socket.id)
    ws(io, socket)
    socket.on("disconnect", async () => {

        const userData = await User.findOneAndUpdate({ socketId: socket.id }, {
            // socketId : null,
            isOnline: false
        })

        // console.log(userData)
        if (!userData) return
        console.log(socket.id)
        const details = {
            name: userData.phone,
            user_id: userData._id,
            profileImg: userData.profileImg,
            phone: userData.phone,
            bio: userData.bio,
            isOnline: false,
            lastSeen: userData.updatedAt,
        }
        io.emit("getUserInfo", details)
        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
        console.log("disconnect", socket.id)
        // console.log(user.socketId)
        // console.log(userData)
        console.log(details)


    })
})


app.use(express.static('./public'));
app.use(express.json())

app.use("/user", router)
app.get('/', (req, res) => {
    res.sendFile('./public/index.html')
})

app.post('/register', async (req, res) => {
    const { phone } = req.body
    const user = await User.create({ phone: phone })
    console.log(phone)
    return res.send({ user })
})


export default server 