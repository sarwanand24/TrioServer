import mongoose, { Schema } from "mongoose";

const hotelRatingSchema = new Schema(
    {
     hotel: {
        type: Schema.Types.ObjectId,
        ref: "Hotel"
     },
     ratedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
     },
     rating: {
        type: Number
     },
     feedback: {
        type: String
     }
    },
    {timestamps: true}
)

export const HotelRating = mongoose.model("HotelRating", hotelRatingSchema)