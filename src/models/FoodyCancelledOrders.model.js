import mongoose, { Schema } from "mongoose";

const foodyCancelledOrdersSchema = new Schema(
    {
        restaurant: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant"
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        orderedFromLocation: {
            type: String,
            required: true
        },
        items: {
            type: Array,
            required: true
    },
        orderStatus: {
            type: String
        },
        bill: {
            type: Number,
            required: true
        },
        restroEarning: {
            type: Number,
            required: true
        },
        reason: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
)

export const FoodyCancelledOrders = mongoose.model("FoodyCancelledOrders", foodyCancelledOrdersSchema)