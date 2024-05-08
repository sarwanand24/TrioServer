import { Hotel } from "../models/Hotel.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async (hotelId) => {
    try {
        const hotel = await Hotel.findById(hotelId)
        const accessToken = hotel.generateAccessToken();
        const refreshToken = hotel.generateRefreshToken();

        hotel.refreshToken = refreshToken;
        await hotel.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Refresh and Access Token");
    }
}

const registerHotel = asyncHandler(async (req, res) => {
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

    const { hotelName, ownerName, email, password, address, mobileNo, alternateMobileNo,
        hotelPhotoImg, checkInTime, checkOutTime, price, isCoupleStayAllowed, isFamilyStayAllowed, city } = req.body;

    let altMob;
    if (alternateMobileNo?.length) {
        altMob = {
            alternateMobileNo
        }
    }

    if (
        [hotelName, ownerName, email, password, address, mobileNo, checkInTime, checkOutTime, price, isCoupleStayAllowed, isFamilyStayAllowed, city].some((field) =>
            field?.trim === "")
    ) {
        res.status(400).json(new ApiResponse(400, "All fields are required"))
        throw new ApiError(400, "All fields are required")
    }

    const existedHotel = await Hotel.findOne({
        $or: [{ mobileNo }, { email }]
    })

    if (existedHotel) {
        res.status(400).json(new ApiResponse(400, "Hotel already exists, Please Login!"))
        throw new ApiError(409, "Hotel already exists, Please Login!")
    }

    //const HotelLocalPath = HotelPhotoImg;
    const HotelLocalPath = req.file?.path;

    const hotelPhoto = await uploadOnCloudinary(HotelLocalPath);

    if (!hotelPhoto) {
        res.status(400).json(new ApiResponse(400, "Error in uploading Hotel file"))
        throw new ApiError(400, "Error in uploading Hotel file")
    }

    const hotel = await Hotel.create({
        hotelName,
        ownerName,
        email,
        password,
        address,
        hotelPhoto: hotelPhoto.url,
        mobileNo,
        alternateMobileNo: altMob?.alternateMobileNo || "",
        checkInTime,
        checkOutTime,
        isCoupleStayAllowed,
        isFamilyStayAllowed,
        city,
        price
    })

    if (!hotel) {
        res.status(400).json(new ApiResponse(400, "Something went wrong while registering Hotel"))
        throw new ApiError(400, "Something went wrong while registering Hotel")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(hotel._id);

    const createdHotel = await Hotel.findById(hotel._id).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(200, { Hotel: createdHotel, accessToken }, "Hotel Registered Successfully")
        )

})

const loginHotel = asyncHandler(async (req, res) => {
    //get details like Hotelname or email and password from frontend
    //validate them
    //Search for Hotel in db
    //check for Hotel
    //Match the password
    //Access and refresh token when password is correct
    //send cookie

    const { mobileNo } = req.body

    if (!mobileNo) {
        throw new ApiError(400, "MobileNO is required")
    }

    const hotel = await Hotel.findOne({ mobileNo })

    if (!hotel) {
        res.status(400).json(new ApiResponse(400, "Hotel doesn't exists"))
        throw new ApiError(400, "Hotel doesn't exists")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(hotel._id);

    const loggedInHotel = await Hotel.findById(hotel._id).select("-password -refreshToken");

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
                    Hotel: loggedInHotel, accessToken, refreshToken
                },
                "Hotel Logged In Successfully"
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

    const order = await Hotel.findByIdAndUpdate(
        req.hotel._id,
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


export {
    registerHotel,
    loginHotel,
    addToOrderHistory
}