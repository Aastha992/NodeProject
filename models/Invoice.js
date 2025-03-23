const mongoose = require("mongoose");

const UserInvoiceDetailsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails", required: true }, // Reference to UserDetails schema
    userName: { type: String, required: true },
    totalHours: { type: Number, required: true },
    totalBillableHours: { type: Number, required: true },
    rate: { type: Number, required: true },
    subTotal: { type: Number, required: true },
    total: { type: Number, required: true }
});

const InvoiceSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    invoiceTo: { type: String, required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },  // Reference to Project schema
    clientPOReferenceNumber: { type: String, default: "" },
    description: { type: String, required: true },
    userDetails: [UserInvoiceDetailsSchema],
    subTotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
}, { collection: "Invoices" });

module.exports = mongoose.model("Invoice", InvoiceSchema);
