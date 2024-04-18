import mongoose, { Schema } from "mongoose";

const companyEarningsSchema = new Schema(
    {
        fromCYR: {
            type: String
        },
        fromFoody: {
            type: String
        },
        fromLaundry: {
            type: String
        },
        totalRs: {
            type: Number
        }
    },{timestamps: true}
)

export const CompanyEarnings = mongoose.model("CompanyEarnings", companyEarningsSchema)