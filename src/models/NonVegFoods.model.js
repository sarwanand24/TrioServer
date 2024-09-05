import mongoose, { Schema } from "mongoose";

const nonvegFoodsSchema = new Schema(
    {
      name: {
        type: String,
        required: true
      },
      image: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      tiofyPriceFactor: {
        type: Number,
        default: 1.2
      }
   },{timestamps: true})

   export const NonVegFoods = new mongoose.model("NonVegFoods", nonvegFoodsSchema);