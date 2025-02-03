import dotenv from 'dotenv'
import connectDb from './db/db.connect.js'
import server from './app.js'

dotenv.config({
    path: './.env'
})

const PORT = process.env.PORT || 9000

connectDb().then(() => {
    server.listen(PORT, () => {

        console.log('app is running on ', PORT)
    });
}).catch((error)=>{
    console.log(error)
    console.log('failed connnection')
})