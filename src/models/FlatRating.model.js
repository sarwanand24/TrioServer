import mongoose, { Schema } from "mongoose";

const flatRatingSchema = new Schema(
    {
     flat: {
        type: Schema.Types.ObjectId,
        ref: "Flat"
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

export const FlatRating = mongoose.model("FlatRating", flatRatingSchema)