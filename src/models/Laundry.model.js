import mongoose, {Schema} from 'mongoose';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const laundrySchema = new Schema(
    {
        ownerName: {
            type: String,
            required: true,
            trim: true
        },
        shopName: {
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
        shopPhoto: {
            type: String
        },
        password: {
            type: String,
            required: true
        },
        OrderHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "LaundryOrders"
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
        city: {
            type: String
        }
    }, {
    timestamps: true
})

laundrySchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
   this.password = await bcrypt.hash(this.password, 10)
   next()
  })
  
  laundrySchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
  }
  
  laundrySchema.methods.generateAccessToken = function(){
     return jwt.sign(
        {
            _id: this.id,
             email: this.email,
             ownerName: this.ownerName,
             shopName: this.shopName
        },
         process.env.AccessTokenSecret,
         {
            expiresIn: process.env.AccessTokenExpiry
         }
      )
  }
  
  laundrySchema.methods.generateRefreshToken = function(){
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

export const Laundry = mongoose.model("Laundry", laundrySchema);