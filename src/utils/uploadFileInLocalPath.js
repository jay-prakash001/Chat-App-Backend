import fs from 'fs'
import path from 'path'
import mime from 'mime-types'

const uploadFileOnLocalPath = async (file, extenssion) => {
    const buffer = Buffer.from(file, "base64")
    const fileName = `./public/temp/${Date.now()}.${extenssion}`
    fs.writeFileSync(fileName, buffer)
    return fileName

}


export default uploadFileOnLocalPath


