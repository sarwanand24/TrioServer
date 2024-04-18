import mongoose, { Schema } from "mongoose";

const cyrMedicoOrdersSchema = new Schema(
    {
        orderedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        medical: {
            type: Schema.Types.ObjectId,
            ref: "Medical"
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
        distance: {
            type: String
        }
    },
    { timestamps: true }
)

export const CyrMedicoOrders = mongoose.model("CyrMedicoOrders", cyrMedicoOrdersSchema)