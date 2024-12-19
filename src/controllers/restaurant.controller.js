import { Restaurant } from "../models/Restaurant.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { VegFoods } from "../models/VegFoods.model.js";
import { NonVegFoods } from "../models/NonVegFoods.model.js";
import { RestroAcceptReject } from "../models/RestaurantAcceptReject.model.js";
import axios from 'axios';
import { FoodyOrders } from "../models/FoodyOrders.model.js";
import moment from 'moment';


const generateAccessAndRefreshTokens = async (restaurantId) => {
   try {
      const restaurant = await Restaurant.findById(restaurantId)
      const accessToken = restaurant.generateAccessToken();
      const refreshToken = restaurant.generateRefreshToken();

      restaurant.refreshToken = refreshToken;
      await restaurant.save({ validateBeforeSave: false })

      return { accessToken, refreshToken }

   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating Refresh and Access Token");
   }
}

const registerRestaurant = asyncHandler(async (req, res) => {
   //Take all fields from req.body
   //validate the fields
   //check if Restaurant already exists - Restaurantname, email
   //check for avatar path
   //upload to cloudinary
   //check for upload
   //create entry in db
   //check for db
   // remove password and refresh token field
   //return res

   const { restaurantName, ownerName, email, password, address, mobileNo, alternateMobileNo,
      restaurantPhotoImg, fssaiNo, fssaiExpiryDate, openingTime, closingTime, city, cuisineType, accountNumber, ifscCode,
      bankName, branch } = req.body;

   let altMob;
   if (alternateMobileNo?.length) {
      altMob = {
         alternateMobileNo
      }
   }

   if (
      [restaurantName, ownerName, email, password, address, mobileNo, fssaiNo, fssaiExpiryDate, openingTime, closingTime].some((field) =>
         field?.trim === "")
   ) {
      res.status(400).json(new ApiResponse(400, "All fields are required"))
      throw new ApiError(400, "All fields are required")
   }

   const existedRestaurant = await Restaurant.findOne({
      $or: [{ mobileNo }, { email }]
   })

   if (existedRestaurant) {
      res.status(400).json(new ApiResponse(400, "Restaurant already exists, Please Login!"))
      throw new ApiError(409, "Restaurant already exists, Please Login!")
   }

   const restaurantLocalPath = restaurantPhotoImg;
   // const restaurantLocalPath = req.file?.path;

   const restaurantPhoto = await uploadOnCloudinary(restaurantLocalPath);

   if (!restaurantPhoto) {
      res.status(400).json(new ApiResponse(400, "Error in uploading restaurant file"))
      throw new ApiError(400, "Error in uploading restaurant file")
   }

   const restaurant = await Restaurant.create({
      restaurantName,
      ownerName,
      email,
      password,
      address,
      restaurantPhoto: restaurantPhoto.url,
      mobileNo,
      fssaiNo,
      fssaiExpiryDate,
      alternateMobileNo: altMob?.alternateMobileNo || "",
      openingTime,
      closingTime,
      city,
      cuisineType,
      bankAccountNo: accountNumber, 
      ifscCode,
      bankBranch: branch,
      bankName
   })

   if (!restaurant) {
      res.status(400).json(new ApiResponse(400, "Something went wrong while registering restaurant"))
      throw new ApiError(400, "Something went wrong while registering restaurant")
   }
   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(restaurant._id);

   const createdRestaurant = await Restaurant.findById(restaurant._id).select("-password -refreshToken")

   return res
      .status(200)
      .json(
         new ApiResponse(200, { Restaurant: createdRestaurant, accessToken, refreshToken }, "Restaurant Registered Successfully")
      )

})

const loginRestaurant = asyncHandler(async (req, res) => {
   //get details like restaurantname or email and password from frontend
   //validate them
   //Search for restaurant in db
   //check for restaurant
   //Match the password
   //Access and refresh token when password is correct
   //send cookie
   
   const { email, otp } = req.body

   if (!(email && otp)) {
      throw new ApiError(400, "email or otp is required")
   }

   const restaurant = await Restaurant.findOne({ email })

   if (!restaurant) {
      res.status(400).json(new ApiResponse(400, "restaurant doesn't exists"))
      throw new ApiError(400, "restaurant doesn't exists")
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

   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(restaurant._id);

   const loggedInRestaurant = await Restaurant.findById(restaurant._id).select("-password -refreshToken");

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
               Restaurant: loggedInRestaurant, accessToken, refreshToken
            },
            "Restaurant Logged In Successfully"
         )
      )

})

const googleAuthLogin = asyncHandler(async (req, res) => {
   console.log(req);
   const { RestaurantInfo } = req.body;
   console.log(RestaurantInfo);//Look into the data and register accordingly

   return res.status(200)
      .json(new ApiResponse(200, "Google Authentication Login Successfull"))
})

const facebookAuthLogin = asyncHandler(async (req, res) => {
   const { RestaurantInfo } = req.body;
   console.log(RestaurantInfo);//Look into the data and register accordingly

   return res.status(200)
      .json(new ApiResponse(200, token, "Google Authentication Login Successfull"))
})

const logoutRestaurant = asyncHandler(async (req, res) => {
   //take the restaurant._id from req.cookie
   //remove accessToken and RefreshToken

   const restaurant = await Restaurant.findByIdAndUpdate(req.restaurant._id,
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
      .json(new ApiResponse(200, {}, "Restaurant Logged Out Successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

   const incomingRestroId = req.body.restro;
   console.log('RestroId', incomingRestroId)
  
   if (!incomingRestroId) {
      throw new ApiError(401, "Unauthorized Request")
   }

   try {
      const options = {
         httpOnly: true,
         secure: true
      }

      const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(incomingRestroId)

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

   const restaurant = await Restaurant.findById(req.restaurant._id)

   const isPasswordValid = await restaurant.isPasswordCorrect(oldPassword)

   if (!isPasswordValid) {
      throw new ApiError(400, "Old Password is Incorrect")
   }

   restaurant.password = newPassword;
   await restaurant.save({ validateBeforeSave: false })

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Changed Successfully"))

})

const getCurrentRestaurant = asyncHandler(async (req, res) => {
   //return all info of the Restaurant in the db
   return res
      .status(200)
      .json(new ApiResponse(200, req.restaurant, "Rider Details fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
   const { restaurantName, email, mobileNo, address, openingTime, closingTime } = req.body

   if (!(restaurantName || email || mobileNo || address || openingTime || closingTime)) {
      throw new ApiError(400, "All fields are required")
   }

   const restaurant = await Restaurant.findByIdAndUpdate(
      req.restaurant?._id,
      {
         $set: {
            restaurantName: restaurantName,
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
      .json(new ApiResponse(200, restaurant, "Acount Details Updated Successfully"))
})

const signoutRestaurant = asyncHandler(async (req, res) => {
   //get the rider_id from req.rider
   //validate rider_id
   //find and delete the rider_id 
   //return res

   const restaurant = await Restaurant.findByIdAndDelete(
      req.restaurant?._id,
      {
         $unset: {
            _id: 1
         }
      })

   if (!restaurant) {
      throw new ApiError(400, "Error in SigningOut Restaurant")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, { signedOutRestaurant: restaurant }, "Restaurant SignedOut Successfully"))

})

const addToOrderHistory = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //push to the array and check it
   //return res

   const { orderId } = req.params

   if (!orderId) {
      throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await Restaurant.findByIdAndUpdate(
      req.restaurant._id,
      {
         $push: {
            OrderHistory: new mongoose.Types.ObjectId(orderId)
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

const removeOrderHistory = asyncHandler(async (req, res) => {
   //get the id from params
   //validate the id
   //pull to the array and check it
   //return res

   const { orderId } = req.params

   if (!orderId) {
      throw new ApiError(400, "Didn't got the order Id")
   }

   const order = await Restaurant.findByIdAndUpdate(
      req.restaurant._id,
      {
         $pull: {
            OrderHistory: new mongoose.Types.ObjectId(orderId)
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

const getOrderHistory = asyncHandler(async (req, res) => {
   //get the restaurant_id from req.restaurant
   //using mongoose aggregate filter the id from foodyOrderHistory and foodyOrders
   //check for the above data
   //return res

   const orderHistory = await Restaurant.aggregate(
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.restaurant._id),
            },
         },
         {
            $lookup: {
               from: "foodyorders",
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
   )
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
   //get the restaurant_id from req.restaurant
   //using mongoose aggregate match and calculate the amount with the distance travelled
   //update it in the restaurant's db
   //return res

})

const updateRestaurantRatings = asyncHandler(async (req, res) => {
   //get the restaurant_id from req.restaurant
   //using mongoose aggregate match and calculate the average ratings from all the foodyRatings where restaurant is common
   //check for above data and update it in the db
   //return res

   const allRating = await Restaurant.aggregate(
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.restaurant._id),
            },
         },
         {
            $lookup: {
               from: "foodyratings",
               localField: "_id",
               foreignField: "restaurant",
               as: "foodyRatings"
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

   const allRating = await Restaurant.aggregate([
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.restaurant._id),
            },
         },
         {
            $lookup: {
               from: "foodyratings",
               localField: "_id",
               foreignField: "restaurant",
               as: "foodyRatings",
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

const getRestaurantById = asyncHandler(async (req, res) => {
   //get the restaurantId from params
   //check for the id in the db
   //return res
})

const updateLatLong = asyncHandler(async (req, res) => {
   //thinking to do it in sockets
})

const addVegFoods = asyncHandler(async (req, res) => {
   const { name, image, price, tiofyPriceFactor } = req.body;
  console.log(name, price, image, tiofyPriceFactor);
  
  if (
   [name, image, price, tiofyPriceFactor].some((field) =>
      field?.trim === "")
) {
   res.status(400).json(new ApiResponse(400, "Didn't got the details"))
   throw new ApiError(400, "Didn't got the details")
}

   //  const foodLocalPath = image;  commented for test in postman

   const foodLocalPath = req.file?.path;

   const foodPhoto = await uploadOnCloudinary(foodLocalPath);

   if (!foodPhoto) {
      res.status(400).json(new ApiResponse(400, "Error in uploading food file"))
      throw new ApiError(400, "Error in uploading food file")
   }

   const vegfood = await VegFoods.create({
      name,
      image: foodPhoto.url,
      price,
      tiofyPriceFactor
   })

   if (!vegfood) {
      throw new ApiError(400, "Error in adding Food Items")
   }

   console.log(vegfood._id);

   const restaurant = await Restaurant.findByIdAndUpdate(req.restaurant._id,
      {
         $push: {
            vegFoods: new mongoose.Types.ObjectId(vegfood._id)
         }
      }, { new: true })

      console.log(restaurant);

   if (!restaurant) {
      throw new ApiError(400, "Error in adding Food Items to the restro array")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, { foods: vegfood, restaurant }, "Successfully Added Food Item"))
})

const addNonVegFoods = asyncHandler(async (req, res) => {
   const { name, image, price, tiofyPriceFactor } = req.body;

   if (
      [name, image, price, tiofyPriceFactor].some((field) =>
         field?.trim === "")
   ) {
      res.status(400).json(new ApiResponse(400, "Didn't got the details"))
      throw new ApiError(400, "Didn't got the details")
   }

   //  const foodLocalPath = image;  commented for test in postman

   const foodLocalPath = req.file?.path;

   const foodPhoto = await uploadOnCloudinary(foodLocalPath);

   if (!foodPhoto) {
      res.status(400).json(new ApiResponse(400, "Error in uploading food file"))
      throw new ApiError(400, "Error in uploading food file")
   }

   const nonvegfood = await NonVegFoods.create({
      name,
      image: foodPhoto.url,
      price,
      tiofyPriceFactor
   })

   if (!nonvegfood) {
      throw new ApiError(400, "Error in adding Food Items")
   }

   const restaurant = await Restaurant.findByIdAndUpdate(req.restaurant._id,
      {
         $push: {
            nonvegFoods: new mongoose.Types.ObjectId(nonvegfood._id)
         }
      }, { new: true })

   if (!restaurant) {
      throw new ApiError(400, "Error in adding Food Items to the restro array")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, { foods: nonvegfood, restro: restaurant }, "Successfully Added Food Item"))
})

const removeVegFoods = asyncHandler(async (req, res) => {
   const { foodId } = req.params;

   if (!(foodId)) {
      throw new ApiError(400, "Didn't got the foodId")
   }

   const removedfood = await VegFoods.findByIdAndDelete(
      new mongoose.Types.ObjectId(foodId),
      {
         $unset: {
            _id: 1
         }
      },
      {
         new: true
      })

   if (!removedfood) {
      throw new ApiError(400, "Error in removing Food Items")
   }

   const restaurant = await Restaurant.findByIdAndUpdate(req.restaurant._id,
      {
         $pull: {
            vegFoods: new mongoose.Types.ObjectId(foodId)
         }
      }, { new: true })

   if (!restaurant) {
      throw new ApiError(400, "Error in removing Food Items to the restro array")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, { foods: removedfood, restro: restaurant }, "Successfully removed Food Item"))
})

const removeNonVegFoods = asyncHandler(async (req, res) => {
   const { foodId } = req.body;

   if (!(foodId)) {
      throw new ApiError(400, "Didn't got the foodId")
   }

   const removedfood = await NonVegFoods.findByIdAndDelete(
      new mongoose.Types.ObjectId(foodId),
      {
         $unset: {
            _id: 1
         }
      },
      {
         new: true
      })

   if (!removedfood) {
      throw new ApiError(400, "Error in removing Food Items")
   }

   const restaurant = await Restaurant.findByIdAndUpdate(req.restaurant._id,
      {
         $pull: {
            nonvegFoods: new mongoose.Types.ObjectId(foodId)
         }
      }, { new: true })

   if (!restaurant) {
      throw new ApiError(400, "Error in removing Food Items to the restro array")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, { foods: removedfood, restro: restaurant }, "Successfully removed Food Item"))
})

const getAllVegFoods = asyncHandler(async (req, res) => {

   const allVegFoods = await Restaurant.aggregate(
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.restaurant._id),
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
   console.log(allVegFoods);
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

   const allNonVegFoods = await Restaurant.aggregate(
      [
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.restaurant._id),
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

const setDeviceToken = asyncHandler( async(req, res) => {
   console.log(req.body);
   const {token} = req.body;
   console.log(token);
   console.log(req.restaurant._id);

   const deviceToken = await Restaurant.findByIdAndUpdate(req.restaurant._id,
  {
     $set: {
        deviceToken: token
     }
  },{new: true})

  console.log("DeviceToken", deviceToken);
  if(!deviceToken){
     throw new ApiError(400, "Error in setting the device Token")
  }

  return res
  .status(200)
  .json(new ApiResponse(200, deviceToken, "Successfully stored device Token"))

})

const fetchAcceptReject = asyncHandler( async(req, res) => {
    console.log(req.restaurant._id);
    const restro = await RestroAcceptReject.aggregate([
      {
         $match: {
            restaurantId: req.restaurant._id,
            status: false
         }
      }
   ])

    console.log(restro[0]);
    if(!restro){
      throw new ApiError(400, "Error in fetching Accept/Reject");
    }

    return res.
    status(200)
    .json(new ApiResponse(200, restro, "Successfull in fetching Accept/Reject"))
})

const updateRestroLocation = asyncHandler( async(req, res) => {
   try {
      console.log('entryyyy in restroo')
      const { latitude, longitude } = req.body;
      if(!(latitude && longitude)){
         return res.status(404).send('LatLong Required')
      }
      const restro = await Restaurant.findByIdAndUpdate(req.restaurant._id,
         {
            $set: {
               latitude, longitude
            }
         },{new: true}
      )

      if (!restro) {
         console.error('restro not found:', req.restaurant._id);
         return res.status(404).send('restro not found');
       }
   
       console.log('Location updated successfully:', {
         restroId: req.restaurant._id,
         latitude,
         longitude,
       });


      res.status(200).send('Location updated');
    } catch (error) {
      res.status(500).send('Error updating location');
    }
})

const toggleAvailableStatus = asyncHandler( async(req, res) => {
   try { // Assuming the user's restaurant ID is available in req.user.id
      const { availableStatus } = req.body;
  
      // Find the restaurant by ID
      const restaurant = await Restaurant.findById(req.restaurant._id);
  
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
  
      // Update the availableStatus
      restaurant.availableStatus = availableStatus;
      await restaurant.save();
  
      res.status(200).json({ message: 'Availability status updated successfully', availableStatus });
    } catch (error) {
      console.error('Error toggling availability:', error);
      res.status(500).json({ message: 'Server error' });
    }
})

const getEarnings = asyncHandler(async (req, res) => {
   try {
     const restaurantId = req.query.restroId;
 
     // Validate restaurantId
     if (!restaurantId) {
       return res.status(400).json({ message: "Restaurant ID is required" });
     }
     console.log('restaurantId:', restaurantId)
 
     const today = moment().startOf("day");
     const weekStart = moment().startOf("week");
 
     console.log("Executing earnings calculation...", today);
     console.log('week', weekStart)
 
     // Fetch Food Orders
     let foodOrders = [];
     try {
       foodOrders = await FoodyOrders.aggregate([
         {
           $match: {
             restaurant: new mongoose.Types.ObjectId(restaurantId),
             orderStatus: "Delivered",
             createdAt: { $gte: weekStart.toDate() },
           },
         },
         {
           $group: {
             _id: null,
             totalEarnings: { $sum: "$restroEarning" },
             totalOrders: { $sum: 1 },
             todayEarnings: {
               $sum: {
                 $cond: [{ $gte: ["$createdAt", today.toDate()] }, "$restroEarning", 0],
               },
             },
             todayOrders: {
               $sum: {
                 $cond: [{ $gte: ["$createdAt", today.toDate()] }, 1, 0],
               },
             },
           },
         },
       ]);
       console.log("Food orders fetched:", foodOrders);
     } catch (err) {
       console.error("Error fetching food orders:", err);
       return res.status(500).json({ message: "Error fetching food orders" });
     }
 
     // Combine Results
     const totalEarnings = (foodOrders[0]?.totalEarnings || 0);
     const totalOrders = (foodOrders[0]?.totalOrders || 0);
     const todayEarnings = (foodOrders[0]?.todayEarnings || 0);
     const todayOrders = (foodOrders[0]?.todayOrders || 0);
 
     console.log("Calculations completed:", {
       totalEarnings,
       totalOrders,
       todayEarnings,
       todayOrders,
     });
 
     res.status(200).json({
       totalEarnings,
       totalOrders,
       todayEarnings,
       todayOrders,
     });
   } catch (error) {
     console.error("Unexpected error:", error);
     res.status(500).json({ message: "Internal Server Error" });
   }
 });

 const getEarningsHistory = asyncHandler(async (req, res) => {
   try {
     const { restroId } = req.query;
 
     // Validate input
     if (!restroId) {
       return res.status(400).json({ message: "Restro ID is required" });
     }
 
     // Find the restro
     const restro = await Restaurant.findById(new mongoose.Types.ObjectId(restroId));
     if (!restro) {
       return res.status(404).json({ message: "Restro not found" });
     }
 
     console.log(`Fetching all-time earnings for Restro ID: ${restroId}`);
 
     // Helper function to aggregate earnings
     const aggregateEarnings = async (collection, restroField, statusField, statusValue) => {
       return await collection.aggregate([
         {
           $match: {
             [restroField]: new mongoose.Types.ObjectId(restroId),
             [statusField]: statusValue, // Adjust based on the collection
           },
         },
         {
           $facet: {
             byDate: [
               {
                 $group: {
                   _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                   totalEarnings: { $sum: "$restroEarning" },
                   orders: { $sum: 1 },
                 },
               },
               { $sort: { _id: 1 } },
             ],
             byWeek: [
               {
                 $group: {
                   _id: {
                     week: { $isoWeek: "$createdAt" },
                     year: { $isoWeekYear: "$createdAt" },
                   },
                   totalEarnings: { $sum: "$restroEarning" },
                   orders: { $sum: 1 },
                 },
               },
               { $sort: { "_id.year": 1, "_id.week": 1 } },
             ],
           },
         },
       ]);
     };
 
     // Fetch earnings for food orders
     const [foodEarnings] = await aggregateEarnings(FoodyOrders, "restaurant", "orderStatus", "Delivered");
 
     // Combine results
     const combinedByDate = [...foodEarnings.byDate].reduce((acc, item) => {
       const date = item._id;
       if (!acc[date]) {
         acc[date] = { totalEarnings: 0, orders: 0 };
       }
       acc[date].totalEarnings += item.totalEarnings;
       acc[date].orders += item.orders;
       return acc;
     }, {});
 
     const combinedByWeek = [...foodEarnings.byWeek].reduce((acc, item) => {
       const week = `${item._id.year}-W${item._id.week}`;
       if (!acc[week]) {
         acc[week] = { totalEarnings: 0, orders: 0 };
       }
       acc[week].totalEarnings += item.totalEarnings;
       acc[week].orders += item.orders;
       return acc;
     }, {});
 
     // Convert combined results to arrays
     const earningsByDate = Object.entries(combinedByDate).map(([date, data]) => ({
       date,
       totalEarnings: data.totalEarnings,
       orders: data.orders,
     }));
 
     const earningsByWeek = Object.entries(combinedByWeek).map(([week, data]) => ({
       week,
       startDate: moment(week, "YYYY-WW").startOf("isoWeek").format("MMM DD"),
       endDate: moment(week, "YYYY-WW").endOf("isoWeek").format("MMM DD"),
       totalEarnings: data.totalEarnings,
       orders: data.orders,
     }));
 
     // Response
     res.status(200).json({
       restroName: restro.restroName,
       totalEarnings: restro.moneyEarned,
       earningsByDate,
       earningsByWeek,
     });
   } catch (error) {
     console.error("Unexpected error:", error);
     res.status(500).json({ message: "Internal Server Error" });
   }
 });

 const updateDetails = asyncHandler(async (req, res) => {
   const { email, mobileNo, address, cuisineType, openingTime, closingTime, restaurantName } = req.body;
   const restaurantId = req.restaurant._id; 
 
   try {
     // Find the restauarant by the user ID
     const restaurant = await Restaurant.findById(restaurantId);
 
     if (!restaurant) {
       return res.status(404).json({ message: 'restaurant not found' });
     }
 
     // Check if the email is already taken by another restaurant
     if (email) {
       const existingEmail = await Restaurant.findOne({ email });
       if (existingEmail && existingEmail._id.toString() !== restaurant._id.toString()) {
         return res.status(400).json({ message: 'Email is already in use by another restaurant' });
       }
     }
 
     // Update restaurant details if email is not already taken and mobileNo is provided
     restaurant.email = email || restaurant.email;
     restaurant.mobileNo = mobileNo || restaurant.mobileNo;
     restaurant.address = address || restaurant.address;
     restaurant.cuisineType = cuisineType || restaurant.cuisineType;
     restaurant.openingTime = openingTime || restaurant.openingTime;
     restaurant.closingTime = closingTime || restaurant.closingTime;
     restaurant.restaurantName = restaurantName || restaurant.restaurantName;
 
     await restaurant.save();
 
     // Respond with success
     res.json({ message: 'restaurant updated successfully', data: restaurant });
   } catch (error) {
     console.error(error);
     res.status(500).json({ message: 'Server error' });
   }
 })

export {
   registerRestaurant,
   loginRestaurant,
   googleAuthLogin,
   facebookAuthLogin,
   logoutRestaurant,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentRestaurant,
   updateAccountDetails,
   signoutRestaurant,
   addToOrderHistory,
   removeOrderHistory,
   getAllRatings,
   getRestaurantById,
   updateMoneyEarned,
   updateRestaurantRatings,
   getOrderHistory,
   addVegFoods,
   addNonVegFoods,
   removeVegFoods,
   removeNonVegFoods,
   getAllVegFoods,
   getAllNonVegFoods,
   setDeviceToken,
   fetchAcceptReject,
   updateRestroLocation,
   toggleAvailableStatus,
   getEarnings,
   getEarningsHistory,
   updateDetails
}