import mongoose, { Schema } from "mongoose";

const cyrOrdersSchema = new Schema(
    {
        bookedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        rider: {
            type: Schema.Types.ObjectId,
            ref: "Rider"
        },
        fromLocation: {
            type: Object,
            required: true
        },
        toLocation: {
            type: Object,
            required: true
        },
        rideStatus: {
            type: String,
            default: 'Rider is on the way'
        },
        bill: {
            type: Number,
            required: true
        },
        distance: {
            type: String,
            required: true
        },
        otp: {
            type: Number
        },
        riderEarning: {
            type: Number
        }
    },
    { timestamps: true }
)

export const CYROrders = mongoose.model("CYROrders", cyrOrdersSchema)