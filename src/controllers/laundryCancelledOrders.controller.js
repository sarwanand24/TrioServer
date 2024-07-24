import { LaundryCancelledOrders } from "../models/LaundryCancelledOrders.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { LaundryOrders } from "../models/LaundryOrders.model.js";

const cancelOrder = asyncHandler(async (req, res)=> {
    //get order_id from params
    //get the other details from the db using order_id
    //get the reason from the req.body
    //create entry in the db and change the orderStatus in the LaundryOrders db and validate
    //return res

    const {orderId} = req.params
    const {reason} = req.body
console.log(reason);
    if(!orderId){
        throw new ApiError(400, "orderId is required")
    }

    if(!reason){
        throw new ApiError(400, "Reason is mandatory")
    }

    const order = await LaundryOrders.findByIdAndUpdate(new mongoose.Types.ObjectId(orderId),
    {
        $set: {
            orderStatus: "Cancelled"
        }
    },
    {new: true})

    if(!order){
        throw new ApiError(400, "Error in fetching the order")
    }

    console.log(order);

    const cancelOrder = await LaundryCancelledOrders.create({
        cancelledBy: new mongoose.Types.ObjectId(order.orderedBy),
        rider: new mongoose.Types.ObjectId(order.rider),
        fromLocation: order.fromLocation,
        toLocation: order.toLocation,
        bill: order.bill,
        items: order.items,
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
    //get the order_id from params and validate it
    //return res

    
    const {orderId} = req.params

    if(!orderId){
        throw new ApiError(400, "orderId is required")
    }

    const order = await LaundryCancelledOrders.find(new mongoose.Types.ObjectId(orderId))

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