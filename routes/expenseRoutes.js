const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require('fs'); // Import the file system module
const handlebars = require('handlebars');  // Import handlebars
const authenticateJWT = require("../utils/authenticateJWT");
const ExpenseInfo = require("../models/expense");
const common = require("../utils/common.util");
const Trip = require("../models/mileage");
const MileageUser = require("../models/MileageUser");
const { sendApprovalEmail } = require("../utils/sendApprovalEmail");

// Middleware to check boss role
const isBoss = (req, res, next) => {
    if (!req.user.isBoss) {
        return res.status(403).json({
            status: "error",
            message: "Access restricted to authorized managers"
        });
    }
    next();
};

// File upload setup
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const isValidType = allowedTypes.test(file.mimetype);
    const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    isValidType && isValidExt ? cb(null, true) : cb("Invalid file type", false);
};

const upload = multer({
    storage: common.prepareStorage,
    fileFilter,
});

// Helper: Get mileage for date range
const getMileageExpense = async (userId, startDate, endDate) => {
    try {
        const mileageUser = await MileageUser.findOne({ userId });
        if (!mileageUser) return 0;

        const trips = await Trip.find({
            user_id: mileageUser._id,
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        });

        return trips.reduce((sum, trip) => sum + trip.expenses, 0);
    } catch (error) {
        console.error("Mileage error:", error);
        return 0;
    }
};

// Submit Expense
router.post("/expense", authenticateJWT, upload.any(), async (req, res) => {
    try {
        const { startDate, endDate, expenses, ...otherFields } = req.body;
        
        // Calculate amounts
        const mileageExpense = await getMileageExpense(req.user.userId, startDate, endDate);
        const parsedExpenses = JSON.parse(expenses);
        const expenseAmount = parsedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        // Handle files
        const receiptPath = req.files?.find(f => f.fieldname === 'receipt')?.filename;
        const expensesWithImages = parsedExpenses.map((expense, index) => ({
            ...expense,
            images: req.files
    ?.filter(f => f.fieldname.startsWith('image_'))
    ?.map(f => `https://${req.headers.host}/uploads/${f.filename}`)
 || []
        }));

        // Create record
        const newExpense = await ExpenseInfo.create({
            submittedBy: req.user.userId,
            startDate,
            endDate,
            expenses: expensesWithImages,
            mileageAmount: mileageExpense,
            expenseAmount: expenseAmount,
            totalAmount: mileageExpense + expenseAmount,
            receipt: receiptPath ? `/uploads/${receiptPath}` : null,
            ...otherFields
        });

        res.status(201).json({
            status: "success",
            data: {
                ...newExpense.toObject(),
                password: undefined
            }
        });

    } catch (error) {
        console.error("Expense submission error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to submit expense"
        });
    }
});

// Get Expenses
router.get("/expenses", authenticateJWT, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = { submittedBy: req.user.userId };
        
        if (req.user.isBoss) {
            query = {};
        }

        // Add date filtering for all users
        if (startDate && endDate) {
            query.createdAt = { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate)
            };
        }

        const expenses = await ExpenseInfo.find(query)
            .populate("submittedBy", "username email")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ status: "success", data: expenses });

    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch expenses" });
    }
});


// Boss Approval Endpoints
router.get("/approvals", authenticateJWT, isBoss, async (req, res) => {
    try {
        const pendingApprovals = await ExpenseInfo.find({
            $or: [
                { mileageStatus: "Pending" },
                { expenseStatus: "Pending" }
            ]
        }).populate("submittedBy", "username email");

        res.json({ status: "success", data: pendingApprovals });

    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to fetch approvals" });
    }
});

router.patch("/approve/:id", authenticateJWT, isBoss, async (req, res) => {
    try {
        const { type, status } = req.body;
        const validTypes = ["mileage", "expense"];
        const validStatuses = ["Pending", "Approved", "Rejected"];

        if (!validTypes.includes(type) || !validStatuses.includes(status)) {
            return res.status(400).json({ status: "error", message: "Invalid data provided" });
        }

        const update = { [`${type}Status`]: status };

        const updatedExpense = await ExpenseInfo.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        ).populate("submittedBy", "username email");

        // Send email if Boss approves
        if (req.user.isBoss && status === "Approved") {
            const emailTemplatePath = path.join(__dirname, '../templates/payrollEmailTemplate.html');
            try {
                const emailTemplateSource = fs.readFileSync(emailTemplatePath, 'utf8');
                const emailTemplate = handlebars.compile(emailTemplateSource);

                const images = updatedExpense.expenses.flatMap(exp => exp.images);
                const emailData = {
                    employeeName: updatedExpense.submittedBy.username,
                    totalApprovedAmount: updatedExpense.totalAmount,
                    startDate: updatedExpense.startDate.toLocaleDateString("en-US"),
                    endDate: updatedExpense.endDate.toLocaleDateString("en-US"),
                    images: images.length > 0 ? images : []
                };

                const emailHTML = emailTemplate(emailData);

                sendApprovalEmail("aasthasharma30.97@gmail.com", "Expense Report Approved", emailHTML);
                console.log("Approval email sent successfully to aasthasharma30.97@gmail.com"); //Log success

            } catch (emailError) {
                console.error("Error sending approval email:", emailError);
            }
        }

        res.json({ status: "success", data: updatedExpense });

    } catch (error) {
        console.error("Approval error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to update approval status"
        });
    }
});

module.exports = router;