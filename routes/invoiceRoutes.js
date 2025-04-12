const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const common = require("../utils/common.util");
const ExcelJS = require('exceljs');
const Project = require("../models/Projects")
const fs = require('fs');
const moment = require('moment')
const authenticateJWT = require("../utils/authenticateJWT");

router.get('/',authenticateJWT, async (req, res) => {
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
                detail = { ...detail.userId, ...detail, userId: detail.userId._id, _id: undefined, __v: undefined };
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

router.post("/create-invoice",authenticateJWT, async (req, res) => {
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

router.post("/generateInvoiceExcel",authenticateJWT, async (req, res) => {

    const missingFieldsResponse = common.checkMissingFields(
        ["invoiceDate"],
        req.body,
        res
    );
    if (missingFieldsResponse) return;
    try {
        const isBoss = req.user.isBoss
        if(isBoss){
            const invoiceDateMoment = moment.utc(req.body.invoiceDate);
            const startOfDay = invoiceDateMoment.startOf('day').toDate();
            const endOfDay = invoiceDateMoment.endOf('day').toDate();
            const data = await Invoice.find({
                createdAt: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            });
            if(data){
                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet('KPS Monthly Invoicing Summary');
        
                const maxUserDetailsLength = Math.max(...data.map(item => item.userDetails.length));
                const colLength = 5 + maxUserDetailsLength * 5;
        
                sheet.columns = Array(colLength + 2).fill({ width: 25 });
        
                const offset = 2;
                const startCharCode = 65 + offset;
                const startCol = String.fromCharCode(startCharCode);
                const nextCol = String.fromCharCode(startCharCode + 1);
                const endCol = String.fromCharCode(startCharCode + colLength - 1);
        
        
                sheet.mergeCells(`${startCol}4:${endCol}4`);
                sheet.getCell(`${startCol}4`).value = 'KPS Monthly Invoicing Summary';
                sheet.getCell(`${startCol}4`).font = { size: 14, bold: true };
                sheet.getCell(`${startCol}4`).alignment = { horizontal: 'left', vertical: 'left' };
        
        
                const from = moment(data[0].fromDate).format('MMM-D-YYYY');
                const to = moment(data[0].toDate).format('MMM-D-YYYY');
        
                sheet.mergeCells(`${startCol}5:${startCol}6`);
                sheet.getCell(`${startCol}5`).value = 'Invoiced duration:';
                sheet.getCell(`${startCol}5`).font = { size: 10, bold: true };
                sheet.getCell(`${startCol}5`).alignment = { horizontal: 'left', vertical: 'middle' };
        
                sheet.mergeCells(`${nextCol}5:${endCol}6`);
                sheet.getCell(`${nextCol}5`).value = `${from} to ${to}`;
                sheet.getCell(`${nextCol}5`).alignment = { horizontal: 'left', vertical: 'middle' };
        
        
                const uniqueUserNames = [
                    ...new Set(
                        data.flatMap(item => item.userDetails.map(user => user.userName))
                    )
                ];
        
                // Table Header
                const tableHeader = [
                    '', '',
                    'Client',
                    'Invoice To',
                    'Project Name',
                    'Client PO/Reference Number',
                    'KPS Billing Description on Invoice',
                    ...uniqueUserNames,  // Dynamically add user names as headers
                    'totalBillableHours',
                    'rate',
                    'subTotal',
                    'total'
                ];
                const headerRow = sheet.addRow(tableHeader);
        
                headerRow.eachCell((cell, colNumber) => {
        
                    const isNonEmpty = cell.value !== undefined && cell.value !== '';
        
                    if (isNonEmpty) {
                        cell.font = { bold: true };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFD9D9D9' }
                        };
        
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        cell.border = {
                            top: { style: 'thin' },
                            bottom: { style: 'thin' },
                            left: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    }
        
        
                });
        
                sheet.getColumn(7).width = 50;
                const totalHoursByUser = uniqueUserNames.map(() => 0);
                for (let i = 0; i < data.length; i++) {
                    const invoice = data[i];
                    const project = await Project.findById(invoice.projectId);
        
                    const dataRow = [
                        '', '',
                        invoice.clientName,
                        invoice.invoiceTo,
                        project ? project.projectName : 'Unknown Project',
                        '',
                        invoice.description,
                    ];
        
                    uniqueUserNames.forEach((userName, index) => {
                        const user = invoice.userDetails.find(u => u.userName === userName);
                        const totalHours = user ? user.totalHours : 0;
                        dataRow.push(totalHours);
        
                        totalHoursByUser[index] += totalHours;
                    });
        
                    const summary = invoice.userDetails[0];
                    dataRow.push(
                        invoice.totalBillableHours,
                        summary.rate,
                        invoice.subTotal,
                        invoice.totalAmount
                    );
        
                    const row = sheet.addRow(dataRow);
        
                    const descriptionColIndex = 7;
                    const charCount = invoice.description ? invoice.description.length : 0;
                    const wrapCharsPerLine = 45;
                    const lineCount = Math.ceil(charCount / wrapCharsPerLine);
                    const estimatedHeight = Math.max(25, lineCount * 20);
        
                    row.height = estimatedHeight;
        
                    const descriptionCell = row.getCell(descriptionColIndex);
                    descriptionCell.alignment = {
                        wrapText: true,
                        vertical: 'top',
                        horizontal: 'left'
                    };
        
                    descriptionCell.border = {
                        top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                        bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
                    };
                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        if (colNumber !== descriptionColIndex) {
                            cell.alignment = { horizontal: 'right', vertical: 'middle' };
                        }
                    });
                }
        
                const totalRow = sheet.addRow([
                    '', 'Total Hours', '', '', '', '', '', ...totalHoursByUser, '', '', '', ''
                ]);
        
                totalRow.font = { bold: true };
        
                const buffer = await workbook.xlsx.writeBuffer();
                let base64Excel = buffer.toString('base64')
                res.status(200).json({status:true,message: 'Invoice excel' , result :base64Excel })
                // res.setHeader('Content-Disposition', 'attachment; filename=Invoice_Summary.xlsx');
                // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                // res.send(buffer);
    
            }else{
                res.status(200).json({status:true , message: `Data is not available`})
            }

        }else{
            res.status(200).json({status:false , message:"You are not allowed to generate invoice excel!"})
        }
       

      
    } catch (error) {
        return common.error(req, res, {
            message: "Error creating invoice.",
            error: error
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
