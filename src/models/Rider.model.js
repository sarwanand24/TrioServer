import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const riderSchema = new Schema(
    {
        riderName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true,
            unique: true
        },
        drivingLiscense: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        mobileNo: {
            type: Number,
            required: true,
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
        vehicleName: {
            type: String,
            required: true
        },
        vehicleNo: {
            type: String,
            required: true
        },
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
        moneyEarned: {
            type: Number,
            default: 0
        },
        cyrRideHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "CYROrders"
            }
        ],
        foodyRideHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "FoodyOrders"
            }
        ],
        cyrMedicoRideHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "CyrMedicoOrders"
            }
        ],
        cyrRatings: {
            type: Number,
            default: 0
        },
        refreshToken: {
            type: String
        },
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        },
        aadharCard: {
            type: String
        },
        availableStatus: {
            type: Boolean,
            default: false
        },
        deviceToken: {
          type: String
        },
        zone: {
            type: String
        },
        city: {
            type: String,
            required: true
        },
        vehicleType: {
            type: String,
            required: true,
            default: 'Bike'
        },
        verified: {
            type: Boolean,
            default: false
        },
        rejectCount: {
            type: Number,
            default: 0
        }
    }, {
    timestamps: true
})

riderSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
   this.password = await bcrypt.hash(this.password, 10)
   next()
  })
  
  riderSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
  }
  
  riderSchema.methods.generateAccessToken = function(){
     return jwt.sign(
        {
            _id: this.id,
             email: this.email,
             riderName: this.riderName
        },
         process.env.AccessTokenSecret,
         {
            expiresIn: process.env.AccessTokenExpiry
         }
      )
  }
  
  riderSchema.methods.generateRefreshToken = function(){
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

export const Rider = mongoose.model("Rider", riderSchema);
