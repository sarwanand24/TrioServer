import mongoose, { Schema } from "mongoose";

const favouriteFoodsSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        foodItem: {
            type: String,
            required: true
        },
        foodImg: {
            type: String
        },
        restaurant: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant"
        }
    }
)

export const FavouriteFoods = mongoose.model("FavouriteFoods", favouriteFoodsSchema)