import { Rider } from "../models/Rider.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { RiderAcceptReject } from "../models/RiderAcceptReject.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (riderId) => {
   try {
      const rider = await Rider.findById(riderId)
      const accessToken = rider.generateAccessToken();
      const refreshToken = rider.generateRefreshToken();

      rider.refreshToken = refreshToken;
      await rider.save({ validateBeforeSave: false })

      return { accessToken, refreshToken }

   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating Refresh and Access Token");
   }
}

const registerRider = asyncHandler(async (req, res) => {

   const { riderName, email, password, address, mobileNo, alternateMobileNo, profileImg, drivingLiscenceImg,
       vehicleName, vehicleNo, aadharImg, city } = req.body;

   let altMob;
   if(alternateMobileNo?.length) {
       altMob = {
         alternateMobileNo
      }
   }

   if (
      [riderName, email, password, address, mobileNo, vehicleName, vehicleNo].some((field) =>
         field?.trim === "")
   ) {
      res.status(400).json(new ApiResponse(400, "All fields are required"))
      throw new ApiError(400, "All fields are required")
   }

   const existedRider = await Rider.findOne({
      $or: [{ mobileNo }, { email }]
   })

   if (existedRider) {
      res.status(400).json(new ApiResponse(400, "Rider already exists, Please Login!"))
      throw new ApiError(409, "Rider already exists, Please Login!")
   }

   const profilePhotoLocalPath = profileImg;
   const liscenceLocalPath = drivingLiscenceImg;
   //const aadharLocalPath = aadharImg;
   // const profilePhotoLocalPath = req.files?.profilePhoto[0]?.path;
   // const liscenceLocalPath = req.files?.drivingLiscence[0]?.path;
  // const aadharLocalPath = req.files?.aadharCard[0]?.path;

   if (!(profilePhotoLocalPath && liscenceLocalPath)) {
      res.status(400).json(new ApiResponse(400, "profilePhoto File and Driving Liscence is required"))
      throw new ApiError(400, "profilePhoto File and Driving Liscence is required")
   }

   const profilePhoto = await uploadOnCloudinary(profilePhotoLocalPath);
   const drivingLiscence = await uploadOnCloudinary(liscenceLocalPath);
  // const aadharCard = await uploadOnCloudinary(aadharLocalPath);
  console.log("Rani", drivingLiscence.url);
   if (!profilePhoto) {
      res.status(400).json(new ApiResponse(400, "Error in uploading profilePhoto file"))
      throw new ApiError(400, "Error in uploading profilePhoto file")
   }
   if (!drivingLiscence) {
      res.status(400).json(new ApiResponse(400, "Error in uploading driving Liscence file"))
      throw new ApiError(400, "Error in uploading drivingLiscence file")
   }
  /*** if (!aadharCard) {
      res.status(400).json(new ApiResponse(400, "Error in uploading aadhar Card file"))
      throw new ApiError(400, "Error in uploading aadharCard file")
   }   ***/

   const rider = await Rider.create({
      riderName,
      email,
      password,
      address,
      profilePhoto: profilePhoto.url,
      drivingLiscense: drivingLiscence.url,
      alternateMobileNo: altMob?.alternateMobileNo || "",
      mobileNo,
      vehicleName,
      vehicleNo,
      city
   })

   if (!rider) {
      res.status(400).json(new ApiResponse(400, "Something went wrong while registering Rider"))
      throw new ApiError(400, "Something went wrong while registering Rider")
   }
   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(rider._id);

   const createdRider = await Rider.findById(rider._id).select("-password -refreshToken")

   return res
      .status(200)
      .json(
         new ApiResponse(200, { Rider: createdRider, accessToken }, "Rider Registered Successfully")
      )

})

const loginRider = asyncHandler(async (req, res) => {
   //get details like Ridername or email and password from frontend
   //validate them
   //Search for Rider in db
   //check for Rider
   //Match the password
   //Access and refresh token when password is correct
   //send cookie

    //get details like mobileNo from frontend
   //validate them
   //Search for user in db
   //check for user
   //Access and refresh token when user is present
   //send cookie

   const { mobileNo } = req.body

   if (!mobileNo) {
      throw new ApiError(400, "MobileNo is required")
   }

   const rider = await Rider.findOne({mobileNo})

   if (!rider) {
      res.status(400).json(new ApiResponse(400, "rider doesn't exists"))
      throw new ApiError(400, "rider doesn't exists")
   }

   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(rider._id);

   const loggedInRider = await Rider.findById(rider._id).select("-password -refreshToken");

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
               rider: loggedInRider, accessToken, refreshToken
            },
            "Rider Logged In Successfully"
         )
      )
})

const googleAuthLogin = asyncHandler(async (req, res) => {
   console.log(req);
   const { RiderInfo } = req.body;
   console.log(RiderInfo);//Look into the data and register accordingly

   return res.status(200)
      .json(new ApiResponse(200, "Google Authentication Login Successfull"))
})

const facebookAuthLogin = asyncHandler(async (req, res) => {
   const { RiderInfo } = req.body;
   console.log(RiderInfo);//Look into the data and register accordingly

   return res.status(200)
      .json(new ApiResponse(200, token, "Google Authentication Login Successfull"))
})

const logoutRider = asyncHandler(async (req, res) => {
   //take the Rider._id from req.cookie
   //remove accessToken and RefreshToken

   const rider = await Rider.findByIdAndUpdate(req.rider._id,
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
      .json(new ApiResponse(200, {}, "Rider Logged Out Successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

   const incomingRiderId = req.body.rider;
   console.log('riderId', incomingRiderId)
  
   if (!incomingRiderId) {
      throw new ApiError(401, "Unauthorized Request")
   }

   try {
      const options = {
         httpOnly: true,
         secure: true
      }

      const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(incomingRiderId)

      console.log('tokens:', refreshToken, accessToken)

      return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", refreshToken, options)
         .json(
            new ApiResponse(
               200,
               { accessToken, refreshToken },
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

   const rider = await Rider.findById(req.rider._id)

   const isPasswordValid = await rider.isPasswordCorrect(oldPassword)

   if (!isPasswordValid) {
      throw new ApiError(400, "Old Password is Incorrect")
   }

   rider.password = newPassword;
   await rider.save({ validateBeforeSave: false })

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Changed Successfully"))

})

const getCurrentRider = asyncHandler(async (req, res) => {
   //return all info of the Rider in the db
   return res
      .status(200)
      .json(new ApiResponse(200, req.rider, "Rider Details fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
   const { riderName, email, address, mobileNo, vehicleName, vehicleNo } = req.body

   if (!(riderName || email || address || mobileNo || vehicleName || vehicleNo)) {
      throw new ApiError(400, "All fields are required")
   }

   const rider = await Rider.findByIdAndUpdate(
      req.rider?._id,
      {
         $set: {
            riderName: riderName,
            email: email,
            address: address,
            mobileNo: mobileNo,
            vehicleName: vehicleName,
            vehicleNo: vehicleNo
         }
      },
      {
         new: true
      }
   ).select("-password")

   return res
      .status(200)
      .json(new ApiResponse(200, rider, "Account Details Updated Successfully"))
})

const updateRiderProfilePhoto = asyncHandler(async (req, res) => {
   //take avatar file from frontend
   //validate it
   //upload to cloudinary
   //check for upload and update in db then return res

   const avatarLocalPath = req.file?.path;

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar File is Required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);

   if (!avatar.url) {
      throw new ApiError(400, "Error in uploading avatar")
   }

   await Rider.findByIdAndUpdate(req.rider?._id,
      {
         $set: {
            profilePhoto: avatar.url
         }
      },
      {
         new: true
      }).select("-password -refreshToken")

   return res
      .status(200)
      .json(new ApiResponse(200, req.rider, "Avatar updated Successfully"))
})

const signoutRider = asyncHandler(async (req, res) => {
   //get the rider_id from req.rider
   //validate rider_id
   //find and delete the rider_id 
   //return res

   const rider = await Rider.findByIdAndDelete(
      req.rider?._id,
      {
         $unset: {
            _id: 1
         }
      })

      if(!rider){
         throw new ApiError(400, "Error in SigningOut rider")
      }

      return res
      .status(200)
      .json(new ApiResponse(200,{ signedOutRider: rider }, "Rider SignedOut Successfully" ))

})

const updateDrivingLiscence = asyncHandler(async (req, res) => {
   //take image file from frontend
   //validate it
   //upload to cloudinary
   //check for upload and update in db then return res

   const {liscenceImg} = req.body;

   

   //const drivingLiscenceLocalPath = liscenceImg;
   const drivingLiscenceLocalPath = req.file?.path;

   if (!drivingLiscenceLocalPath) {
      throw new ApiError(400, "drivingLiscence File is Required")
   }

   const drivingLiscence = await uploadOnCloudinary(drivingLiscenceLocalPath);

   if (!drivingLiscence.url) {
      throw new ApiError(400, "Error in uploading drivingLiscence")
   }

   await Rider.findByIdAndUpdate(req.rider?._id,
      {
         $set: {
            profilePhoto: drivingLiscence.url
         }
      },
      {
         new: true
      }).select("-password -refreshToken")

   return res
      .status(200)
      .json(new ApiResponse(200, req.rider, "Driving Liscence updated Successfully"))

})

const updateMoneyEarned = asyncHandler(async (req, res) => {
   //get the rider_id from req.rider
   //using mongoose aggregate match and calculate the amount with the distance travelled
   //update it in the rider's db
   //return res

})

const addToCyrRideHistory = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res

   const {orderId} = req.params

   if(!orderId){
     throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await Rider.findByIdAndUpdate(
     req.rider._id,
     {
        $push: {
           cyrRideHistory: new mongoose.Types.ObjectId(orderId)
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

const removeFromCyrRideHistory = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //pull from the array and check it
   //return res

   const {orderId} = req.params

   if(!orderId){
     throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await Rider.findByIdAndUpdate(
     req.rider._id,
     {
        $pull: {
           cyrRideHistory: new mongoose.Types.ObjectId(orderId)
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

const getCyrRideHistory = asyncHandler(async (req, res) => {
   //get the rider_id from req.rider
   //using mongoose aggregate filter the id from cyrOrderHistory and cyrOrders
   //check for the above data
   //return res

     
   const rideHistory = await Rider.aggregate([
      [
         {
           $match: {
             _id: new mongoose.Types.ObjectId(req.rider._id),
           },
         },
         {
           $lookup: {
             from: "cyrorders",
             localField: "cyrRideHistory",
             foreignField: "_id",
             as: "cyrRideHistory",
             pipeline: [
                {
            $lookup: {
             from: "users",
             localField: "bookedBy",
             foreignField: "_id",
             as: "user"
           }
         }
             ]
           }
         }
       ]
   ])
   console.log(rideHistory);
      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          rideHistory[0].cyrRideHistory,
          "Ride History fetched Succesfully"
          )
      )

})

const addToFoodyRideHistory = asyncHandler(async (req, res) => {

   const {orderId} = req.params

   if(!orderId){
     throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await Rider.findByIdAndUpdate(
     req.rider._id,
     {
        $push: {
           foodyRideHistory: new mongoose.Types.ObjectId(orderId)
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

const removeFromFoodyRideHistory = asyncHandler(async (req, res) => {

   const {orderId} = req.params

   if(!orderId){
     throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await Rider.findByIdAndUpdate(
     req.rider._id,
     {
        $pull: {
           foodyRideHistory: new mongoose.Types.ObjectId(orderId)
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

const getFoodyRideHistory = asyncHandler(async (req, res) => {
   const rideHistory = await Rider.aggregate(
      [
         {
           $match: {
             _id: new mongoose.Types.ObjectId(req.rider._id),
           },
         },
         {
           $lookup: {
             from: "foodyorders",
             localField: "foodyRideHistory",
             foreignField: "_id",
             as: "foodyRideHistory",
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
             from: "restaurants",
             localField: "restaurant",
             foreignField: "_id",
             as: "restaurant"
           }
         }
             ]
           }
         }
       ]
   )
   console.log(rideHistory);
      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          rideHistory[0].foodyRideHistory,
          "Ride History fetched Succesfully"
          )
      )
})

const addToCyrMedicoRideHistory = asyncHandler(async (req, res) => {

   const {orderId} = req.params

   if(!orderId){
     throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await Rider.findByIdAndUpdate(
     req.rider._id,
     {
        $push: {
           cyrMedicoRideHistory: new mongoose.Types.ObjectId(orderId)
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

const removeFromCyrMedicoRideHistory = asyncHandler(async (req, res) => {

   const {orderId} = req.params

   if(!orderId){
     throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await Rider.findByIdAndUpdate(
     req.rider._id,
     {
        $pull: {
           cyrMedicoRideHistory: new mongoose.Types.ObjectId(orderId)
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

const getCyrMedicoRideHistory = asyncHandler(async (req, res) => {
   const rideHistory = await Rider.aggregate([
      [
         {
           $match: {
             _id: new mongoose.Types.ObjectId(req.rider._id),
           },
         },
         {
           $lookup: {
             from: "cyrmedicoorders",
             localField: "cyrMedicoRideHistory",
             foreignField: "_id",
             as: "cyrMedicoRideHistory",
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
             from: "medicals",
             localField: "medical",
             foreignField: "_id",
             as: "medical"
           }
         }
             ]
           }
         }
       ]
   ])
   console.log(rideHistory);
      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          rideHistory[0].CyrMedicoRideHistory,
          "Ride History fetched Succesfully"
          )
      )
})

const updateCyrRatings = asyncHandler(async (req, res) => {
    //get the rider_id from req.rider
    //using mongoose aggregate match and calculate the average ratings from all the cyrRatings where rider is common
    //check for above data and update it in the db
    //return res

    const allRating = await Rider.aggregate(
      [
         {
           $match: {
             _id: new mongoose.Types.ObjectId(req.rider._id),
           },
         },
         {
           $lookup: {
             from: "cyrratings",
             localField: "_id",
             foreignField: "rider",
             as: "cyrRatings"
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

   const allRating = await Rider.aggregate([
      [
         {
           $match: {
             _id: new mongoose.Types.ObjectId(req.rider._id),
           },
         },
         {
           $lookup: {
             from: "cyrratings",
             localField: "_id",
             foreignField: "rider",
             as: "cyrRatings",
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

const toggleAvailableStatus = asyncHandler(async (req, res) => {
    //whenever called update
    //with the help of req.ride_id update the availableStatus

    const rider = await Rider.findByIdAndUpdate(
      req.rider._id,
      {
         $set: {
            availableStatus: !req.rider?.availableStatus
         }
      },
      { new: true })

      if(!rider){
         throw new ApiError(400, "Error in toggling Available Status of Rider")
      }

      return res
      .status(200)
      .json(new ApiResponse(200, rider, "Successfully toggled Available Status of Rider"))
 })

const updateLatLong = asyncHandler(async (req, res) => {
  //thinking to do it in sockets
})

const setDeviceToken = asyncHandler( async(req, res) => {
   const {token} = req.body;

   const deviceToken = await Rider.findByIdAndUpdate(req.rider._id,
  {
     $set: {
        deviceToken: token
     }
  },{new: true})

  console.log(deviceToken);
  if(!deviceToken){
     throw new ApiError(400, "Error in setting the device Token")
  }

  return res
  .status(200)
  .json(new ApiResponse(200, deviceToken, "Successfully stored device Token"))

})

const fetchAcceptReject = asyncHandler( async(req, res) => {

   const rider = await RiderAcceptReject.aggregate([
      {
         $match: {
            riderId: req.rider._id,
            status: false
         }
      }
   ])

   console.log(rider[0]);

   if(!rider){
     throw new ApiError(400, "Error in fetching Accept/Reject");
   }

   return res.
   status(200)
   .json(new ApiResponse(200, rider, "Successfull in fetching Accept/Reject"))
})

const updateRiderLocation = asyncHandler( async(req, res) => {
   try {
      console.log('entryyyyyyy')
      const { latitude, longitude } = req.body;
      console.log(latitude, longitude);
      
      if(!(latitude && longitude)){
         return res.status(404).send('LatLong Required')
      }
      const rider = await Rider.findByIdAndUpdate(req.rider._id,
         {
            $set: {
               latitude, longitude
            }
         },{new: true}
      )
      if (!rider) {
         console.error('Rider not found:', req.rider._id);
         return res.status(404).send('Rider not found');
       }
   
       console.log('Location updated successfully:', {
         riderId: req.rider._id,
         latitude,
         longitude,
       });

      res.status(200).send('Location updated');
    } catch (error) {
      res.status(500).send('Error updating location');
    }
})

const earning = asyncHandler( async(req, res) => {
   const { distanceInKm } = req.body;

   // Calculate earning based on the current rate
   const earning = distanceInKm * 12.5;
 
   res.json({ earning });
})

export {
   registerRider,
   loginRider,
   googleAuthLogin,
   facebookAuthLogin,
   logoutRider,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentRider,
   updateAccountDetails,
   updateRiderProfilePhoto,
   signoutRider,
   updateDrivingLiscence,
   updateCyrRatings,
   updateMoneyEarned,
   addToCyrRideHistory,
   removeFromCyrRideHistory,
   getCyrRideHistory,
   addToFoodyRideHistory,
   removeFromFoodyRideHistory,
   getFoodyRideHistory,
   addToCyrMedicoRideHistory,
   removeFromCyrMedicoRideHistory,
   getCyrMedicoRideHistory,
   toggleAvailableStatus,
   setDeviceToken,
   fetchAcceptReject,
   updateRiderLocation,
   earning
}