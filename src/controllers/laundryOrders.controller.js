import { LaundryOrders } from "../models/LaundryOrders.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Laundry } from "../models/Laundry.model.js";
import mongoose from "mongoose";

const placeOrder = asyncHandler(async (req, res) => {
    //get the user_id from req.user
    //get the rider_id from params
    //get fromLocation, toLocation, bill, items and distance from req.body
    //validate them all
    //create entry in db 
    //return res

    const {riderId, shopId, userId} = req.params
    const {fromLocation, toLocation} = req.body

    console.log(riderId, shopId, userId, fromLocation, toLocation);

    if(!(riderId || userId)){
        throw new ApiError(400, "RiderId is required")
    }

    if (
        [fromLocation, toLocation].some((field) =>
           field?.trim === "")
     ) {
        res.status(400).json(new ApiResponse(400, "All fields are required"))
        throw new ApiError(400, "All fields are required")
     }

     const order = await LaundryOrders.create({
        orderedBy: new mongoose.Types.ObjectId(userId),
        rider: new mongoose.Types.ObjectId(riderId),
        shopName: new mongoose.Types.ObjectId(shopId),
        fromLocation,
        toLocation
     })

     console.log(order);

     if(!order){
        throw new ApiError(400, "Error in creating Laundry Order")
     }

       // Find the laundry shop and update OrderHistory
       await Laundry.findByIdAndUpdate(shopName, {
        $push: { OrderHistory: order._id }
    });

    res.status(201).json({ message: 'Laundry order created successfully', order: order });

     if(!order){
        throw new ApiError(400, "Error in creating order")
     }

     return res
     .status(200)
     .json(new ApiResponse(200, order, "Successfully created order"))

})

const updateOrderStatus = asyncHandler(async (req, res) => {
    //get the order_id from params and validate it
    //update the order status in the db and validate
    //return res

    const {orderId} = req.params
    const {orderStatus} = req.body

    if(!orderId){
        throw new ApiError(400, "OrderId is required")
    }

    if(!orderStatus){
        throw new ApiError(400, "OrderStatus is required")
    }

    const order = await LaundryOrders.findByIdAndUpdate(new mongoose.Types.ObjectId(orderId),
    {
        $set: {
            orderStatus: orderStatus
        }
    },{new: true})

    if(!order){
        throw new ApiError(400, "Error in updating the order Status")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, order, "Successfully updated OrderStatus"))

})

const getOrderById = asyncHandler(async (req, res) => {
    //get the order_id from params and validate it
    //return res

    const {orderId} = req.params

    if(!orderId){
        throw new ApiError(400, "orderId is required")
    }

    const order = await LaundryOrders.find(new mongoose.Types.ObjectId(orderId))

    if(!order){
        throw new ApiError(400, "Error in fectching the order")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched Successfully"))

})

const giveRatingandFeedback = asyncHandler(async (req, res) => {
    //get rating and feedback from req.body
    //validate it
    //update in db and validate
    //return res

    const {orderId} = req.params
    const {rating, feedback} = req.body

    if(!orderId){
        throw new ApiError(400, "orderId is required")
    }
    console.log(rating, feedback);
    if(!rating){
        throw new ApiError(400, "Rating is required")
    }

    const order = await LaundryOrders.findByIdAndUpdate(new mongoose.Types.ObjectId(orderId),
    {
        $set: {
            rating: rating,
            feedback: feedback
        }
    },
    {
        new: true
    })

    if(!order){
        throw new ApiError("Error in adding ratings and feedback to the order")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, order, "Successfully added ratings and feedback to the order"))

})


export {
    placeOrder,
    updateOrderStatus,
    getOrderById,
    giveRatingandFeedback
}