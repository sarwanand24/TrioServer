import mongoose, { Schema } from "mongoose";

const vegFoodsSchema = new Schema(
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
      tiofyPrice: {
        type: Number
      }
   },{timestamps: true})

   export const VegFoods = new mongoose.model("VegFoods", vegFoodsSchema);