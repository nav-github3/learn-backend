import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';




    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDDINARY_CLOUD_NAME,
		api_key: process.env.CLOUDDINARY_API_KEY,	
		api_secret: process.env.CLOUDDINARY_API_SECRET 
    });
    
    // Upload image
    const uploadImage = async (path) => {
        try {
            const res = await cloudinary.uploader.upload(path);
            console.log("file has been uploaded on clodinary", res.url)
            return res.secure_url;
        } catch (error) {
            console.log(error);
        }
    };


    export { uploadImage };