import mongoose, { Schema } from "mongoose";

const restroAcceptRejectSchema = new Schema(
    {
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant"
        },
        foodItems: {
            type: Array
        },
        totalItems: {
            type: Number
        },
        userDeviceToken: {
            type: String
        },
        userSocket: {
            type: String
        },
        userAddress: {
            type: String
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        bill: {
            type: "Number"
        },
        status: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true })

export const RestroAcceptReject = new mongoose.model("RestroAcceptReject", restroAcceptRejectSchema);