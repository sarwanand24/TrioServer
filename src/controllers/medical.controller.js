import { Medical } from "../models/Medical.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (medicalId) => {
   try {
      const medical = await Medical.findById(medicalId)
      const accessToken = medical.generateAccessToken();
      const refreshToken = medical.generateRefreshToken();

      medical.refreshToken = refreshToken;
      await medical.save({ validateBeforeSave: false })

      return { accessToken, refreshToken }

   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating Refresh and Access Token");
   }
}

const registerMedical = asyncHandler(async (req, res) => {
   //Take all fields from req.body
   //validate the fields
   //check if Rider already exists - Ridername, email
   //check for avatar path
   //upload to cloudinary
   //check for upload
   //create entry in db
   //check for db
   // remove password and refresh token field
   //return res

   const { medicalName, ownerName, email, password, address, mobileNo, alternateMobileNo, 
      medicalPhotoImg, openingTime, closingTime } = req.body;

      let altMob;
      if(alternateMobileNo?.length) {
          altMob = {
            alternateMobileNo
         }
      }

   if (
      [medicalName, ownerName, email, password, address, mobileNo, fssaiNo, fssaiExpiryDate, openingTime, closingTime].some((field) =>
         field?.trim === "")
   ) {
      res.status(400).json(new ApiResponse(400, "All fields are required"))
      throw new ApiError(400, "All fields are required")
   }

   const existedMedical = await Medical.findOne({
      $or: [{ mobileNo }, { email }]
   })

   if (existedMedical) {
      res.status(400).json(new ApiResponse(400, "Medical already exists, Please Login!"))
      throw new ApiError(409, "Medical already exists, Please Login!")
   }

   //const medicalLocalPath = medicalPhotoImg;
   const medicalLocalPath = req.file?.path;

   const medicalPhoto = await uploadOnCloudinary(medicalLocalPath);

   if (!medicalPhoto) {
      res.status(400).json(new ApiResponse(400, "Error in uploading medical file"))
      throw new ApiError(400, "Error in uploading medical file")
   }

   const medical = await Medical.create({
      medicalName,
      ownerName,
      email,
      password,
      address,
      medicalPhoto: medicalPhoto.url,
      mobileNo,
      alternateMobileNo: altMob?.alternateMobileNo || "",
      openingTime,
      closingTime
   })

   if (!medical) {
      res.status(400).json(new ApiResponse(400, "Something went wrong while registering medical"))
      throw new ApiError(400, "Something went wrong while registering medical")
   }
   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(medical._id);

   const createdMedical = await medical.findById(medical._id).select("-password -refreshToken")

   return res
      .status(200)
      .json(
         new ApiResponse(200, { medical: createdMedical, accessToken }, "Medical Registered Successfully")
      )

})

const loginMedical = asyncHandler(async (req, res) => {
   //get details like medicalname or email and password from frontend
   //validate them
   //Search for medical in db
   //check for medical
   //Match the password
   //Access and refresh token when password is correct
   //send cookie

   const { mobileNo } = req.body

   if (!mobileNo) {
      throw new ApiError(400, "MobileNO is required")
   }

   const medical = await Medical.findOne({mobileNo})

   if (!medical) {
      res.status(400).json(new ApiResponse(400, "Medical doesn't exists"))
      throw new ApiError(400, "Medical doesn't exists")
   }

   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(medical._id);

   const loggedInMedical = await Medical.findById(medical._id).select("-password -refreshToken");

   const options = {
      httpOnly: true,
      secure: true
   }

   return res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               medical: loggedInMedical, accessToken, refreshToken
            },
            "Medical Logged In Successfully"
         )
      )

})

const googleAuthLogin = asyncHandler(async (req, res) => {
   console.log(req);
   const { medicalInfo } = req.body;
   console.log(medicalInfo);//Look into the data and register accordingly

   return res.status(200)
      .json(new ApiResponse(200, "Google Authentication Login Successfull"))
})

const facebookAuthLogin = asyncHandler(async (req, res) => {
   const { medicalInfo } = req.body;
   console.log(medicalInfo);//Look into the data and register accordingly

   return res.status(200)
      .json(new ApiResponse(200, token, "Google Authentication Login Successfull"))
})

const logoutMedical = asyncHandler(async (req, res) => {
   //take the medical._id from req.cookie
   //remove accessToken and RefreshToken

   const medical = await Medical.findByIdAndUpdate(req.medical._id,
      {
         $unset: {
            refreshToken: 1
         }
      },
      {
         new: true
      })

   const options = {
      httpOnly: true,
      secure: true
   }

   return res.status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "Medical Logged Out Successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized Request")
   }

   try {
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.RefreshTokenSecret);

      const medical = await Medical.findById(decodedToken?._id)

      if (!medical) {
         throw new ApiError(401, "Invalid Refresh Token")
      }

      if (incomingRefreshToken !== medical?.refreshToken) {
         throw new ApiError(401, "Refresh Token is Used")
      }

      const options = {
         httpOnly: true,
         secure: true
      }

      const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(medical._id)

      return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", newRefreshToken, options)
         .json(
            new ApiResponse(
               200,
               { accessToken, refreshToken: newRefreshToken },
               "AccessToken Refreshed"
            )
         )
   } catch (error) {
      throw new ApiError(401, error.message || "Invalid Refresh Token")
   }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
   //take any fields from frontend
   //search for Rider and update the db

   const { oldPassword, newPassword } = req.body

   if (!(oldPassword || newPassword)) {
      throw new ApiError(400, "Password is required")
   }

   const medical = await Medical.findById(req.medical._id)

   const isPasswordValid = await Medical.isPasswordCorrect(oldPassword)

   if (!isPasswordValid) {
      throw new ApiError(400, "Old Password is Incorrect")
   }

   medical.password = newPassword;
   await medical.save({ validateBeforeSave: false })

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Changed Successfully"))

})

const getCurrentMedical = asyncHandler(async (req, res) => {
   //return all info of the medical in the db
   return res
      .status(200)
      .json(new ApiResponse(200, req.medical, "Medical Details fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
   const { medicalName, email, mobileNo, address, openingTime, closingTime } = req.body

   if (!(medicalName || email || mobileNo || address || openingTime || closingTime)) {
      throw new ApiError(400, "All fields are required")
   }

   const medical = await Medical.findByIdAndUpdate(
      req.medical?._id,
      {
         $set: {
            medicalName: medicalName,
            email: email,
            mobileNo: mobileNo,
            address: address,
            openingTime: openingTime,
            closingTime: closingTime
         }
      },
      {
         new: true
      }
   ).select("-password")

   return res
      .status(200)
      .json(new ApiResponse(200, medical, "Acount Details Updated Successfully"))
})

const signoutMedical = asyncHandler(async (req, res) => {
   //get the rider_id from req.rider
   //validate rider_id
   //find and delete the rider_id 
   //return res

   const medical = await Medical.findByIdAndDelete(
      req.medical?._id,
      {
         $unset: {
            _id: 1
         }
      })

      if(!medical){
         throw new ApiError(400, "Error in SigningOut medical")
      }

      return res
      .status(200)
      .json(new ApiResponse(200,{ signedOutmedical: medical }, "Medical SignedOut Successfully" ))

})

const addToOrderHistory = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res

   const {orderId} = req.params

   if(!orderId){
     throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await Medical.findByIdAndUpdate(
     req.medical._id,
     {
        $push: {
           OrderHistory: new mongoose.Types.ObjectId(orderId)
        }
     },
     {
        new: true
     })

   if(!order){
     throw new ApiError(400, "Error in adding order history")
   }

   return res
   .status(200)
   .json(new ApiResponse(200, order, "Successfully added to order history"))

})

const removeOrderHistory = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //pull to the array and check it
   //return res

   const {orderId} = req.params

   if(!orderId){
     throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await Medical.findByIdAndUpdate(
     req.medical._id,
     {
        $pull: {
           OrderHistory: new mongoose.Types.ObjectId(orderId)
        }
     },
     {
        new: true
     })

   if(!order){
     throw new ApiError(400, "Error in adding order history")
   }

   return res
   .status(200)
   .json(new ApiResponse(200, order, "Successfully added to order history"))

})

const getOrderHistory = asyncHandler(async (req, res) => {
   //get the medical_id from req.medical
   //using mongoose aggregate filter the id from foodyOrderHistory and foodyOrders
   //check for the above data
   //return res

   
   const orderHistory = await Medical.aggregate([
      [
         {
           $match: {
             _id: new mongoose.Types.ObjectId(req.medical._id),
           },
         },
         {
           $lookup: {
             from: "cyrmedicoorders",
             localField: "OrderHistory",
             foreignField: "_id",
             as: "OrderHistory",
             pipeline: [
                {
            $lookup: {
             from: "users",
             localField: "orderedBy",
             foreignField: "_id",
             as: "user"
           }
         },
                {
            $lookup: {
             from: "riders",
             localField: "rider",
             foreignField: "_id",
             as: "rider"
           }
         }
             ]
           }
         }
       ]
   ])
   console.log(orderHistory);
      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          orderHistory[0].OrderHistory,
          "Order History fetched Succesfully"
          )
      )

})

const updateMoneyEarned = asyncHandler(async (req, res) => {
   //get the medical_id from req.medical
   //using mongoose aggregate match and calculate the amount with the distance travelled
   //update it in the medical's db
   //return res

})

const updateMedicalRatings = asyncHandler(async (req, res) => {
   //get the medical_id from req.medical
   //using mongoose aggregate match and calculate the average ratings from all the foodyRatings where medical is common
   //check for above data and update it in the db
   //return res

   const allRating = await Medical.aggregate(
    [
       {
         $match: {
           _id: new mongoose.Types.ObjectId(req.medical._id),
         },
       },
       {
         $lookup: {
           from: "cyrmedicoratings",
           localField: "_id",
           foreignField: "medical",
           as: "cyrmedicoRatings"
         }
       }
     ]
 )
 console.log(allRating);
 //get the ratings from the array and sum it up and update in restro db

})

const getAllRatings = asyncHandler(async (req, res) => {
   //get the rider_id from req.rider
   //using mongoose aggregate match and get all ratings where rider is common
   //check for above data and update it in the db
   //return res

   const allRating = await Medical.aggregate([
      [
         {
           $match: {
             _id: new mongoose.Types.ObjectId(req.medical._id),
           },
         },
         {
           $lookup: {
             from: "cyrmedicoratings",
             localField: "_id",
             foreignField: "medical",
             as: "cyrmedicoRatings",
             pipeline: [
                {
            $lookup: {
             from: "users",
             localField: "ratedBy",
             foreignField: "_id",
             as: "user"
           }
         }
             ]
           }
         }
       ]
   ])
   console.log(allRating);
      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          allRating[0].allRatings,
          "Rating History fetched Succesfully"
          )
      )

      //will make it more in depth

})

const getMedicalById = asyncHandler(async (req, res) => {
   //get the medicalId from params
   //check for the id in the db
   //return res
})

const getAllMedicals = asyncHandler(async (req, res) => {
   //check for all the medicals open via mongoose aggregate
   //return res
})

const updateLatLong = asyncHandler(async (req, res) => {
  //thinking to do it in sockets
})

export {
   registerMedical,
   loginMedical,
   googleAuthLogin,
   facebookAuthLogin,
   logoutMedical,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentMedical,
   updateAccountDetails,
   signoutMedical,
   addToOrderHistory,
   removeOrderHistory,
   getAllRatings,
   getAllMedicals,
   getMedicalById,
   updateMoneyEarned,
   updateMedicalRatings,
   getOrderHistory
}