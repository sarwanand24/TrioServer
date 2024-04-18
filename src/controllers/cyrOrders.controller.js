import { CYROrders } from "../models/CYROrders.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const placeOrder = asyncHandler(async (req, res)=> {

    const {riderId, userId} = req.params
    const {fromLocation, toLocation, bill, distance} = req.body

    if(!(riderId || userId)){
        throw new ApiError(400, "RiderId is required")
    }

    if (
        [fromLocation, bill, distance, toLocation].some((field) =>
           field?.trim === "")
     ) {
        res.status(400).json(new ApiResponse(400, "All fields are required"))
        throw new ApiError(400, "All fields are required")
     }

     const order = await CYROrders.create({
        bookedBy: new mongoose.Types.ObjectId(userId),
        rider: new mongoose.Types.ObjectId(riderId),
        fromLocation,
        toLocation,
        bill,
        distance
     })

     if(!order){
        throw new ApiError(400, "Error in creating order")
     }

     return res
     .status(200)
     .json(new ApiResponse(200, order, "Successfully created order"))
})

const updateOrderStatus = asyncHandler(async (req, res)=> {

    const {orderId} = req.params
    const {rideStatus} = req.body

    if(!orderId){
        throw new ApiError(400, "OrderId is required")
    }

    if(!rideStatus){
        throw new ApiError(400, "RideStatus is required")
    }

    const order = await CYROrders.findByIdAndUpdate(new mongoose.Types.ObjectId(orderId),
    {
        $set: {
            rideStatus: rideStatus
        }
    },{new: true})

    if(!order?.length){
        throw new ApiError(400, "Error in updating the order Status")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, order, "Successfully updated OrderStatus"))


})

const getOrderById = asyncHandler(async (req, res)=> {
    
    const {orderId} = req.params

    if(!orderId){
        throw new ApiError(400, "orderId is required")
    }

    const order = await CYROrders.find(new mongoose.types.ObjectId(orderId))

    if(!order?.length){
        throw new ApiError(400, "Error in fectching the order")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched Successfully"))
})


export {
    placeOrder,
    updateOrderStatus,
    getOrderById
}