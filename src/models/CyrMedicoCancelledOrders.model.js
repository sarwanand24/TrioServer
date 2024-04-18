import mongoose, { Schema } from "mongoose";

const cyrMedicoCancelledOrdersSchema = new Schema(
    {
        cancelledBy: {
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
        reason: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
)

export const CyrMedicoCancelledOrders = mongoose.model("CyrMedicoCancelledOrders", cyrMedicoCancelledOrdersSchema)