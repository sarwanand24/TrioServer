import mongoose, { Schema } from "mongoose";

const cyrRatingSchema = new Schema(
    {
     rider: {
        type: Schema.Types.ObjectId,
        ref: "Rider"
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

export const CYRRating = mongoose.model("CYRRating", cyrRatingSchema)