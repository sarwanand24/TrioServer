import mongoose, { Schema } from "mongoose";

const laundryOrdersSchema = new Schema(
    {
        orderedBy: {
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
            default: 'home',
            required: true
        },
        toLocation: {
            type: String,
            required: true
        },
        orderStatus: {
            type: String,
            default: "Preparing"
        },
        bill: {
            type: Number,
            // required: true
        },
        items: [{
            type: String,
        }],
        distance: {
            type: String,
            // required: true
        },
        rating: {
            type: Number
        },
        feedback: {
            type: String
        }
    },
    { timestamps: true }
)

export const LaundryOrders = mongoose.model("LaundryOrders", laundryOrdersSchema)