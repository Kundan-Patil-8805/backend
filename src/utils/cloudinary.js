import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });


   const uplodOncloudinary = async (localFilePath) =>{
     
   

    try {
        if (!localFilePath) return null;

        //uplode the file 
        const responce = await  cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })
        //file has been uploded on cloudenary 
        console.log("file is uploded on cloudinaryy !!!" , responce.url);
        return responce;

    } catch (error) {
        fs.unlinkSync(localFilePath)// remove local filess  as the uplode opretion 
        return null; 
    }

}
    export {uplodOncloudinary}