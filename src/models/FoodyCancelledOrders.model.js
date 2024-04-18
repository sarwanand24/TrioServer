import mongoose, { Schema } from "mongoose";

const foodyCancelledOrdersSchema = new Schema(
    {
        cancelledBy: {
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
            required: true
        },
        items: [{
            type: String,
            required: true
        }],
        orderStatus: {
            type: String
        },
        bill: {
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