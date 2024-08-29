import { FoodyCancelledOrders } from "../models/FoodyCancelledOrders.model.js"
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { FoodyOrders } from "../models/FoodyOrders.model.js";

const cancelOrder = asyncHandler(async (req, res)=> {

    const {orderId} = req.params
    const {reason} = req.body

    if(!orderId){
        throw new ApiError(400, "orderId is required")
    }

    if(!reason){
        throw new ApiError(400, "Reason is mandatory")
    }

    const order = await FoodyOrders.findByIdAndUpdate(new mongoose.Types.ObjectId(orderId),
    {
        $set: {
            orderStatus: "Cancelled"
        }
    },{new: true})

    if(!order){
        throw new ApiError(400, "Error in fetching the order")
    }

    const cancelOrder = await FoodyCancelledOrders.create({
        cancelledBy: new mongoose.Types.ObjectId(order.orderedBy),
        rider: new mongoose.Types.ObjectId(order.rider),
        restaurant: new mongoose.Types.ObjectId(order.restaurant),
        orderedFromLocation: order.orderedFromLocation,
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

    const {orderId} = req.params

    if(!orderId){
        throw new ApiError(400, "orderId is required")
    }

    const order = await FoodyCancelledOrders.find(new mongoose.Types.ObjectId(orderId))

    if(!order?.length){
        throw new ApiError(400, "Error in fectching the order")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched Successfully"))

})

const getAllCancelledOrdersForRestaurant = asyncHandler(async (req, res) => {
    try {
        const cancelledOrders = await FoodyCancelledOrders.find({ restaurant: req.restaurant._id })
            .populate('restaurant')
            .populate('user')
            .sort({ createdAt: -1 }); // Sort by most recent dates
        
        res.status(200).json(cancelledOrders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cancelled orders', error });
    }
})

export {
    cancelOrder,
    getCancelledOrderById,
    getAllCancelledOrdersForRestaurant
}