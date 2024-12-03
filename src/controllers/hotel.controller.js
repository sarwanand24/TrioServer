import { Hotel } from "../models/Hotel.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { HotelOrders } from "../models/HotelOrders.model.js";
import axios from 'axios';

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
    const { email, otp } = req.body
    console.log('entryyyy', email, otp)
    if (!(email && otp)) {
       throw new ApiError(400, "email or otp is required")
    }
 
    const hotel = await Hotel.find({ email })
   console.log('hotel', hotel)
    if (!hotel) {
       res.status(400).json(new ApiResponse(400, "hotel doesn't exists"))
       throw new ApiError(400, "hotel doesn't exists")
    }
 
    const BREVO_API_KEY = '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';
 
    try {
       const response = await axios.post(
          'https://api.brevo.com/v3/smtp/email',
          {
            sender: { name: "Nikhil Dhamgay", email: "nikhildhamgay200424@gmail.com" },
            to: [{ email: email }],
            subject: "Welcome to Tiofy Hotel",
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
        if (error.response) {
            // Server responded with a status code outside the 2xx range
            console.error('Error Response:', error.response.data);
        } else if (error.request) {
            // No response received from the server
            console.error('No Response:', error.request);
        } else {
            // Something else went wrong in making the request
            console.error('Error Message:', error.message);
        }
    }
    
 
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(hotel[0]._id);
 
    const loggedInhotel = await Hotel.findById(hotel[0]._id).select("-password -refreshToken");
 
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
                Hotel: loggedInhotel, accessToken, refreshToken
             },
             "hotel Logged In Successfully"
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

const getOrderHistory = asyncHandler(async (req, res) => {
    //get the restaurant_id from req.restaurant
    //using mongoose aggregate filter the id from foodyOrderHistory and foodyOrders
    //check for the above data
    //return res
    try {
        console.log('entryyyy in orders')
        const { hotelId } = req.params; // Assuming hotelId is passed as a route param
        const bookings = await HotelOrders.find({ hotel: new mongoose.Types.ObjectId(hotelId)})
          .populate('bookedBy', 'fullName email mobileNo address') // Populate user details
          .populate('hotel', 'hotelName') // Optional: Populate hotel details
          .exec();

          const totalEarnings = bookings.reduce((sum, booking) => sum + booking.bill, 0);
             
          console.log(bookings, totalEarnings)
          res.status(200).json({
            success: true,
            data: bookings,
            totalEarnings,
            message: 'Booking history fetched successfully',
          });
      
      } catch (error) {
        console.error('Error fetching booking history:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
 
 })

 const toggleRoomStatus = asyncHandler(async (req, res)=> {

      const {isRoomFull} = req.body;
      console.log(isRoomFull);

      if(isRoomFull === ''){
        throw new ApiError(401, "Didnt got the status from frontend")
      }

      const status = await Hotel.findByIdAndUpdate( 
        req.hotel._id,

        {
            $set: {
                isRoomFull: isRoomFull
            }
        },{new: true}
      )

      if(!status){
        throw new ApiError(401, "Error in updating room status")
      }

      return res
      .status(200)
      .json(new ApiResponse(200, status, "Successfully toggles Room Status"))

 })

 const getCurrentHotel = asyncHandler(async (req, res) => {
    //return all info of the user in the db
    return res
       .status(200)
       .json(new ApiResponse(200, req.hotel, "User Details fetched Successfully"))
 })

 const updateHotelData = asyncHandler(async (req, res) => {
    try {
        const { hotelId } = req.params;
        const updatedData = req.body;
    
        const updatedHotel = await Hotel.findByIdAndUpdate(hotelId, updatedData, {
          new: true,
        });
    
        if (!updatedHotel) {
          return res.status(404).json({ success: false, message: "Hotel not found" });
        }
    
        res.status(200).json({ success: true, hotel: updatedHotel });
      } catch (error) {
        console.error("Error updating hotel:", error);
        res.status(500).json({ success: false, message: "Server error" });
      }
 })


export {
    registerHotel,
    loginHotel,
    addToOrderHistory,
    getOrderHistory,
    toggleRoomStatus,
    getCurrentHotel,
    updateHotelData
}