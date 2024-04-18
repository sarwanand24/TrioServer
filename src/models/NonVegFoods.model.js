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
      }
   },{timestamps: true})

   export const NonVegFoods = new mongoose.model("NonVegFoods", nonvegFoodsSchema);