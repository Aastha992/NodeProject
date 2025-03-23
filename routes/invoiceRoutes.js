const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const common = require("../utils/common.util");

router.get('/', async (req, res) => {
    const { invoiceId } = req.query;

    try {
        let result;

        if (invoiceId) {
            // Fetch a particular invoice by its ID
            result = await Invoice.findById(invoiceId)
                .populate([
                    {
                        path: 'projectId',
                    },
                    {
                        path: 'userDetails.userId',
                        select: '-password'  // Exclude the password field
                    }
                ])
                .lean();

            if (!result) {
                return common.error(req, res, { message: "Invoice not found" });
            }
            result.userDetails = result.userDetails.map((detail) => {
                detail = { ...detail.userId, ...detail, userId: detail.userId._id , _id : undefined , __v : undefined };
                return detail;
            })

            // Map _id to invoiceId and projectId correctly
            result = {
                ...result,
                invoiceId: result._id,
                projectId: result.projectId?._id,
                __v: undefined,
                _id: undefined
            };
        } else {
            // Fetch all invoices and map fields
            result = await Invoice.find().populate('projectId userDetails.userId').lean();
            result = result.map((invoice) => ({
                ...invoice,
                invoiceId: invoice._id,
                projectId: invoice.projectId?._id,
                userDetails: invoice.userDetails.map(user => ({
                    ...user,
                    userId: user.userId?._id,  // Keep userId as ObjectId for flexibility
                    userName: user.userId?.username || user.userName,  // Use populated or provided name
                    _id: undefined,
                })),
                _id: undefined,
                __v: undefined
            }));
        }

        return common.success(req, res, {
            message: "Invoices fetched successfully",
            data: result
        });
    } catch (err) {
        return common.error(req, res, { message: err.message });
    }
});

router.post("/create-invoice", async (req, res) => {
    const {
        clientName,
        fromDate,
        toDate,
        invoiceTo,
        projectId,
        clientPOReferenceNumber,
        description,
        userDetails,  // Array of user details provided by frontend
        subTotal,
        totalAmount
    } = req.body;

    // Validate required fields
    const missingFieldsResponse = common.checkMissingFields(
        ["clientName", "fromDate", "toDate", "invoiceTo", "projectId", "description", "userDetails", "subTotal", "totalAmount"],
        req.body,
        res
    );
    if (missingFieldsResponse) return;

    try {
        try {
            await common.validateReferences({ projectId });
        } catch (error) {
            return common.validationError(req, res, { message: error.message });
        }

        // Create the invoice
        const newInvoice = await Invoice.create({
            clientName,
            fromDate,
            toDate,
            invoiceTo,
            projectId,
            clientPOReferenceNumber,
            description,
            userDetails,  // Save directly as provided by frontend
            subTotal,
            totalAmount
        });

        return common.success(req, res, {
            message: "Invoice created successfully.",
            data: newInvoice
        });
    } catch (error) {
        return common.error(req, res, {
            message: "Error creating invoice.",
            error: error.message
        });
    }
});

module.exports = router;


/* {
    "clientName": "ABC Corp",
    "fromDate": "2025-02-01",
    "toDate": "2025-02-07",
    "invoiceTo": "Finance Department, ABC Corp",
    "projectId": "63c9f1c27fbb3d1e4a123456",
    "clientPOReferenceNumber": "PO-2025-001",
    "description": "Weekly construction site work",
    "userDetails": [
        {
            "userId": "63c9e47e7fbb3d1e4a111111",
            "userName": "John Doe",
            "totalHours": 40,
            "totalBillableHours": 38,
            "rate": 50,
            "subTotal": 1900,
            "total": 1900
        },
        {
            "userId": "63c9e47e7fbb3d1e4a222222",
            "userName": "Jane Smith",
            "totalHours": 35,
            "totalBillableHours": 35,
            "rate": 45,
            "subTotal": 1575,
            "total": 1575
        }
    ],
    "subTotal": 3475,
    "totalAmount": 3475
} */
