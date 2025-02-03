import mongoose from "mongoose"

const connectDb = async()=>{

    try {
        const url = process.env.MONGO_DB_URL
        
        const dbInstance  = await mongoose.connect(url)
        console.log(`db connected succesfully ${dbInstance.connection.host}`)
    } catch (error) {
        console.error(error)
        console.log('mongo db connection failed')
        throw Error(error)
        process.exit(1)
    }
}

export default connectDb