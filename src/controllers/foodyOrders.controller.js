import { FoodyOrders } from "../models/FoodyOrders.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { cancelOrder } from "./cyrCancelledRides.controller.js";
import { Rider } from "../models/Rider.model.js";

const placeOrder = asyncHandler(async (req, res)=> {

    const {riderId, userId, restaurantId} = req.params
    const {orderedFromLocation, bill, items, distance} = req.body

    if(!(riderId || userId || restaurantId)){
        throw new ApiError(400, "RiderId is required")
    }

    if (
        [orderedFromLocation, bill, items, distance].some((field) =>
           field?.trim === "")
     ) {
        res.status(400).json(new ApiResponse(400, "All fields are required"))
        throw new ApiError(400, "All fields are required")
     }

     const order = await FoodyOrders.create({
        orderedBy: new mongoose.Types.ObjectId(userId),
        rider: new mongoose.Types.ObjectId(riderId),
        restaurant: new mongoose.Types.ObjectId(restaurantId),
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
    const {orderStatus, riderEarning} = req.body

    if(!orderId){
        throw new ApiError(400, "OrderId is required")
    }

    if(!orderStatus){
        throw new ApiError(400, "OrderStatus is required")
    }

    const order = await FoodyOrders.findByIdAndUpdate(new mongoose.Types.ObjectId(orderId),
    {
        $set: {
            orderStatus: orderStatus,
            riderEarning
        }
    },{new: true})

    if(!order){
        throw new ApiError(400, "Error in updating the order Status")
    }

    //also update moneyEarnedBYRider
       // Update the rider's earnings
       if (order.rider) {
        const rider = await Rider.findById(order.rider);

        if (rider) {
            rider.moneyEarned += riderEarning;
            await rider.save();
        } else {
            throw new ApiError(404, "Rider not found");
        }
    } else {
        throw new ApiError(400, "RiderId not associated with the order");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, order, "Successfully updated OrderStatus"))


})

const updatePickupOrderStatus = asyncHandler(async (req, res)=> {

    const {orderId} = req.params
    const {orderStatus} = req.body

    if(!orderId){
        throw new ApiError(400, "OrderId is required")
    }

    if(!orderStatus){
        throw new ApiError(400, "OrderStatus is required")
    }

    const order = await FoodyOrders.findByIdAndUpdate(new mongoose.Types.ObjectId(orderId),
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

const getOrderById = asyncHandler(async (req, res)=> {
    
    const {orderId} = req.params

    if(!orderId){
        throw new ApiError(400, "orderId is required")
    }

    const order = await FoodyOrders.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(orderId)
            }
        },
        {
            $lookup: {
              from: "users",
              localField: "orderedBy",
              foreignField: "_id",
              as: "User",
            }
        },
        {
            $lookup: {
              from: "restaurants",
              localField: "restaurant",
              foreignField: "_id",
              as: "Restaurant",
            }
        },
        {
            $lookup: {
              from: "riders",
              localField: "rider",
              foreignField: "_id",
              as: "Rider",
            }
        }
    ])

    if(!order?.length){
        throw new ApiError(400, "Error in fectching the order")
    }

    console.log(order);

    return res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched Successfully"))
})

const getUndeliveredOrders = asyncHandler(async (req, res)=> {
    try {
        const orders = await FoodyOrders.find({
          rider: req.rider._id,
          orderStatus: { $ne: 'Delivered' }
        });
        res.status(200).json(orders);
      } catch (error) {
        res.status(500).json({ error: 'Server Error' });
      }
})


export {
    placeOrder,
    updateOrderStatus,
    updatePickupOrderStatus,
    getOrderById,
    getUndeliveredOrders
}