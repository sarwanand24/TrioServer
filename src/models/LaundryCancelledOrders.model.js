import mongoose, { Schema } from "mongoose";

const laundryCancelledOrdersSchema = new Schema(
    {
        cancelledBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        shopName: {
            type: Schema.Types.ObjectId,
            ref: 'Laundry'
        },
        rider: {
            type: Schema.Types.ObjectId,
            ref: "Rider"
        },
        fromLocation: {
            type: String,
            required: true
        },
        toLocation: {
            type: String,
            required: true
        },
        orderStatus: {
            type: String,
            default: "Cancelled"
        },
        bill: {
            type: Number,
            required: true
        },
        items: [{
            type: String,
            required: true
        }],
        distance: {
            type: String,
            required: true
        },
        reason: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
)

export const LaundryCancelledOrders = mongoose.model("LaundryCancelledOrders", laundryCancelledOrdersSchema)