import { Laundry } from "../models/Laundry.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (laundryId) => {
    try {
        const laundry = await Laundry.findById(laundryId)
        const accessToken = laundry.generateAccessToken();
        const refreshToken = laundry.generateRefreshToken();

        laundry.refreshToken = refreshToken;
        await laundry.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Refresh and Access Token");
    }
}

const registerLaundry = asyncHandler(async (req, res) => {
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

    const { shopName, ownerName, email, password, address, mobileNo, alternateMobileNo,
        laundryPhotoImg, city } = req.body;

    let altMob;
    if (alternateMobileNo?.length) {
        altMob = {
            alternateMobileNo
        }
    }

    if (
        [shopName, ownerName, email, password, address, mobileNo, city].some((field) =>
            field?.trim === "")
    ) {
        res.status(400).json(new ApiResponse(400, "All fields are required"))
        throw new ApiError(400, "All fields are required")
    }

    const existedlaundry = await Laundry.findOne({
        $or: [{ mobileNo }, { email }]
    })

    if (existedlaundry) {
        res.status(400).json(new ApiResponse(400, "laundry already exists, Please Login!"))
        throw new ApiError(409, "laundry already exists, Please Login!")
    }

    //const laundryLocalPath = laundryPhotoImg;
    const laundryLocalPath = req.file?.path;

    const laundryPhoto = await uploadOnCloudinary(laundryLocalPath);

    if (!laundryPhoto) {
        res.status(400).json(new ApiResponse(400, "Error in uploading laundry file"))
        throw new ApiError(400, "Error in uploading laundry file")
    }

    const laundry = await Laundry.create({
        shopName,
        ownerName,
        email,
        password,
        address,
        shopPhoto: laundryPhoto.url,
        mobileNo,
        alternateMobileNo: altMob?.alternateMobileNo || "",
        city,
    })

    if (!laundry) {
        res.status(400).json(new ApiResponse(400, "Something went wrong while registering laundry"))
        throw new ApiError(400, "Something went wrong while registering laundry")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(laundry._id);

    const createdlaundry = await Laundry.findById(laundry._id).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(200, { laundry: createdlaundry, accessToken }, "laundry Registered Successfully")
        )

})

const loginLaundry = asyncHandler(async (req, res) => {
    //get details like laundryname or email and password from frontend
    //validate them
    //Search for laundry in db
    //check for laundry
    //Match the password
    //Access and refresh token when password is correct
    //send cookie

    const { mobileNo } = req.body
console.log("Welcome");
    if (!mobileNo) {
        throw new ApiError(400, "MobileNO is required")
    }

    const laundry = await Laundry.findOne({ mobileNo })

    if (!laundry) {
        res.status(400).json(new ApiResponse(400, "laundry doesn't exists"))
        throw new ApiError(400, "laundry doesn't exists")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(laundry._id);

    const loggedInlaundry = await Laundry.findById(laundry._id).select("-password -refreshToken");

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
                    laundry: loggedInlaundry, accessToken, refreshToken
                },
                "laundry Logged In Successfully"
            )
        )

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

    const order = await Laundry.findByIdAndUpdate(
        req.laundry._id,
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

const getOrderHistory = asyncHandler(async (req, res) => {
    //get the restaurant_id from req.restaurant
    //using mongoose aggregate filter the id from foodyOrderHistory and foodyOrders
    //check for the above data
    //return res
 
 
    const orderHistory = await Laundry.aggregate([
       [
          {
             $match: {
                _id: new mongoose.Types.ObjectId(req.laundry._id),
             },
          },
          {
             $lookup: {
                from: "laundryorders",
                localField: "OrderHistory",
                foreignField: "_id",
                as: "OrderHistory",
                pipeline: [
                   {
                      $lookup: {
                         from: "users",
                         localField: "bookedBy",
                         foreignField: "_id",
                         as: "customers"
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

 const getCurrentLaundry = asyncHandler(async (req, res) => {
    //return all info of the user in the db
    return res
       .status(200)
       .json(new ApiResponse(200, req.laundry, "User Details fetched Successfully"))
 })

 const getLaundryByCity = asyncHandler(async (req, res) => {
    const { city } = req.query;
   console.log(city);
    if (!city) {
        return res.status(400).json(new ApiError(400, "City Params is required"));
    }

    try {
        const shops = await Laundry.find({ city });

        if (shops.length === 0) {
            return res.status(404).json({ message: 'No laundry shops found in this city' });
        }

        // Select a random shop from the list
        const randomShop = shops[Math.floor(Math.random() * shops.length)];
        console.log(randomShop);
        return res
        .status(200)
        .json(new ApiResponse(200, randomShop, "LaundryShop fetched Successfully"))

    } catch (error) {
        console.error('Error fetching laundry shops:', error);
        res.status(500).json({ error: 'Server error' });
    }
 })


export {
    registerLaundry,
    loginLaundry,
    addToOrderHistory,
    getOrderHistory,
    getCurrentLaundry,
    getLaundryByCity
}