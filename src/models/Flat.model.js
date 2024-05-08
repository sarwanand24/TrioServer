import mongoose, {Schema} from 'mongoose';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const flatSchema = new Schema(
    {
        ownerName: {
            type: String,
            required: true,
            trim: true
        },
        flatName: {
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
        flatPhoto: {
            type: String
        },
        password: {
            type: String,
            required: true
        },
        OrderHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "flatOrders"
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
        isRoomFull: {
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

flatSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
   this.password = await bcrypt.hash(this.password, 10)
   next()
  })
  
  flatSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
  }
  
  flatSchema.methods.generateAccessToken = function(){
     return jwt.sign(
        {
            _id: this.id,
             email: this.email,
             ownerName: this.ownerName,
             flatName: this.flatName
        },
         process.env.AccessTokenSecret,
         {
            expiresIn: process.env.AccessTokenExpiry
         }
      )
  }
  
  flatSchema.methods.generateRefreshToken = function(){
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

export const Flat = mongoose.model("Flat", flatSchema);