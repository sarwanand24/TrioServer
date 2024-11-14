import { HotelOrders } from "../models/HotelOrders.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Hotel } from "../models/Hotel.model.js";
import { User } from "../models/User.model.js";

const placeOrder = asyncHandler(async (req, res)=> {
console.log('Entered');
    const {userId, hotelId} = req.params
    const {bill, totalPerson, rooms, dates, orderType, slotTiming} = req.body

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
        totalPerson,
        rooms,
        dates,
        orderType,
        slotTiming: slotTiming || null,
     })

     if(!order){
        throw new ApiError(400, "Error in creating order")
     }

     const order2 = await Hotel.findByIdAndUpdate(
      hotelId,
      {
          $push: {
              OrderHistory: new mongoose.Types.ObjectId(order._id)
          }
      },
      {
          new: true
      })

  if (!order2) {
      throw new ApiError(400, "Error in adding order history of hotel")
  }

  const order3 = await User.findByIdAndUpdate(
   userId,
   {
      $push: {
         hotelOrderHistory: new mongoose.Types.ObjectId(order._id)
      }
   },
   {
      new: true
   })

if (!order3) {
   throw new ApiError(400, "Error in adding order history of user")
}


     return res
     .status(200)
     .json(new ApiResponse(200, order, "Successfully created order"))
})


export {
    placeOrder,
}