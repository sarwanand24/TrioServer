import dotenv from "dotenv";
import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
dotenv.config({
  path: './.env'
})

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.Cloudinary_Api_key, 
  api_secret: process.env.Cloudinary_Api_Secret
})

const uploadOnCloudinary = async (localFilePath) => {
     try{// process.env is only working under some conditions and not outside
    
        if (!localFilePath) return null;
        //upload file on cloudinary
      const response =  await cloudinary.uploader.upload(localFilePath, {
            folder: "Trio",
            resource_type: "auto"
        })
        //file has been uploaded successfully
        //console.log("File Uploaded Successfully On Cloudinary"+response.url);
       // fs.unlinkSync(localFilePath)
      
       try {
        fs.unlinkSync(localFilePath);
        console.log("Local file deleted successfully.");
      } catch (unlinkError) {
        console.error("Error deleting local file:", unlinkError);
      }
      return response;
     }
     catch(error){
      console.log("Error in uploading file to cloudinary", error);
           // fs.unlinkSync(localFilePath) //remove the locally saved file as the upload got failed
           try {
            fs.unlinkSync(localFilePath);
            console.log("Local file deleted successfully.");
          } catch (unlinkError) {
            console.error("Error deleting local file:", unlinkError);
          }
            return null;
     } 
    }

    // Cloudinary upload function

    const uploadOnCloudinaryHotel = async (fileBuffer) => {
      if (!fileBuffer) {
        console.error("No file buffer provided.");
        return null;
      }
    
      try {
        const response = await cloudinary.uploader.upload_stream(
          { folder: "Trio", resource_type: "auto" }, // Specify folder and resource type
          (error, result) => {
            if (error) {
              console.error("Error during Cloudinary upload:", error);
              return null;
            }
            console.log("Cloudinary upload response:", result);
            return result;
          }
        ).end(fileBuffer);
    
        return response;
      } catch (error) {
        console.error("Unexpected error during upload:", error.message);
        return null;
      }
    };
    
    

export { uploadOnCloudinary, uploadOnCloudinaryHotel }