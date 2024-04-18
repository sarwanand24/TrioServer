import mongoose, { Schema } from "mongoose";

const cyrMedicoRatingSchema = new Schema(
    {
     medical: {
        type: Schema.Types.ObjectId,
        ref: "Medical"
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

export const CyrMedicoRating = mongoose.model("CyrMedicoRating", cyrMedicoRatingSchema)