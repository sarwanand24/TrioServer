import { CarouselImage, FestiveOfferImage, FoodCarouselImage, FoodOfferImage, hotelDashboardImage, OfferImage, User } from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Restaurant } from "../models/Restaurant.model.js";
import { Hotel } from "../models/Hotel.model.js";
import { Flat } from "../models/Flat.model.js";
import { Rider } from "../models/Rider.model.js";
import {HotelOrders} from '../models/HotelOrders.model.js';
import axios from 'axios';
import { Fees } from "../models/Fees.model.js";

const generateAccessAndRefreshTokens = async (userId) => {
   try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false })

      return { accessToken, refreshToken }

   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating Refresh and Access Token");
   }
}

const registerUser = asyncHandler(async (req, res) => {
   //Take all fields from req.body
   //validate the fields
   //check if user already exists - username, email
   //check for avatar path
   //upload to cloudinary
   //check for upload
   //create entry in db
   //check for db
   // remove password and refresh token field
   //return res

   const { fullName, username, email, password, address, mobileNo, alternateMobileNo, profileImg } = req.body;

   let altMob;
   if (alternateMobileNo?.length) {
      altMob = {
         alternateMobileNo
      }
   }

   let addressCheck;
   if (address?.length) {
      addressCheck = {
         address
      }
   }

   if (
      [fullName, username, email, password, mobileNo].some((field) =>
         field?.trim === "")
   ) {
      res.status(400).json(new ApiResponse(400, "All fields are required"))
      throw new ApiError(400, "All fields are required")
   }

   const existedUser = await User.findOne({
      $or: [{ username }, { email }]
   })

   if (existedUser) {
      res.status(400).json(new ApiResponse(400, "User already exists, Please Login!"))
      throw new ApiError(409, "User already exists, Please Login!")
   }

   const profilePhotoLocalPath = profileImg; //uncomment it when testing with react native frontend

   //const profilePhotoLocalPath = req.file?.path;

   if (!profilePhotoLocalPath) {
      res.status(400).json(new ApiResponse(400, "ProfilePhoto File is required"))
      throw new ApiError(400, "ProfilePhoto File is required")
   }

   const profilePhoto = await uploadOnCloudinary(profilePhotoLocalPath);

   if (!profilePhoto) {
      res.status(400).json(new ApiResponse(400, "Error in uploading ProfilePhoto file"))
      throw new ApiError(400, "Error in uploading ProfilePhoto file")
   }

   const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email,
      password,
      address: addressCheck?.address || '',
      profilePhoto: profilePhoto.url,
      mobileNo,
      alternateMobileNo: altMob?.alternateMobileNo || ""
   })

   if (!user) {
      res.status(400).json(new ApiResponse(400, "Something went wrong while registering user"))
      throw new ApiError(400, "Something went wrong while registering user")
   }
   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

   const createdUser = await User.findById(user._id).select("-password -refreshToken")

   return res
      .status(200)
      .json(
         new ApiResponse(200, { user: createdUser, accessToken }, "User Registered Successfully")
      )

})

const loginUser = asyncHandler(async (req, res) => {
   //get details like mobileNo from frontend
   //validate them
   //Search for user in db
   //check for user
   //Access and refresh token when user is present
   //send cookie

   const { email, otp } = req.body

   if (!(email && otp)) {
      throw new ApiError(400, "email or otp is required")
   }

   const user = await User.find({ email })

   if (!user) {
      res.status(400).json(new ApiResponse(400, "User doesn't exists"))
      throw new ApiError(400, "User doesn't exists")
   }

   const BREVO_API_KEY = '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';

   try {
      const response = await axios.post(
         'https://api.brevo.com/v3/smtp/email',
         {
           sender: { name: "Nikhil Dhamgay", email: "nikhildhamgay200424@gmail.com" },
           to: [{ email: email }],
           subject: "Welcome to Tiofy",
           textContent: `Your OTP code is: ${otp}`,
         },
         {
           headers: {
             'api-key': BREVO_API_KEY,
             'Content-Type': 'application/json',
           },
         }
       );
       console.log('OTP SENT TO EMAIL SUCCESSFULLY')
   } catch (error) {
      console.log('OTP SENDING ERROR')
   }

   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user[0]._id);

   const loggedInUser = await User.findById(user[0]._id).select("-password -refreshToken");

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
               user: loggedInUser, accessToken, refreshToken
            },
            "User Logged In Successfully"
         )
      )
})

const googleRegisterUser = asyncHandler(async (req, res) => {
   const { fullName, username, email, password, mobileNo, profileImg } = req.body;

   if ([fullName, username, email, password, mobileNo].some((field) => !field?.trim())) {
      res.status(400).json(new ApiResponse(400, "All fields are required"));
      throw new ApiError(400, "All fields are required");
   }

   const existedUser = await User.findOne({
      $or: [{ username }, { email }]
   });

   if (existedUser) {
      res.status(409).json(new ApiResponse(409, "User already exists, Please Login!"));
      throw new ApiError(409, "User already exists, Please Login!");
   }

   // Check if profileImg is defined and a string
   console.log('profilee', profileImg)
   const updatedProfileImg = profileImg ? profileImg.replace('https://', 'http://') : null;

   const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email,
      password,
      profilePhoto: updatedProfileImg,
      mobileNo,
   });

   if (!user) {
      res.status(400).json(new ApiResponse(400, "Something went wrong while registering user"));
      throw new ApiError(400, "Something went wrong while registering user");
   }

   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
   const createdUser = await User.findById(user._id).select("-password -refreshToken");

   return res.status(200).json(new ApiResponse(200, { user: createdUser, refreshToken }, "User Registered Successfully"));
});


const googleAuthLogin = asyncHandler(async (req, res) => {
   console.log(req);
   const { userInfo } = req.body;
   console.log(userInfo);//Look into the data and register accordingly

   return res.status(200)
      .json(new ApiResponse(200, "Google Authentication Login Successfull"))
})

const facebookAuthLogin = asyncHandler(async (req, res) => {
   const { userInfo } = req.body;
   console.log(userInfo);//Look into the data and register accordingly

   return res.status(200)
      .json(new ApiResponse(200, token, "Google Authentication Login Successfull"))
})

const logoutUser = asyncHandler(async (req, res) => {
   //take the user._id from req.cookie
   //remove accessToken and RefreshToken

   const user = await User.findByIdAndUpdate(req.user._id,
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
      .json(new ApiResponse(200, {}, "User Logged Out Successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
   
   const incomingUserId = req.body.user;
   console.log('userId', incomingUserId)
  
   if (!incomingUserId) {
      throw new ApiError(401, "Unauthorized Request")
   }

   try {
      const options = {
         httpOnly: true,
         secure: true
      }

      const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(incomingUserId)

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
   //search for user and update the db

   const { oldPassword, newPassword } = req.body

   if (!(oldPassword || newPassword)) {
      throw new ApiError(400, "Password is required")
   }

   const user = await User.findById(req.user._id)

   const isPasswordValid = await user.isPasswordCorrect(oldPassword)

   if (!isPasswordValid) {
      throw new ApiError(400, "Old Password is Incorrect")
   }

   user.password = newPassword;
   await user.save({ validateBeforeSave: false })

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Changed Successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
   //return all info of the user in the db
   return res
      .status(200)
      .json(new ApiResponse(200, req.user, "User Details fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
   const { fullName, email, address, mobileNo, alternateMobileNo } = req.body

   if (!(fullName || email || address || mobileNo || alternateMobileNo)) {
      throw new ApiError(400, "All fields are required")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullName: fullName,
            email: email,
            address: address,
            mobileNo: mobileNo,
            alternateMobileNo: alternateMobileNo
         }
      },
      {
         new: true
      }
   ).select("-password")

   return res
      .status(200)
      .json(new ApiResponse(200, user, "Acount Details Updated Successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
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

   await User.findByIdAndUpdate(req.user?._id,
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
      .json(new ApiResponse(200, req.user, "Avatar updated Successfully"))
})

const signoutUser = asyncHandler(async (req, res) => {
   //get the user_id from req.user
   //find and delete the user_id 
   //return res

   const user = await User.findByIdAndDelete(
      req.user?._id,
      {
         $unset: {
            _id: 1
         }
      })

   if (!user) {
      throw new ApiError(400, "Error in SigningOut User")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, { signedOutUser: user }, "User SignedOut Successfully"))

})

const addTofoodyOrderHistory = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res

   const { orderId } = req.params

   if (!orderId) {
      throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            foodyOrderHistory: new mongoose.Types.ObjectId(orderId)
         }
      },
      {
         new: true
      })

   if (!order) {
      throw new ApiError(400, "Error in adding order history")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, order, "Successfully added to order history"))
})

const getfoodyOrderHistory = asyncHandler(async (req, res) => {
   //get the user_id from req.user
   //using mongoose aggregate filter the id from foodyOrderHistory and foodyOrders
   //check for the above data
   //return res

   const foodyHistory = await User.aggregate(
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.user._id),
            },
         },
         {
            $lookup: {
               from: "foodyorders",
               localField: "foodyOrderHistory",
               foreignField: "_id",
               as: "foodyOrderHistory",
               pipeline: [
                  {
                     $lookup: {
                        from: "restaurants",
                        localField: "restaurant",
                        foreignField: "_id",
                        as: "restaurant"
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
   )
   console.log(foodyHistory);
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            foodyHistory[0].foodyOrderHistory,
            "Order History fetched Succesfully"
         )
      )

})

const addToCyrMedicoOrderHistory = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res

   const { orderId } = req.params

   if (!orderId) {
      throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            cyrMedicoOrderHistory: new mongoose.Types.ObjectId(orderId)
         }
      },
      {
         new: true
      })

   if (!order) {
      throw new ApiError(400, "Error in adding order history")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, order, "Successfully added to order history"))
})

const getCyrMedicoOrderHistory = asyncHandler(async (req, res) => {
   //get the user_id from req.user
   //using mongoose aggregate filter the id from cyrMedicoOrderHistory and cyrMedicoOrders
   //check for the above data
   //return res

   const cyrMedicoHistory = await User.aggregate(
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.user._id),
            },
         },
         {
            $lookup: {
               from: "cyrmedicoorders",
               localField: "cyrMedicoOrderHistory",
               foreignField: "_id",
               as: "cyrMedicoOrderHistory",
               pipeline: [
                  {
                     $lookup: {
                        from: "restaurants",
                        localField: "restaurant",
                        foreignField: "_id",
                        as: "restaurant"
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
      ])
   console.log(cyrMedicoHistory);
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            cyrMedicoHistory[0].cyrMedicoOrderHistory,
            "Order History fetched Succesfully"
         )
      )

})

const addTocyrOrderHistory = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res

   const { orderId } = req.params

   if (!orderId) {
      throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            cyrOrderHistory: new mongoose.Types.ObjectId(orderId)
         }
      },
      {
         new: true
      })

   if (!order) {
      throw new ApiError(400, "Error in adding order history")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, order, "Successfully added to order history"))

})

const getcyrOrderHistory = asyncHandler(async (req, res) => {
   //get the user_id from req.user
   //using mongoose aggregate filter the id from cyrOrderHistory and cyrOrders
   //check for the above data
   //return res

   const cyrHistory = await User.aggregate([
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.user._id),
            },
         },
         {
            $lookup: {
               from: "cyrorders",
               localField: "cyrOrderHistory",
               foreignField: "_id",
               as: "cyrOrderHistory",
               pipeline: [
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
   )
   console.log(cyrHistory);
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            cyrHistory[0].cyrOrderHistory,
            "Order History fetched Succesfully"
         )
      )

})

const addTofoodyCancelledOrders = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res

   const { orderId } = req.params

   if (!orderId) {
      throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            foodyCancelledOrders: new mongoose.Types.ObjectId(orderId)
         }
      },
      {
         new: true
      })

   if (!order) {
      throw new ApiError(400, "Error in adding Cancelled Order history")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, order, "Successfully added to Cancelled Order history"))

})

const getfoodyCancelledOrders = asyncHandler(async (req, res) => {
   //get the user_id from req.user
   //using mongoose aggregate filter the id from foodyCancelledOrders and foodyCancelledOrders
   //check for the above data
   //return res


   const foodyHistory = await User.aggregate([
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.user._id),
            },
         },
         {
            $lookup: {
               from: "foodycancelledorders",
               localField: "foodyCancelledOrders",
               foreignField: "_id",
               as: "foodyCancelledOrders",
               pipeline: [
                  {
                     $lookup: {
                        from: "restaurants",
                        localField: "restaurant",
                        foreignField: "_id",
                        as: "restaurant"
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
   console.log(foodyHistory);
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            foodyHistory[0].foodyCancelledOrders,
            "Order History fetched Succesfully"
         )
      )

})

const addToCyrMedicoCancelledOrders = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res

   const { orderId } = req.params

   if (!orderId) {
      throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            cyrMedicoCancelledOrders: new mongoose.Types.ObjectId(orderId)
         }
      },
      {
         new: true
      })

   if (!order) {
      throw new ApiError(400, "Error in adding Cancelled Order history")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, order, "Successfully added to Cancelled Order history"))

})

const getCyrMedicoCancelledOrders = asyncHandler(async (req, res) => {
   //get the user_id from req.user
   //using mongoose aggregate filter the id from cyrMedicoCancelledOrders and cyrMedicoCancelledOrders
   //check for the above data
   //return res


   const cyrMedicoHistory = await User.aggregate(
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.user._id),
            },
         },
         {
            $lookup: {
               from: "cyrmedicocancelledorders",
               localField: "cyrMedicoCancelledOrders",
               foreignField: "_id",
               as: "cyrMedicoCancelledOrders",
               pipeline: [
                  {
                     $lookup: {
                        from: "medicals",
                        localField: "medical",
                        foreignField: "_id",
                        as: "medical"
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
      ])
   console.log(cyrMedicoHistory);
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            cyrMedicoHistory[0].cyrMedicoCancelledOrders,
            "Order History fetched Succesfully"
         )
      )

})

const addTocyrCancelledOrders = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res

   const { orderId } = req.params

   if (!orderId) {
      throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            cyrCancelledOrders: new mongoose.Types.ObjectId(orderId)
         }
      },
      {
         new: true
      })

   if (!order) {
      throw new ApiError(400, "Error in adding Cancelled Order history")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, order, "Successfully added to Cancelled Order history"))

})

const getcyrCancelledOrders = asyncHandler(async (req, res) => {
   //get the user_id from req.user
   //using mongoose aggregate filter the id from cyrCancelledOrders and cyrCancelledOrders
   //check for the above data
   //return res


   const cyrHistory = await User.aggregate([
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.user._id),
            },
         },
         {
            $lookup: {
               from: "cyrcancelledrides",
               localField: "cyrCancelledOrders",
               foreignField: "_id",
               as: "cyrCancelledOrders",
               pipeline: [
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
   console.log(cyrHistory);
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            cyrHistory[0].cyrcyrCancelledOrders,
            "Order History fetched Succesfully"
         )
      )

})

const addToFoodyRatings = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res 

   const { ratingId } = req.params

   if (!ratingId) {
      throw new ApiError(400, "Didn't got the rating Id")
   }

   const rating = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            foodyRatings: new mongoose.Types.ObjectId(ratingId)
         }
      },
      {
         new: true
      })

   if (!rating) {
      throw new ApiError(400, "Error in adding foody Ratings")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, rating, "Successfully added to foody Ratings"))

})

const getFoodyRatings = asyncHandler(async (req, res) => {
   //get the user_id from req.user
   //using mongoose aggregate filter the id from FoodyRatings and FoodyRatings
   //check for the above data
   //return res 


   const foodyRating = await User.aggregate([
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.user._id),
            },
         },
         {
            $lookup: {
               from: "foodyratings",
               localField: "foodyRatings",
               foreignField: "_id",
               as: "foodyRatings",
               pipeline: [
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
   ])
   console.log(foodyRating);
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            foodyRating[0].foodyRatings,
            "Rating Rating fetched Succesfully"
         )
      )

})

const addToCyrMedicoRatings = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res 

   const { ratingId } = req.params

   if (!ratingId) {
      throw new ApiError(400, "Didn't got the rating Id")
   }

   const rating = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            cyrMedicoRatings: new mongoose.Types.ObjectId(ratingId)
         }
      },
      {
         new: true
      })

   if (!rating) {
      throw new ApiError(400, "Error in adding cyrMedico Ratings")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, rating, "Successfully added to cyrMedico Ratings"))

})

const getCyrMedicoRatings = asyncHandler(async (req, res) => {
   //get the user_id from req.user
   //using mongoose aggregate filter the id from cyrMedicoRatings and cyrMedicoRatings
   //check for the above data
   //return res 


   const cyrMedicoRating = await User.aggregate(
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.user._id),
            },
         },
         {
            $lookup: {
               from: "cyrmedicoratings",
               localField: "cyrMedicoRatings",
               foreignField: "_id",
               as: "cyrMedicoRatings",
               pipeline: [
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
      ])
   console.log(cyrMedicoRating);
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            cyrMedicoRating[0].cyrMedicoRatings,
            "Rating Rating fetched Succesfully"
         )
      )

})

const addToCyrRatings = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res 

   const { ratingId } = req.params

   if (!ratingId) {
      throw new ApiError(400, "Didn't got the rating Id")
   }

   const rating = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            cyrRatings: new mongoose.Types.ObjectId(ratingId)
         }
      },
      {
         new: true
      })

   if (!rating) {
      throw new ApiError(400, "Error in adding cyr Ratings")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, rating, "Successfully added to cyr Ratings"))

})

const getCyrRatings = asyncHandler(async (req, res) => {
   //get the user_id from req.user
   //using mongoose aggregate filter the id from CYRRatings and CYRRatings
   //check for the above data
   //return res


   const cyrRating = await User.aggregate([

      {
         $match: {
            _id: new mongoose.Types.ObjectId(req.user._id),
         },
      },
      {
         $lookup: {
            from: "cyrratings",
            localField: "cyrRatings",
            foreignField: "_id",
            as: "cyrRatings",
            pipeline: [
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

   ])
   console.log(cyrRating);
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            cyrRating[0].cyrRatings,
            "Rating History fetched Succesfully"
         )
      )
})

const getAllVegFoods = asyncHandler(async (req, res) => {

   const { restroId } = req.body;
   console.log(req.body);

   console.log("RestroId", restroId);

   const allVegFoods = await Restaurant.aggregate(
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(restroId),
            },
         },
         {
            $lookup: {
               from: "vegfoods",
               localField: "vegFoods",
               foreignField: "_id",
               as: "VegFoodItems",
            }
         }
      ])
   console.log("FoodVeg", allVegFoods);
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            allVegFoods[0],
            "All Veg Foods fetched Succesfully"
         )
      )
})

const getAllNonVegFoods = asyncHandler(async (req, res) => {

   const { restroId } = req.body;

   const allNonVegFoods = await Restaurant.aggregate(
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(restroId),
            },
         },
         {
            $lookup: {
               from: "nonvegfoods",
               localField: "nonvegFoods",
               foreignField: "_id",
               as: "NonVegFoodItems",
            }
         }
      ])
   console.log(allNonVegFoods);
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            allNonVegFoods[0],
            "All NonVeg Foods fetched Succesfully"
         )
      )
})

const getAllRestaurants = asyncHandler(async (req, res) => {
   //check for all the restaurants open via mongoose aggregate
   //return res

   try {
      const { city } = req.params;
      const { vegMode } = req.query;

      if (!city) {
          return res.status(400).json({ message: 'City parameter is required.' });
      }

      // Fetch restaurants based on the city
      const restaurants = await Restaurant.find({ city, availableStatus: true })
          .populate(vegMode === 'true' ? 'vegFoods' : ['vegFoods', 'nonvegFoods'])
          .exec();

      if (restaurants.length === 0) {
          return res.status(404).json({ message: `No restaurants found in ${city}.` });
      }

      let foods = new Map();

      restaurants.forEach(restaurant => {
          const foodArray = vegMode === 'true' ? restaurant.vegFoods : [...restaurant.vegFoods, ...restaurant.nonvegFoods];
          foodArray.forEach(food => {
              if (!foods.has(food.name)) {
                  foods.set(food.name, food.image); // Use image randomly from the foods that have the same name
              }
          });
      });

      // Convert Map to Array of objects for frontend
      const uniqueFoods = Array.from(foods, ([name, image]) => ({ name, image }));

      res.json({ restaurants, foods: uniqueFoods });
  } catch (error) {
      if (error.name === 'CastError' || error.name === 'ValidationError') {
          // Handle mongoose validation errors
          return res.status(400).json({ message: 'Invalid request parameters.', error: error.message });
      } else if (error.name === 'MongoNetworkError') {
          // Handle network-related errors (e.g., unable to connect to database)
          return res.status(503).json({ message: 'Database connection error. Please try again later.', error: error.message });
      } else {
          // Handle any other unexpected errors
          return res.status(500).json({ message: 'An unexpected error occurred.', error: error.message });
      }
  }
  
})


const setDeviceToken = asyncHandler(async (req, res) => {
   const { token } = req.body;

   const deviceToken = await User.findByIdAndUpdate(req.user._id,
      {
         $set: {
            deviceToken: token
         }
      }, { new: true })

   console.log(deviceToken);
   if (!deviceToken) {
      throw new ApiError(400, "Error in setting the device Token")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, deviceToken, "Successfully stored device Token"))

})


const addTohotelRatings = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res 

   const { ratingId } = req.params

   if (!ratingId) {
      throw new ApiError(400, "Didn't got the rating Id")
   }

   const rating = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            hotelRatings: new mongoose.Types.ObjectId(ratingId)
         }
      },
      {
         new: true
      })

   if (!rating) {
      throw new ApiError(400, "Error in adding hotel Ratings")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, rating, "Successfully added to hotel Ratings"))

})

const addTohotelOrderHistory = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res

   const { orderId } = req.params

   if (!orderId) {
      throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            hotelOrderHistory: new mongoose.Types.ObjectId(orderId)
         }
      },
      {
         new: true
      })

   if (!order) {
      throw new ApiError(400, "Error in adding order history")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, order, "Successfully added to order history"))

})


const getAllHotelsCity = asyncHandler(async (req, res) => {
   //check for all the Hotels open via mongoose aggregate
   //return res

   const allhotel = await Hotel.aggregate([
      {
         $group: {
            _id: '$city'
         }
      }
   ])

   if (!allhotel) {
      throw new ApiError(400, "Didn't got the details")
   }

   console.log(allhotel);

   return res
      .status(200)
      .json(new ApiResponse(200, allhotel, "Successfully Fetched All Hotels"))

})

const getAllHotelsForCoupleStay = asyncHandler(async (req, res) => {
   //check for all the Hotels open via mongoose aggregate
   //return res

   const {city} = req.body;

   const allhotel = await Hotel.aggregate([
      {
         $match: {
            city: city,
            isCoupleStayAllowed: true
         }
      }
   ])

   if (!allhotel) {
      throw new ApiError(400, "Didn't got the details")
   }

   console.log(allhotel);

   if(!(allhotel.length > 0)){
      return res
      .status(200)
      .json(new ApiResponse(200, {check:{noHotel: true}}, "No hotel Found With this city name"))
   }

   return res
      .status(200)
      .json(new ApiResponse(200, allhotel, "Successfully Fetched All Hotels"))

})

const getAllHotelsForFamilyStay = asyncHandler(async (req, res) => {
   //check for all the Hotels open via mongoose aggregate
   //return res

   const {city} = req.body;

   const allhotel = await Hotel.aggregate([
      {
         $match: {
            city: city,
            isFamilyStayAllowed: true
         }
      }
   ])

   if (!allhotel) {
      throw new ApiError(400, "Didn't got the details")
   }

   console.log(allhotel);

   if(!(allhotel.length > 0)){
      return res
      .status(200)
      .json(new ApiResponse(200, {check:{noHotel: true}}, "No hotel Found With this city name"))
   }

   return res
      .status(200)
      .json(new ApiResponse(200, allhotel, "Successfully Fetched All Hotels"))

})

const getAllHotelsByCity = asyncHandler(async (req, res) => {

   const {city} = req.body;

   const hotel = await Hotel.aggregate([
      {
         $match: {
            city: city
         }
      }
   ])

   console.log(hotel);

   if(!hotel){
      throw new ApiError(401, `Error in finding hotel with city name ${city}`)
   }

   if(!(hotel.length > 0)){
      return res
      .status(200)
      .json(new ApiResponse(200, {check:{noHotel: true}}, "No hotel Found With this city name"))
   }

   return res
   .status(200)
   .json(new ApiResponse(200, hotel, "Successfully Fetched All Hotels by its city name"))

})


const addToFlatRatings = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res 

   const { ratingId } = req.params

   if (!ratingId) {
      throw new ApiError(400, "Didn't got the rating Id")
   }

   const rating = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            flatRatings: new mongoose.Types.ObjectId(ratingId)
         }
      },
      {
         new: true
      })

   if (!rating) {
      throw new ApiError(400, "Error in adding hotel Ratings")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, rating, "Successfully added to hotel Ratings"))

})

const addToFlatOrderHistory = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res

   const { orderId } = req.params

   if (!orderId) {
      throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await User.findByIdAndUpdate(
      req.user._id,
      {
         $push: {
            flatOrderHistory: new mongoose.Types.ObjectId(orderId)
         }
      },
      {
         new: true
      })

   if (!order) {
      throw new ApiError(400, "Error in adding order history")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, order, "Successfully added to order history"))

})


const getAllFlats = asyncHandler(async (req, res) => {
   //check for all the Hotels open via mongoose aggregate
   //return res

   const allflat = await Flat.aggregate([
      {
         $group: {
            _id: '$city'
         }
      }
   ])

   if (!allflat) {
      throw new ApiError(400, "Didn't got the details")
   }

   console.log(allflat);

   return res
      .status(200)
      .json(new ApiResponse(200, allflat, "Successfully Fetched All flats"))

})

const getAllFlatsByCity = asyncHandler(async (req, res) => {

   const {city} = req.body;

   const flat = await Flat.aggregate([
      {
         $match: {
            city: city
         }
      }
   ])

   if(!flat){
      throw new ApiError(401, `Error in finding flat with city name ${city}`)
   }

   if(!(flat.length > 0)){
      return res
      .status(200)
      .json(new ApiResponse(200, {check:{noFlat: true}}, "No hotel Found With this city name"))
   }

   return res
   .status(200)
   .json(new ApiResponse(200, flat, "Successfully Fetched All flats by its city name"))

})

const updateUserLocation = asyncHandler( async(req, res) => {
   try {
      console.log('entryyyy in user')
      const { latitude, longitude } = req.body;
      if(!(latitude && longitude)){
         return res.status(404).send('LatLong Required')
      }
      const user = await User.findByIdAndUpdate(req.user._id,
         {
            $set: {
               latitude, longitude
            }
         },{new: true}
      )

      if (!user) {
         console.error('User not found:', req.user._id);
         return res.status(404).send('User not found');
       }
   
       console.log('Location updated successfully:', {
         userId: req.user._id,
         latitude,
         longitude,
       });


      res.status(200).send('Location updated');
    } catch (error) {
      res.status(500).send('Error updating location');
    }
})

// Fetch all carousel images
const getCarouselImages = async (req, res) => {
   try {
     const images = await CarouselImage.find({});
     res.json(images);
   } catch (error) {
     res.status(500).json({ message: 'Error fetching carousel images', error });
   }
 };
 
 // Upload a new carousel image
 const uploadCarouselImage = async (req, res) => {
   const { title } = req.body;
   const carouselPhotoLocalPath = req.file?.path;

      if (!carouselPhotoLocalPath) {
         res.status(400).json(new ApiResponse(400, "carouselPhoto File is required"))
         throw new ApiError(400, "carouselPhoto File is required")
      }
   
      const carouselPhoto = await uploadOnCloudinary(carouselPhotoLocalPath);
   
      if (!carouselPhoto) {
         res.status(400).json(new ApiResponse(400, "Error in uploading carouselPhoto file"))
         throw new ApiError(400, "Error in uploading carouselPhoto file")
      }
   try {
     const newImage = new CarouselImage({ imageUrl: carouselPhoto.url, title });
     await newImage.save();
     res.status(201).json(newImage);
   } catch (error) {
     res.status(500).json({ message: 'Error uploading carousel image', error });
   }
 };

 const getOfferImages = async (req, res) => {
   try {
     const images = await OfferImage.find({});
     res.json(images);
   } catch (error) {
     res.status(500).json({ message: 'Error fetching Offer images', error });
   }
 };
 
 // Upload a new Offer image
 const uploadOfferImage = async (req, res) => {
   const { title } = req.body;
   const offerPhotoLocalPath = req.file?.path;

      if (!offerPhotoLocalPath) {
         res.status(400).json(new ApiResponse(400, "offerPhoto File is required"))
         throw new ApiError(400, "offerPhoto File is required")
      }
   
      const offerPhoto = await uploadOnCloudinary(offerPhotoLocalPath);
   
      if (!offerPhoto) {
         res.status(400).json(new ApiResponse(400, "Error in uploading offerPhoto file"))
         throw new ApiError(400, "Error in uploading offerPhoto file")
      }
   try {
     const newImage = new OfferImage({ imageUrl: offerPhoto.url, title });
     await newImage.save();
     res.status(201).json(newImage);
   } catch (error) {
     res.status(500).json({ message: 'Error uploading carousel image', error });
   }
 };

// Fetch all carousel images
const getFoodCarouselImages = async (req, res) => {
   try {
     const images = await FoodCarouselImage.find({});
     res.json(images);
   } catch (error) {
     res.status(500).json({ message: 'Error fetching foodCarousel images', error });
   }
 };
 
 // Upload a new foodCarousel image
 const uploadFoodCarouselImage = async (req, res) => {
   const { title } = req.body;
   const foodCarouselPhotoLocalPath = req.file?.path;

      if (!foodCarouselPhotoLocalPath) {
         res.status(400).json(new ApiResponse(400, "foodCarouselPhoto File is required"))
         throw new ApiError(400, "foodCarouselPhoto File is required")
      }
   
      const foodCarouselPhoto = await uploadOnCloudinary(foodCarouselPhotoLocalPath);
   
      if (!foodCarouselPhoto) {
         res.status(400).json(new ApiResponse(400, "Error in uploading foodCarouselPhoto file"))
         throw new ApiError(400, "Error in uploading foodCarouselPhoto file")
      }
   try {
     const newImage = new FoodCarouselImage({ imageUrl: foodCarouselPhoto.url, title });
     await newImage.save();
     res.status(201).json(newImage);
   } catch (error) {
     res.status(500).json({ message: 'Error uploading foodCarousel image', error });
   }
 };

 const getFoodOfferImages = async (req, res) => {
   try {
     const images = await FoodOfferImage.find({});
     res.json(images);
   } catch (error) {
     res.status(500).json({ message: 'Error fetching Offer images', error });
   }
 };
 
 // Upload a new Offer image
 const uploadFoodOfferImage = async (req, res) => {
   const { title } = req.body;
   const offerPhotoLocalPath = req.file?.path;

      if (!offerPhotoLocalPath) {
         res.status(400).json(new ApiResponse(400, "offerPhoto File is required"))
         throw new ApiError(400, "offerPhoto File is required")
      }
   
      const offerPhoto = await uploadOnCloudinary(offerPhotoLocalPath);
   
      if (!offerPhoto) {
         res.status(400).json(new ApiResponse(400, "Error in uploading offerPhoto file"))
         throw new ApiError(400, "Error in uploading offerPhoto file")
      }
   try {
     const newImage = new FoodOfferImage({ imageUrl: offerPhoto.url, title });
     await newImage.save();
     res.status(201).json(newImage);
   } catch (error) {
     res.status(500).json({ message: 'Error uploading carousel image', error });
   }
 };

 const getFestiveOfferImages = async (req, res) => {
   try {
     const images = await FestiveOfferImage.find({});
     res.json(images);
   } catch (error) {
     res.status(500).json({ message: 'Error fetching Offer images', error });
   }
 };
 
 // Upload a new Offer image
 const uploadFestiveOfferImage = async (req, res) => {
   const { title } = req.body;
   const offerPhotoLocalPath = req.file?.path;

      if (!offerPhotoLocalPath) {
         res.status(400).json(new ApiResponse(400, "offerPhoto File is required"))
         throw new ApiError(400, "offerPhoto File is required")
      }
   
      const offerPhoto = await uploadOnCloudinary(offerPhotoLocalPath);
   
      if (!offerPhoto) {
         res.status(400).json(new ApiResponse(400, "Error in uploading offerPhoto file"))
         throw new ApiError(400, "Error in uploading offerPhoto file")
      }
   try {
     const newImage = new FestiveOfferImage({ imageUrl: offerPhoto.url, title });
     await newImage.save();
     res.status(201).json(newImage);
   } catch (error) {
     res.status(500).json({ message: 'Error uploading carousel image', error });
   }
 };

 const ridesAvailable = async (req, res) => {
   const { pickupLocation } = req.body;

   // Find riders with a matching city name
   const riders = await Rider.find({
       city: pickupLocation.city,
       availableStatus: true
   });

   // Categorize riders by vehicle type
   const categorizedRiders = riders.reduce((acc, rider) => {
       const { vehicleType } = rider;

       if (!acc[vehicleType]) {
           acc[vehicleType] = [];
       }

       acc[vehicleType].push(rider);
       return acc;
   }, {});

   // Format the response to include category names
   const response = Object.entries(categorizedRiders).map(([vehicleType, riders]) => ({
       vehicleType,
       riders
   }));

   console.log("Response", response)
   console.log("Response2", response[0], response[1])

   res.json(response);
 }

 const getRoomBookingHistory = async (req, res) => {
   try {
      const userId = req.user._id; // Assuming user is authenticated and userId is available from token payload
      
      // Fetch all orders for the logged-in user
      const roomBookings = await HotelOrders.find({ bookedBy: userId })
        .populate('hotel', 'hotelName') // Populate hotel data (only name)
        .sort({ createdAt: -1 }); // Sort by created date (latest first)
      
      if (!roomBookings || roomBookings.length === 0) {
        return res.status(404).json(new ApiResponse(404, 'No room bookings found.'));
      }
  
      // Return the bookings as response
      return res.status(200).json(new ApiResponse(200, roomBookings, 'Room booking history fetched successfully.'));
      
    } catch (error) {
      console.error(error);
      throw new ApiError(500, 'Internal Server Error');
    }
 }

 const gethotelDashboardImages = async (req, res) => {
   try {
     const images = await hotelDashboardImage.find({});
     res.json(images);
   } catch (error) {
     res.status(500).json({ message: 'Error fetching Offer images', error });
   }
 };
 
 // Upload a new Offer image
 const uploadhotelDashboardImage = async (req, res) => {
   const { title } = req.body;
   const offerPhotoLocalPath = req.file?.path;

      if (!offerPhotoLocalPath) {
         res.status(400).json(new ApiResponse(400, "offerPhoto File is required"))
         throw new ApiError(400, "offerPhoto File is required")
      }
   
      const offerPhoto = await uploadOnCloudinary(offerPhotoLocalPath);
   
      if (!offerPhoto) {
         res.status(400).json(new ApiResponse(400, "Error in uploading offerPhoto file"))
         throw new ApiError(400, "Error in uploading offerPhoto file")
      }
   try {
     const newImage = new hotelDashboardImage({ imageUrl: offerPhoto.url, title });
     await newImage.save();
     res.status(201).json(newImage);
   } catch (error) {
     res.status(500).json({ message: 'Error uploading carousel image', error });
   }
 };

 const getAllHotels = asyncHandler(async (req, res) => {
   try {
      const hotels = await Hotel.find();
      res.status(200).json({ success: true, hotels });
    } catch (error) {
      console.error('Error fetching hotels:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
 })

 const getAllFees = asyncHandler(async (req, res) => {
   try {
      const fees = await Fees.find();
      res.status(200).json({success: true, fees})
   } catch (error) {
      console.error('Error fetching hotels:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
   }
 })


export {
   registerUser,
   loginUser,
   googleRegisterUser,
   googleAuthLogin,
   facebookAuthLogin,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   signoutUser,
   addTofoodyOrderHistory,
   getfoodyOrderHistory,
   addTocyrOrderHistory,
   getcyrOrderHistory,
   addTofoodyCancelledOrders,
   getfoodyCancelledOrders,
   addTocyrCancelledOrders,
   getcyrCancelledOrders,
   addToCyrRatings,
   getCyrRatings,
   addToCyrMedicoOrderHistory,
   getCyrMedicoOrderHistory,
   addToCyrMedicoCancelledOrders,
   getCyrMedicoCancelledOrders,
   addToCyrMedicoRatings,
   getCyrMedicoRatings,
   addToFoodyRatings,
   getFoodyRatings,
   getAllVegFoods,
   getAllNonVegFoods,
   getAllRestaurants,
   setDeviceToken,
   addTohotelRatings,
   addTohotelOrderHistory,
   getAllHotelsCity,
   getAllHotelsForCoupleStay,
   getAllHotelsForFamilyStay,
   getAllHotelsByCity,
   addToFlatRatings,
   addToFlatOrderHistory,
   getAllFlats,
   getAllFlatsByCity,
   updateUserLocation,
   uploadCarouselImage,
   getCarouselImages,
   uploadOfferImage,
   getOfferImages,
   getFoodCarouselImages,
   uploadFoodCarouselImage,
  getFoodOfferImages,
  uploadFoodOfferImage,
  getFestiveOfferImages,
  uploadFestiveOfferImage,
  ridesAvailable,
  getRoomBookingHistory,
  gethotelDashboardImages,
  uploadhotelDashboardImage,
  getAllHotels,
  getAllFees
}