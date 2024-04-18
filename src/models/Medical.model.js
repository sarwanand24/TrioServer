import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const medicalSchema = new Schema(
    {
        ownerName: {
            type: String,
            required: true,
            trim: true
        },
        medicalName: {
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
            index: true
        },
        address: {
            type: String
        },
        mobileNo: {
            type: Number,
            required: true,
            unique: true
        },
        alternateMobileNo: {
            type: Number
        },
        medicalPhoto: {
            type: String
        },
        password: {
            type: String,
            required: true
        },
        OrderHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "CyrMedicoOrders"
            }
        ],
        bankAccountNo: {
            type: Number
        },
        moneyEarned: {
            type: Number
        },
        ratings: {
            type: Number,
            default: 0
        },
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
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
        }
    }, {
    timestamps: true
})

medicalSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
   this.password = await bcrypt.hash(this.password, 10)
   next()
  })
  
  medicalSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
  }
  
  medicalSchema.methods.generateAccessToken = function(){
     return jwt.sign(
        {
            _id: this.id,
             email: this.email,
             ownerName: this.ownerName,
             medicalName: this.medicalName
        },
         process.env.AccessTokenSecret,
         {
            expiresIn: process.env.AccessTokenExpiry
         }
      )
  }
  
  medicalSchema.methods.generateRefreshToken = function(){
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

export const Medical = mongoose.model("Medical", medicalSchema);