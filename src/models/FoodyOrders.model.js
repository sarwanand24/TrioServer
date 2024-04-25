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
        distance: {
            type: String
        }
    },
    { timestamps: true }
)

export const FoodyOrders = mongoose.model("FoodyOrders", foodyOrdersSchema)