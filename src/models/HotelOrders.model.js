import mongoose, { Schema } from "mongoose";

const hotelOrdersSchema = new Schema(
    {
        bookedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        hotel: {
            type: Schema.Types.ObjectId,
            ref: "Hotel"
        },
        bill: {
            type: Number,
            required: true
        },
        totalPerson: {
            type: Number
        },
        rooms: {
            type: Number
        },
        dates: {
            type: Object
        },
        orderType: {
            type: "String"
        },
        slotTiming: {
            type: Object
        }
    },
    { timestamps: true }
)

export const HotelOrders = mongoose.model("HotelOrders", hotelOrdersSchema)