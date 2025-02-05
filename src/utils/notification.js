import admin from "firebase-admin"
import { readFile } from "fs/promises"


const serviceAccount = JSON.parse(
    await readFile(new URL('./service_account.json',import.meta.url)))


const ad = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const sendNotification = async (title, body, img, token) => {
    const message = { 
        token: token,
        notification: {
            title: title,
            body: body,
            image: img
        }
    }


    console.log(message)
    try {

        const res = await ad.messaging().send(message)
        console.log(res)
    } catch (error) {
        console.log(error)
    }
 


}
 
export default sendNotification