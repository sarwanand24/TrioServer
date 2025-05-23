import mongoose, { Schema } from "mongoose";

const foodyOrdersSchema = new Schema(
    {
        orderedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        restaurant: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant"
        },
        rider: {
            type: Schema.Types.ObjectId,
            ref: "Rider"
        },
        orderedFromLocation: {
            type: String,
        },
        items: {
            type: Array,
            required: true
        },
        orderStatus: {
            type: String,
            default: 'Your order is getting prepared in the restaurant'
        },
        bill: {
            type: Number,
            required: true
        },
        distance: {
            type: String
        },
        riderEarning: {
            type: Number,
        },
        restroEarning: {
            type: Number,
        },
        savings: {
            type: Number,
            default: 0
        },
        otp: {
            type: Number
        }
    },
    { timestamps: true }
)

export const FoodyOrders = mongoose.model("FoodyOrders", foodyOrdersSchema)