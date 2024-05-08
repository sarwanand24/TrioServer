import { HotelOrders } from "../models/HotelOrders.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const placeOrder = asyncHandler(async (req, res)=> {

    const {userId, hotelId} = req.params
    const {bill, totalPerson} = req.body

    if(!(userId || hotelId)){
        throw new ApiError(400, "RiderId is required")
    }

    if (
        [bill, totalPerson].some((field) =>
           field?.trim === "")
     ) {
        res.status(400).json(new ApiResponse(400, "All fields are required"))
        throw new ApiError(400, "All fields are required")
     }

     const order = await HotelOrders.create({
        bookedBy: new mongoose.Types.ObjectId(userId),
        hotel: new mongoose.Types.ObjectId(hotelId),
        bill,
        totalPerson
     })

     if(!order){
        throw new ApiError(400, "Error in creating order")
     }

     return res
     .status(200)
     .json(new ApiResponse(200, order, "Successfully created order"))
})


export {
    placeOrder,
}