const { Document, Packer, Paragraph, Table, TableRow, TableCell, AlignmentType, WidthType, HeadingLevel, ImageRun } = require('docx');
const { fetchRemoteImage } = require("../common.util");
const fs = require('fs');
const generateInspectionReport = async (data) => {
    const doc = new Document({
        sections: [],
        coreProperties: {
            creator: "Construction Team",
            title: "Daily Inspection Report",
            description: "Generated daily inspection report for project tracking.",
        },
    });

    // Add logo using ImageRun
    const logoImage = new Paragraph({
        children: [
            new ImageRun({
                data: await fetchRemoteImage("https://img.freepik.com/free-vector/bird-colorful-logo-gradient-vector_343694-1365.jpg"),
                transformation: { width: 100, height: 40 },
            }),
        ],
        alignment: AlignmentType.LEFT,
    });

    // Header section with logo and report title
    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [logoImage],
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        borders: noBorders(),
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                text: "Daily Inspection Report",
                                heading: HeadingLevel.HEADING_1,
                                alignment: AlignmentType.CENTER,
                                color: "000000",
                            }),
                        ],
                        width: { size: 75, type: WidthType.PERCENTAGE },
                        borders: noBorders(),
                    }),
                ],
            }),
        ],
    });

    // Main document content
    doc.addSection({
        properties: {
            page: { background: { color: "FFFFFF" } },  // White document background
        },
        children: [
            headerTable,
            new Paragraph({ text: " " }),

            // Date and Location Section
            new Paragraph({
                text: `Date: ${new Date(data.selectedDate).toLocaleDateString()}`,
                alignment: AlignmentType.RIGHT,
                color: "000000",
            }),
            new Paragraph({
                text: `Location: ${data.location}`,
                spacing: { after: 200 },
                color: "000000",
            }),

            // Project Information
            new Paragraph({
                text: "Project Information",
                heading: HeadingLevel.HEADING_2,
                color: "000000",
            }),


            createTable([
                ["Project Name", data.project.projectName],
                ["Project No.", data.project.projectNo],
                ["Client Name", data.project.clientName],
                ["Contract Number", data.project.contractNumber],
                ["Project Manager", data.project.contractProjectManager],
                ["Contract Administrator", data.project.contractAdministrator],
                ["Support CA", data.project.supportCA],
                ["Start Date", new Date(data.project.startDate).toLocaleDateString()],
                ["End Date", new Date(data.project.endDate).toLocaleDateString()],
                ["Report No.", data.reportNo],
                ["Onshore/Offshore", data.onShore],
                ["Weather", `${data.tempHigh} / ${data.tempLow} (${data.weather})`],
                ["Working Day", data.workingDay],
            ]),

            // Contractor Details Section
            new Paragraph({
                text: "Contractor Details",
                heading: HeadingLevel.HEADING_2,
                color: "000000",
                spacing: { before: 400 },
            }),
            ...data.contractorDetails.map((contractor) => [
                new Paragraph({
                    text: `Contractor: ${contractor.contractorName}`,
                    heading: HeadingLevel.HEADING_5,
                    color: "000000",
                }),
                createTable(
                    [["Labour Role", "Quantity", "Hours", "Total Hours"]].concat(
                        contractor.labours.map(labour => [
                            labour.role,
                            labour.quantity.toString(),
                            labour.hours.toString(),
                            labour.totalHours.toString(),
                        ])
                    )
                ),
            ]).flat(),

            // Equipment Details
            new Paragraph({
                text: "Equipment Details",
                heading: HeadingLevel.HEADING_2,
                color: "000000",
                spacing: { before: 400 },
            }),
            createTable(
                [["Equipment Name", "Quantity", "Hours", "Total Hours"]].concat(
                    data.equipments.map(equipment => [
                        equipment.equipmentName,
                        equipment.quantity.toString(),
                        equipment.hours.toString(),
                        equipment.totalHours.toString(),
                    ])
                )
            ),

            // Visitors Section
            new Paragraph({
                text: "Visitors",
                heading: HeadingLevel.HEADING_2,
                color: "000000",
                spacing: { before: 400 },
            }),
            createTable(
                [["Visitor Name", "Company", "Total Hours"]].concat(
                    data.visitors.map(visitor => [
                        visitor.visitorName,
                        visitor.visitorCompany || "N/A",
                        visitor.totalHours.toString(),
                    ])
                )
            ),

            // Description Section
            new Paragraph({
                text: "Description",
                heading: HeadingLevel.HEADING_2,
                color: "000000",
                spacing: { before: 400 },
            }),
            new Paragraph({
                text: data.description,
                color: "000000",
            }),
        ],
    });

    // Save the document
    const buffer = await Packer.toBuffer(doc).then((buffer) => {
        fs.writeFileSync("/Daily_Inspection_Report.docx", buffer);
        console.log("Inspection report created successfully.");
    });
    return buffer;
};

// Helper function to create tables
const createTable = (rowsData) => {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rowsData.map(row => new TableRow({
            children: row.map(cellText => new TableCell({
                children: [new Paragraph({ text: cellText, color: "000000" })],
                shading: { fill: "FFFFFF" },  // White background
                borders: defaultBlackBorders(),
            })),
        })),
    });
};

// Black border styles for table cells
const defaultBlackBorders = () => ({
    top: { color: "000000", size: 1 },
    bottom: { color: "000000", size: 1 },
    left: { color: "000000", size: 1 },
    right: { color: "000000", size: 1 },
});

// Helper for cells with no borders
const noBorders = () => ({
    top: { size: 0 },
    bottom: { size: 0 },
    left: { size: 0 },
    right: { size: 0 },
});

// Fetch remote image helper


module.exports = generateInspectionReport;
