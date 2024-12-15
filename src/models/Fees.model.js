import mongoose, { Schema } from "mongoose";

const feesSchema = new Schema(
    {
       deliveryFeeBike: {
        type: Number,
        default: 10.5
       },
       deliveryFeeCar: {
        type: Number,
        default: 35
       },
       deliveryFeeToto: {
        type: Number,
        default: 25
       },
       convinientFee: {
        type: Number,
        default: 15
       },
       restroGst: {
        type: Number,
        default: 12
       },
       hotelGst: {
        type: Number,
        default: 12
       }
    },{timestamps: true}
)

export const Fees = mongoose.model("Fees", feesSchema)