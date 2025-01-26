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

    // const uploadOnCloudinaryHotel = async (localFilePath) => {
    //   if (!localFilePath) {
    //     console.error("No local file path provided.");
    //     return null; // If no file path is provided, return null
    //   }
    
    //   try {
    //     let response;
    //     try {
    //       // Upload the image to Cloudinary (non-blocking, with timeout)
    //       response = await cloudinary.uploader.upload(localFilePath, {
    //         folder: "Trio",
    //         resource_type: "auto", // auto-detect file type (image, video, etc.)
    //       });
    //     } catch (uploadError) {
    //       // If there's an error during Cloudinary upload, log the error
    //       console.error("Error during Cloudinary upload:", uploadError);
    //       return null; // Return null if the upload fails
    //     }
    
    //     // Remove the local file asynchronously after upload to speed up the process
    //     fs.unlink(localFilePath, (unlinkError) => {
    //       if (unlinkError) {
    //         console.error("Error deleting local file:", unlinkError.message);
    //       } else {
    //         console.log("Local file deleted successfully.");
    //       }
    //     });
    
    //     console.log("Cloudinary upload response:", response);
    //     return response; // Return the Cloudinary response if successful
    
    //   } catch (error) {
    //     // If any error occurs in the outer try block, handle it
    //     console.error("Unexpected error in uploading file to Cloudinary:", error.message);
    //     // Attempt to delete the file asynchronously, even if upload failed
    //     fs.unlink(localFilePath, (unlinkError) => {
    //       if (unlinkError) {
    //         console.error("Error deleting local file:", unlinkError.message);
    //       } else {
    //         console.log("Local file deleted successfully.");
    //       }
    //     });
    //     return null; // Return null if any error occurs
    //   }
    // };

    const uploadOnCloudinaryHotel = async (localFilePath) => {
      if (!localFilePath) {
        console.error("No local file path provided.");
        return null; // If no file path is provided, return null
      }
    
      // Check if the file exists before proceeding
      if (!fs.existsSync(localFilePath)) {
        console.error("File not found:", localFilePath);
        return null;
      }
    
      try {
        let response;
    
        // Attempt to upload the file to Cloudinary
        try {
          response = await cloudinary.uploader.upload(localFilePath, {
            folder: "Trio",
            resource_type: "auto", // auto-detect file type (image, video, etc.)
          });
        } catch (uploadError) {
          console.error("Error during Cloudinary upload:", uploadError);
          return null;
        }
    
        // Asynchronously delete the local file after upload
        fs.unlink(localFilePath, (unlinkError) => {
          if (unlinkError) {
            console.error("Error deleting local file:", unlinkError.message);
          } else {
            console.log("Local file deleted successfully.");
          }
        });
    
        console.log("Cloudinary upload response:", response);
        return response;
      } catch (error) {
        console.error("Unexpected error in uploading file to Cloudinary:", error.message);
    
        // Attempt to delete the file asynchronously even if upload failed
        fs.unlink(localFilePath, (unlinkError) => {
          if (unlinkError) {
            console.error("Error deleting local file:", unlinkError.message);
          } else {
            console.log("Local file deleted successfully.");
          }
        });
    
        return null;
      }
    };
    
    

export { uploadOnCloudinary, uploadOnCloudinaryHotel }