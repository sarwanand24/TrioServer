import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const restaurantSchema = new Schema(
    {
        ownerName: {
            type: String,
            required: true,
            trim: true
        },
        restaurantName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true,
            unique: true
        },
        address: {
            type: String
        },
        mobileNo: {
            type: Number,
            required: true,
        },
        alternateMobileNo: {
            type: Number
        },
        restaurantPhoto: {
            type: String
        },
        password: {
            type: String,
            required: true
        },
        moneyEarned: {
            type: Number,
            default: 0
        },
        vegFoods: [
            {
                type: Schema.Types.ObjectId,
                ref: "VegFoods"
            }
        ],
        nonvegFoods: [
            {
                type: Schema.Types.ObjectId,
                ref: "NonVegFoods"
            }
        ],
        OrderHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "FoodyOrders"
            }
        ],
        bankAccountNo: {
            type: Number
        },
        ifscCode: {
            type: String
        },
        bankName: {
            type: String
        },
        bankBranch: {
            type: String
        },
        ratings: {
            type: Number,
            default: 0
        },
        latitude: {
            type: Number,
            default: 22.23487
        },
        longitude: {
            type: Number,
            default: 87.36489
        },
        fssaiNo: {
            type: Number,
            required: true
        },
        fssaiExpiryDate: {
            type: String,
            required: true
        },
        refreshToken: {
            type: String
        },
        openingTime: {
            type: String,
            required: true
        },
        closingTime: {
            type: String,
            required: true
        },
        availableStatus: {
            type: Boolean,
            default: true
        },
        deviceToken: {
          type: String
        },
        city: {
            type: String,
            required: true
        },
        cuisineType: {
            type: String,
            default: 'NorthIndian'
        },
        verified: {
            type: Boolean,
            default: false
        },
    }, {
    timestamps: true
})

restaurantSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
   this.password = await bcrypt.hash(this.password, 10)
   next()
  })
  
  restaurantSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
  }
  
  restaurantSchema.methods.generateAccessToken = function(){
     return jwt.sign(
        {
            _id: this.id,
             email: this.email,
             ownerName: this.ownerName,
             restaurantName: this.restaurantName
        },
         process.env.AccessTokenSecret,
         {
            expiresIn: process.env.AccessTokenExpiry
         }
      )
  }
  
  restaurantSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this.id,
   
        },
         process.env.RefreshTokenSecret,
         {
            expiresIn: process.env.RefreshTokenExpiry
         }
      )
  }

export const Restaurant = mongoose.model("Restaurant", restaurantSchema);