import mongoose, {Schema} from 'mongoose';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const hotelSchema = new Schema(
    {
        ownerName: {
            type: String,
            required: true,
            trim: true
        },
        hotelName: {
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
        hotelPhoto: {
            type: String
        },
        password: {
            type: String,
            required: true
        },
        OrderHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "HotelOrders"
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
        refreshToken: {
            type: String
        },
        checkInTime: {
            type: String,
            required: true
        },
        checkOutTime: {
            type: String,
            required: true
        },
        isRoomFull: {
            type: Boolean,
            default: false
        },
        isCoupleStayAllowed: {
            type: Boolean,
            default: false
        },
        isFamilyStayAllowed: {
            type: Boolean,
            default: false
        },
        city: {
            type: String
        },
        price: {
            type: Number
        }
    }, {
    timestamps: true
})

hotelSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
   this.password = await bcrypt.hash(this.password, 10)
   next()
  })
  
  hotelSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
  }
  
  hotelSchema.methods.generateAccessToken = function(){
     return jwt.sign(
        {
            _id: this.id,
             email: this.email,
             ownerName: this.ownerName,
             hotelName: this.hotelName
        },
         process.env.AccessTokenSecret,
         {
            expiresIn: process.env.AccessTokenExpiry
         }
      )
  }
  
  hotelSchema.methods.generateRefreshToken = function(){
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

export const Hotel = mongoose.model("Hotel", hotelSchema);