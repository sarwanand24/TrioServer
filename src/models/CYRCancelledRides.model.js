import mongoose, { Schema } from "mongoose";

const cyrCancelledRidesSchema = new Schema(
    {
        cancelledBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
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
        rideStatus: {
            type: String
        },
        bill: {
            type: Number,
            required: true
        },
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

export const CYRCancelledRides = mongoose.model("CYRCancelledRides", cyrCancelledRidesSchema)