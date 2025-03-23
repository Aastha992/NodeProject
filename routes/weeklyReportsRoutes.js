const express = require('express');
const router = express.Router();
const DailyEntry = require('../models/dailyEntry');
const DailyDairy = require('../models/dailyDiary');
const PhotoFiles = require('../models/PhotoFiles');
const common = require('../utils/common.util');
const pdfHandler = require("../utils/pdfHandler");
const path = require('path');
const { weeklyTemplate } = require("../utils/pdfHandlerNew/htmlHandler");
const { generatePDF } = require("../utils/pdfHandlerNew/pdfDownloader");
const moment = require("moment-timezone");
router.get('/weekly-report', fetchReport);
router.get('/download-weekly-report', function (req, _, next) { req.query['downloadPdf'] = '1'; return next(); }, fetchReport, downloadWeeklyReportV1);
router.get('/invoice-report', function (req, _, next) { req.query['invoice_flow'] = '1'; return next(); }, fetchReport);

module.exports = router;

const calculateHours = (timeIn, timeOut) => {
    const inTime = new Date(`1970-01-01 ${timeIn}`);
    const outTime = new Date(`1970-01-01 ${timeOut}`);
    const diffInMs = outTime - inTime;
    return diffInMs / (1000 * 60 * 60); // Convert ms to hours
};

async function fetchReport(req, res, next) {
    const { projectId, startDate, endDate, invoice_flow = '2', userId, downloadPdf = '2', weeklyReportId } = req.query;

    if (!projectId || !startDate || !endDate) {
        return common.error(req, res, {
            message: "Missing required parameters: projectId, startDate, or endDate"
        });
    }

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const dayDifference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (dayDifference <= 0 || dayDifference > 7) {
            return common.error(req, res, {
                message: "Invalid date range. The date range should be between 1 and 7 days."
            });
        }
        let project, weeklyData;
        try {
            ({ project, weeklyData } = await common.validateReferences({ projectId, userId, weeklyReportId }));
            weeklyData = weeklyData.toObject();
        } catch (error) {
            return common.validationError(req, res, { message: error.message });
        }

        // Fetch Daily Entries and Daily Dairies with user details joined
        const [dailyEntries, dailyDairies, projectImages] = await Promise.all([
            DailyEntry.aggregate([
                { $match: { projectId: project._id, selectedDate: { $gte: start, $lte: end } } },
                {
                    $lookup: {
                        from: 'userdetails',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userDetails'
                    }
                },
                { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } }  // Unwind the user details array
            ]),
            DailyDairy.aggregate([
                { $match: { projectId: project._id, selectedDate: { $gte: start, $lte: end } } },
                {
                    $lookup: {
                        from: 'userdetails',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userDetails'
                    }
                },
                { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } }  // Unwind the user details array
            ]),
            invoice_flow == '2' ?
                PhotoFiles.find(
                    {
                        projectId,
                        // userId,  this can be done for more precise purposes
                    },
                    {
                        photo: 1,
                        description: 1,
                        _id: 0
                    }
                ).lean() : []
        ]);


        // Combine and group day-wise
        const combinedReports = [...dailyEntries, ...dailyDairies].sort((a, b) => new Date(a.selectedDate) - new Date(b.selectedDate));
        let userInvoices;
        const groupedReports = {};

        const resp = { project: project.toObject() };
        resp['project']['images'] = projectImages;

        if (invoice_flow == '2') {
            // Loop through each day in the range and group data
            for (let day = 0; day <= dayDifference; day++) {
                const currentDate = new Date(start);
                currentDate.setDate(start.getDate() + day);

                const dateKey = `${currentDate.toLocaleString('default', { weekday: 'short' })}-${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

                groupedReports[dateKey] = combinedReports.find(report => {
                    const reportDate = new Date(report.selectedDate).toISOString().split('T')[0];
                    return reportDate === currentDate.toISOString().split('T')[0];
                }) || {};
            }
            resp['groupedReports'] = groupedReports;
            if (downloadPdf == '1') {
                const data = generateWeeklyReport({ groupedReports: groupedReports, project: resp.project });
                delete weeklyData.images;
                Object.assign(data, weeklyData)
                req.body['weeklyData'] = data;
                return next();
            }
            // here add total in case of download
        } else {
            const userHours = {};

            for (const entry of dailyEntries) {
                const userId = entry.userId._id.toString();
                const userName = entry.userDetails?.username || "Unknown User";

                // Calculate hours from timeIn and timeOut
                const hoursWorked = calculateHours(entry.timeIn, entry.timeOut);

                if (!userHours[userId]) {
                    userHours[userId] = {
                        userId,
                        userName,
                        totalHours: 0,
                        breakdown: []
                    };
                }

                // Add hours for this entry to the user
                userHours[userId].totalHours += hoursWorked;
                userHours[userId].breakdown.push({
                    date: entry.selectedDate,
                    location: entry.location,
                    timeIn: entry.timeIn,
                    timeOut: entry.timeOut,
                    hoursWorked,
                    description: entry.description
                });
            }
            userInvoices = Object.values(userHours).map(user => ({
                userId: user.userId,
                userName: user.userName,
                totalHoursWorked: user.totalHours,
                breakdown: user.breakdown
            }));
            resp['userInvoices'] = userInvoices;
            if (downloadPdf == '1') {
                // here will be invoice flow
                // req.body['invoice'] = generateWeeklyReport(resp);
                // return next();
            }
        }

        return common.success(req, res, {
            message: "Weekly reports fetched successfully.",
            data: resp
        });

    } catch (error) {
        return common.error(req, res, {
            message: "Error fetching weekly reports.",
            error: error.message
        });
    }
}


async function downloadWeeklyReport(req, res) {
    const { weeklyData } = req.body;
    const { format } = req.body;
    const pdfBuffer = await pdfHandler.weeklyHandler([weeklyData]);
    if (format === 'pdf') {
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=Inspection_Report.pdf',
        });
    } else {
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': 'attachment; filename=Inspection_Report.docx',
        });
    }

    return res.send(pdfBuffer);  // Send the buffer directly to the client
}


async function downloadWeeklyReportV1(req, res) {
    const { weeklyData } = req.body;
    const endDate = moment.tz(weeklyData.endDate, (req.timeZone || "Asia/Kolkata")).format("DD-MM-YYYY, hh:mm:ss A");
    const startDate = moment.tz(weeklyData.startDate, (req.timeZone || "Asia/Kolkata")).format("DD-MM-YYYY, hh:mm:ss A");
    weeklyData.startDate = startDate;
    weeklyData.endDate = endDate;
    const weeklyPdfHtml = weeklyTemplate(weeklyData);
    const pdfPath = path.join(__dirname, '../uploads/weekly_report.pdf');
    const outputPath = await generatePDF(weeklyPdfHtml, pdfPath);
    return common.sendPdfBuffer({res, filePath :outputPath , fileName : 'weekly_entry_report.pdf'});
    // return res.send(outputPath);  // Send the buffer directly to the client
}

function generateWeeklyReport({ groupedReports, project }) {
    let weeklyReportFinal = {
        equipments: [],
        visitors: [],
        contractorDetails: {
            labours: []
        }
    };

    let equipmentCount = {};
    let visitorCount = {};
    let contractorLabourCount = {};

    for (let day in groupedReports) {
        let report = groupedReports[day];
        if (!report || Object.keys(report).length === 0) continue;

        // Aggregate Equipments Usage
        if (report.equipments) {
            report.equipments.forEach(equipment => {
                if (!equipmentCount[equipment.equipmentName]) {
                    equipmentCount[equipment.equipmentName] = 0;
                }
                equipmentCount[equipment.equipmentName] += 1;
            });
        }

        // Aggregate Visitors
        if (report.visitors) {
            report.visitors.forEach(visitor => {
                if (!visitorCount[visitor.visitorCompany]) {
                    visitorCount[visitor.visitorCompany] = {
                        visitorCompany: visitor.visitorCompany,
                        days: 0
                    };
                }
                visitorCount[visitor.visitorCompany].days += 1;
            });
        }

        // Aggregate Contractor Details (Labours)
        if (report.contractorDetails) {
            report.contractorDetails.forEach(contractor => {
                if (!contractorLabourCount[contractor.contractorName]) {
                    contractorLabourCount[contractor.contractorName] = [];
                }
                contractor.labours.forEach(labour => {
                    let existingLabour = contractorLabourCount[contractor.contractorName].find(l => l.role === labour.role);
                    if (existingLabour) {
                        existingLabour.count += 1;
                    } else {
                        contractorLabourCount[contractor.contractorName].push({ role: labour.role, count: 1 });
                    }
                });
            });
        }
    }

    // Convert aggregated data to required array format
    weeklyReportFinal.equipments = Object.entries(equipmentCount).map(([name, days]) => ({ name, days }));
    weeklyReportFinal.visitors = Object.values(visitorCount);
    weeklyReportFinal.contractorDetails = Object.entries(contractorLabourCount).map(([contractorName, labours]) => ({ contractorName, labours }));
    const resp = { ...project, weeklySummary: weeklyReportFinal };
    return resp;
}


// // Path to save PDF
// const pdfPath = path.join(__dirname, 'daily_report.pdf');
// const dailyTemplate = require("./daily");

// const weeklyPdfHtml = weeklyTemplate(WeeklyData);
// const dailyPdfHtml = dailyTemplate(dailyData);
// generatePDF(dailyPdfHtml, pdfPath);
// generatePDF(weeklyPdfHtml, pdfPath_);