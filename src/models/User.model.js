import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    address: {
      type: String,
      required: true
    },
    mobileNo: {
      type: Number,
      required: true,
      unique: true
    },
    alternateMobileNo: {
      type: Number
    },
    profilePhoto: {
      type: String
    },
    password: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String
   },
    foodyOrderHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "FoodyOrders"
      }
    ],
    cyrOrderHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "CYROrders"
      }
    ],
    cyrMedicoOrderHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "CyrMedicoOrders"
      }
    ],
    foodyCancelledOrders: [
      {
        type: Schema.Types.ObjectId,
        ref: "FoodyCancelledOrders"
      }
    ],
    cyrCancelledOrders: [
      {
        type: Schema.Types.ObjectId,
        ref: "CYRCancelledRides"
      }
    ],
    cyrMedicoCancelledOrders: [
      {
        type: Schema.Types.ObjectId,
        ref: "CyrMedicoCancelledOrders"
      }
    ],
    foodyRatings: [
      {
        type: Schema.Types.ObjectId,
        ref: "FoodyRating"
      }
    ],
    cyrRatings: [
      {
        type: Schema.Types.ObjectId,
        ref: "CYRRating"
      }
    ],
    cyrMedicoRatings: [
      {
        type: Schema.Types.ObjectId,
        ref: "CYRMedicoRating"
      }
    ],
    favouriteFoods: [
      {
        type: Schema.Types.ObjectId,
        ref: "FavouriteFoods"
      }
    ],
    deviceToken: {
      type: String
    }
  },
  {
    timestamps: true
  })

  
userSchema.pre("save", async function(next) {
  if(!this.isModified("password")) return next();
 this.password = await bcrypt.hash(this.password, 10)
 next()
})

userSchema.methods.isPasswordCorrect = async function(password){
 return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
   return jwt.sign(
      {
          _id: this.id,
           email: this.email,
           username: this.username,
           fullName: this.fullName
      },
       process.env.AccessTokenSecret,
       {
          expiresIn: process.env.AccessTokenExpiry
       }
    )
}

userSchema.methods.generateRefreshToken = function(){
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

export const User = mongoose.model("User", userSchema);