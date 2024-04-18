import { CYRCancelledRides } from "../models/CYRCancelledRides.model.js"
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { CYROrders } from "../models/CYROrders.model.js";

const cancelOrder = asyncHandler(async (req, res)=> {

    const {orderId} = req.params
    const {reason} = req.body

    if(!orderId){
        throw new ApiError(400, "orderId is required")
    }

    if(!reason){
        throw new ApiError(400, "Reason is mandatory")
    }

    const order = await CYROrders.findByIdAndUpdate(new mongoose.Types.ObjectId(orderId),
    {
        $set: {
            rideStatus: "Cancelled"
        }
    },{new: true})
console.log(order);
    if(!order){
        throw new ApiError(400, "Error in fetching the order")
    }

    const cancelOrder = await CYRCancelledRides.create({
        cancelledBy: new mongoose.Types.ObjectId(order.bookedBy),
        rider: new mongoose.Types.ObjectId(order.rider),
        fromLocation: order.fromLocation,
        toLocation: order.toLocation,
        bill: order.bill,
        reason: reason,
        distance: order.distance
    })

    if(!cancelOrder){
        throw new ApiError(400, "Error in Cancelling Order")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, cancelOrder, "Successfully Cancelled Order"))

})

const getCancelledOrderById = asyncHandler(async (req, res)=> {

    const {orderId} = req.params

    if(!orderId){
        throw new ApiError(400, "orderId is required")
    }

    const order = await CYRCancelledRides.find(new mongoose.types.ObjectId(orderId))

    if(!order){
        throw new ApiError(400, "Error in fectching the order")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched Successfully"))

})


export {
    cancelOrder,
    getCancelledOrderById
}