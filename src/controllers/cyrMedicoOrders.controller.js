import { CyrMedicoOrders } from "../models/CyrMedicoOrders.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const placeOrder = asyncHandler(async (req, res)=> {

    const {riderId, userId, medicalId} = req.params
    const {orderedFromLocation, bill, items, distance} = req.body

    if(!(riderId || userId || medicalId)){
        throw new ApiError(400, "RiderId is required")
    }

    if (
        [orderedFromLocation, bill, items, distance].some((field) =>
           field?.trim === "")
     ) {
        res.status(400).json(new ApiResponse(400, "All fields are required"))
        throw new ApiError(400, "All fields are required")
     }

     const order = await CyrMedicoOrders.create({
        orderedBy: new mongoose.Types.ObjectId(userId),
        rider: new mongoose.Types.ObjectId(riderId),
        medical: new mongoose.Types.ObjectId(medicalId),
        orderedFromLocation,
        bill,
        items,
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
    const {orderStatus} = req.body

    if(!orderId){
        throw new ApiError(400, "OrderId is required")
    }

    if(!orderStatus){
        throw new ApiError(400, "OrderStatus is required")
    }

    const order = await CyrMedicoOrders.findByIdAndUpdate(new mongoose.Types.ObjectId(orderId),
    {
        $set: {
            orderStatus: orderStatus
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

    const order = await CyrMedicoOrders.find(new mongoose.types.ObjectId(orderId))

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