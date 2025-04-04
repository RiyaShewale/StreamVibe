import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
// Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });
    
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) {
            console.error("Error: No file path provided.");
            return null
        }

        const response = await cloudinary.uploader.upload(localFilePath, {resource_type : "auto"})
        
        console.log(" file uploaded successfully on cloudinary! ", response);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally stored temporary file as the upload operation failed
        console.log(" couldent upload the file to cloudinary ")
        return null;
    }
}

export {uploadOnCloudinary}
