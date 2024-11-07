import { CYROrders } from "../models/CYROrders.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Rider } from "../models/Rider.model.js";

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

const updateOrderStatus = asyncHandler(async (req, res) => {

    const { orderId } = req.params
    const { rideStatus, riderEarning } = req.body

    if (!orderId) {
        throw new ApiError(400, "OrderId is required")
    }

    if (!rideStatus) {
        throw new ApiError(400, "OrderStatus is required")
    }

    const order = await CYROrders.findById(orderId);

    if (order) {
        const savings = 0;

        const updatedOrder = await CYROrders.findByIdAndUpdate(
            new mongoose.Types.ObjectId(orderId),
            {
                $set: {
                    orderStatus: rideStatus,
                    riderEarning: riderEarning,
                    savings: savings
                }
            },
            { new: true }
        );

        if (!updatedOrder) {
            throw new ApiError(400, "Error in updating the order Status")
        }
    
        //also update moneyEarnedBYRider
        // Update the rider's earnings
        if (updatedOrder.rider) {
            const rider = await Rider.findById(updatedOrder.rider);
    
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
            .json(new ApiResponse(200, updatedOrder, "Successfully updated OrderStatus"))

    }
    else {
        throw new Error('Order not found');
    }

})

const updatePickupOrderStatus = asyncHandler(async (req, res)=> {

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

     const order = await CYROrders.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(orderId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "bookedBy",
                foreignField: "_id",
                as: "User",
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
    ]);

    if(!order?.length){
        throw new ApiError(400, "Error in fectching the order")
    }

    const orderData = order[0];

    return res
    .status(200)
    .json(new ApiResponse(200, orderData, "Order fetched Successfully"))
})

const getRiderUndeliveredOrders = asyncHandler(async (req, res) => {
    try {
        const orders = await CYROrders.find({
            rider: req.rider._id,
            rideStatus: { $ne: 'Delivered' }
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
})

const getUserUndeliveredOrders = asyncHandler(async (req, res) => {
    try {
        const orders = await CYROrders.find({
            bookedBy: req.user._id,
            rideStatus: { $ne: 'Delivered' }
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
})


export {
    placeOrder,
    updatePickupOrderStatus,
    getOrderById,
    updateOrderStatus,
    getRiderUndeliveredOrders,
    getUserUndeliveredOrders
}