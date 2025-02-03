import multer from "multer";

const storage = multer.diskStorage({
    destination : (req,file,cb)=>{
        cb(null, "./public/temp")// make sure to have the folders
    },filename : (req,file, cb)=>{
        cb(null, file.originalname)
    }
})

export const upload = multer({storage : storage})