import { Restaurant } from "../models/Retaurant.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { VegFoods } from "../models/VegFoods.model.js";
import { NonVegFoods } from "../models/NonVegFoods.model.js";

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
   //check if Rider already exists - Ridername, email
   //check for avatar path
   //upload to cloudinary
   //check for upload
   //create entry in db
   //check for db
   // remove password and refresh token field
   //return res

   const { restaurantName, ownerName, email, password, address, mobileNo, alternateMobileNo,
      restaurantPhotoImg, fssaiNo, fssaiExpiryDate, openingTime, closingTime } = req.body;

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

   //const restaurantLocalPath = restaurantPhotoImg;
   const restaurantLocalPath = req.file?.path;

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
      closingTime
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
         new ApiResponse(200, { restaurant: createdRestaurant, accessToken }, "Restaurant Registered Successfully")
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

   const { mobileNo } = req.body

   if (!mobileNo) {
      throw new ApiError(400, "MobileNO is required")
   }

   const restaurant = await Restaurant.findOne({ mobileNo })

   if (!restaurant) {
      res.status(400).json(new ApiResponse(400, "restaurant doesn't exists"))
      throw new ApiError(400, "restaurant doesn't exists")
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

   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized Request")
   }

   try {
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.RefreshTokenSecret);

      const restaurant = await Restaurant.findById(decodedToken?._id)

      if (!restaurant) {
         throw new ApiError(401, "Invalid Refresh Token")
      }

      if (incomingRefreshToken !== restaurant?.refreshToken) {
         throw new ApiError(401, "Refresh Token is Used")
      }

      const options = {
         httpOnly: true,
         secure: true
      }

      const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(restaurant._id)

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


   const orderHistory = await Restaurant.aggregate([
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

const getRestaurantById = asyncHandler(async (req, res) => {
   //get the restaurantId from params
   //check for the id in the db
   //return res
})

const updateLatLong = asyncHandler(async (req, res) => {
   //thinking to do it in sockets
})

const addVegFoods = asyncHandler(async (req, res) => {
   const { name, image, price } = req.body;
  console.log(name, price, image);
  
  if (
   [name, image, price].some((field) =>
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
      price
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
   const { name, image, price } = req.body;

   if (
      [name, image, price].some((field) =>
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
      price
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
   setDeviceToken
}