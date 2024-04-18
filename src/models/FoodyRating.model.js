import mongoose, { Schema } from "mongoose";

const foodyRatingSchema = new Schema(
    {
     restaurant: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant"
     },
     ratedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
     },
     rating: {
        type: Number,
        required: true
     },
     feedback: {
        type: String
     }
    },
    {timestamps: true}
)

export const FoodyRating = mongoose.model("FoodyRating", foodyRatingSchema)