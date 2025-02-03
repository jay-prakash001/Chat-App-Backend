import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    sender : {
       type : mongoose.Schema.Types.ObjectId,
        ref : 'user',
        required : true
    },
    receiver : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user',
        required : true
    },
    content : {
        type : String, 
        required : true
    }
},{timestamps : true})

const Chat = mongoose.model("chat", chatSchema)

export default Chat