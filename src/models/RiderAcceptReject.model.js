import mongoose, { Schema } from "mongoose";

const riderAcceptRejectSchema = new Schema(
    {
        riderId: {
            type: Schema.Types.ObjectId,
            ref: "Rider"
        },
        restaurantName: {
            type: String
        },
        restaurantAddress: {
            type: String
        },
        userDeviceToken: {
            type: String
        },
        restroDeviceToken: {
            type: String
        },
        userAddress: {
            type: String
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant"
        },
        bill: {
            type: "Number"
        },
        foodItems: {
            type: Array
        },
        totalItems: {
            type: Number
        },
        fromLocation: {
            type: String,
        },
        toLocation: {
            type: String,
        },
        distance: {
            type: String,
        },
        city: {
            type: String
        },
        status: {
            type: Boolean,
            default: false
        },
        restroEarning: {
            type: Number,
            default: 0
        },
        riderEarning: {
            type: Number,
            default: 0
        },
        orderOf: {
            type: String,
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'FoodyOrders'
        }
    },
    { timestamps: true })

export const RiderAcceptReject = new mongoose.model("RiderAcceptReject", riderAcceptRejectSchema);