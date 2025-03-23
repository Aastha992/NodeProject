const mongoose = require("mongoose");

const UserInfoSchemaExpense = new mongoose.Schema(
    {
        submittedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true,
            ref: "UserDetails" 
        },
        employeeName: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        expenditure: { type: String },
        projectNumber: { type: String },
        category: { type: String },
        task: { type: String },
        expenses: {
            type: [
                {
                    title: { type: String },
                    amount: { type: Number },
                    category: { type: String },
                    images: { type: [String] }
                }
            ],
            default: []
        },
        totalAmount: { type: Number },
        receipt: { type: String },
        mileageAmount: { type: Number, default: 0 },
        expenseAmount: { type: Number, default: 0 },
        mileageStatus: { 
            type: String, 
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending" 
        },
        expenseStatus: { 
            type: String, 
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending" 
        },
    },
    {
        collection: "ExpenseInfo",
        timestamps: true,
    }
);

const ExpenseInfo = mongoose.model("ExpenseInfo", UserInfoSchemaExpense);
module.exports = ExpenseInfo;