import { Flat } from "../models/Flat.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async (flatId) => {
    try {
        const flat = await Flat.findById(flatId)
        const accessToken = flat.generateAccessToken();
        const refreshToken = flat.generateRefreshToken();

        flat.refreshToken = refreshToken;
        await flat.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Refresh and Access Token");
    }
}

const registerFlat = asyncHandler(async (req, res) => {
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

    const { flatName, ownerName, email, password, address, mobileNo, alternateMobileNo,
        flatPhotoImg, price, city } = req.body;

    let altMob;
    if (alternateMobileNo?.length) {
        altMob = {
            alternateMobileNo
        }
    }

    if (
        [flatName, ownerName, email, password, address, mobileNo, price, city].some((field) =>
            field?.trim === "")
    ) {
        res.status(400).json(new ApiResponse(400, "All fields are required"))
        throw new ApiError(400, "All fields are required")
    }

    const existedflat = await Flat.findOne({
        $or: [{ mobileNo }, { email }]
    })

    if (existedflat) {
        res.status(400).json(new ApiResponse(400, "flat already exists, Please Login!"))
        throw new ApiError(409, "flat already exists, Please Login!")
    }

    //const flatLocalPath = flatPhotoImg;
    const flatLocalPath = req.file?.path;

    const flatPhoto = await uploadOnCloudinary(flatLocalPath);

    if (!flatPhoto) {
        res.status(400).json(new ApiResponse(400, "Error in uploading flat file"))
        throw new ApiError(400, "Error in uploading flat file")
    }

    const flat = await Flat.create({
        flatName,
        ownerName,
        email,
        password,
        address,
        flatPhoto: flatPhoto.url,
        mobileNo,
        alternateMobileNo: altMob?.alternateMobileNo || "",
        city,
        price
    })

    if (!flat) {
        res.status(400).json(new ApiResponse(400, "Something went wrong while registering flat"))
        throw new ApiError(400, "Something went wrong while registering flat")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(flat._id);

    const createdflat = await Flat.findById(flat._id).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(200, { flat: createdflat, accessToken }, "flat Registered Successfully")
        )

})

const loginFlat = asyncHandler(async (req, res) => {
    //get details like flatname or email and password from frontend
    //validate them
    //Search for flat in db
    //check for flat
    //Match the password
    //Access and refresh token when password is correct
    //send cookie

    const { mobileNo } = req.body

    if (!mobileNo) {
        throw new ApiError(400, "MobileNO is required")
    }

    const flat = await flat.findOne({ mobileNo })

    if (!flat) {
        res.status(400).json(new ApiResponse(400, "flat doesn't exists"))
        throw new ApiError(400, "flat doesn't exists")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(flat._id);

    const loggedInflat = await flat.findById(flat._id).select("-password -refreshToken");

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
                    flat: loggedInflat, accessToken, refreshToken
                },
                "flat Logged In Successfully"
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

    const order = await Flat.findByIdAndUpdate(
        req.flat._id,
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
    registerFlat,
    loginFlat,
    addToOrderHistory
}