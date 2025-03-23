const { Document, Packer, Paragraph, Table, TableRow, TableCell, AlignmentType, WidthType, HeadingLevel, ImageRun } = require('docx');
const fs = require('fs');
const { fetchRemoteImage } = require("../common.util");
const generateWeeklyReport = async (data) => {
    // Initialize sections array properly
    const sections = [];
    for (let i = 0; i < data.length; i++) {
        const projectData = data[i];
        const projectHeaderSection = [
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            // Logo Column (20% width)
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                data: await fetchRemoteImage("https://img.freepik.com/free-vector/bird-colorful-logo-gradient-vector_343694-1365.jpg"), // Logo URL
                                                transformation: { width: 120, height: 70 }, // Adjust size if needed
                                            }),
                                        ],
                                        alignment: AlignmentType.LEFT,
                                    }),
                                ],
                                width: { size: 20, type: WidthType.PERCENTAGE },
                                borders: { top: { size: 0 }, bottom: { size: 0 }, left: { size: 0 }, right: { size: 0 } }, // No borders
                            }),
        
                            // Project Details Column (80% width)
                            new TableCell({
                                children: [
                                    new Table({
                                        width: { size: 100, type: WidthType.PERCENTAGE },
                                        rows: [
                                            // Left Half of Project Details
                                            new TableRow({
                                                children: [
                                                    new TableCell({
                                                        children: [
                                                            new Paragraph({
                                                                text: `Project Name: ${projectData.project.projectName}`,
                                                                bold: true,
                                                            }),
                                                            new Paragraph({
                                                                text: `Client Name: ${projectData.project.clientName}`,
                                                            }),
                                                            new Paragraph({
                                                                text: `Project No: ${projectData.project.projectNo}`,
                                                            }),
                                                            new Paragraph({
                                                                text: `Contract Number: ${projectData.project.contractNumber}`,
                                                            }),
                                                        ],
                                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                                        borders: { top: { size: 0 }, bottom: { size: 0 }, left: { size: 0 }, right: { size: 0 } }, // No borders
                                                    }),
        
                                                    // Right Half of Project Details
                                                    new TableCell({
                                                        children: [
                                                            new Paragraph({
                                                                text: `Associated Project Manager: ${projectData.project.contractProjectManager}`,
                                                            }),
                                                            new Paragraph({
                                                                text: `Contract Administrator: ${projectData.project.contractAdministrator}`,
                                                            }),
                                                            new Paragraph({
                                                                text: `Support CA: ${projectData.project.supportCA}`,
                                                            }),
                                                            new Paragraph({
                                                                text: `Start Date: ${new Date(projectData.project.startDate).toLocaleDateString()}`,
                                                            }),
                                                            new Paragraph({
                                                                text: `End Date: ${new Date(projectData.project.endDate).toLocaleDateString()}`,
                                                            }),
                                                        ],
                                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                                        borders: { top: { size: 0 }, bottom: { size: 0 }, left: { size: 0 }, right: { size: 0 } }, // No borders
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                ],
                                width: { size: 80, type: WidthType.PERCENTAGE },
                                margins: { left: 200 }, // Add small space between logo and text
                                borders: { top: { size: 0 }, bottom: { size: 0 }, left: { size: 0 }, right: { size: 0 } }, // No borders
                            }),
                             // Logo Column (20% width)
                             new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                data: await fetchRemoteImage("https://img.freepik.com/free-vector/bird-colorful-logo-gradient-vector_343694-1365.jpg"), // Logo URL
                                                transformation: { width: 120, height: 70 }, // Adjust size if needed
                                            }),
                                        ],
                                        alignment: AlignmentType.LEFT,
                                    }),
                                ],
                                width: { size: 20, type: WidthType.PERCENTAGE },
                                borders: { top: { size: 0 }, bottom: { size: 0 }, left: { size: 0 }, right: { size: 0 } }, // No borders
                            })
        
                        ],
                    }),
                ],
            }),
            new Paragraph({ text: " " }), // Space between sections
        ];
        
        
        
        
        // Grouped Reports Section
        const groupedReportsContent = [];
        for (const [day, reports] of Object.entries(projectData.groupedReports)) {
            

            if (reports.length === 0) {
                // groupedReportsContent.push(new Paragraph({ text: "No reports for this day." }));
            } else {
                groupedReportsContent.push(new Paragraph({
                    text: day,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { after: 200 },
                }));
                reports.forEach((report) => {
                    groupedReportsContent.push(
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Date")] }),
                                        new TableCell({ children: [new Paragraph(new Date(report.selectedDate).toLocaleDateString())] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Location")] }),
                                        new TableCell({ children: [new Paragraph(report.location)] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Onshore/Offshore")] }),
                                        new TableCell({ children: [new Paragraph(report.onShore)] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Temperature High/Low")] }),
                                        new TableCell({ children: [new Paragraph(`${report.tempHigh} / ${report.tempLow}`)] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Weather")] }),
                                        new TableCell({ children: [new Paragraph(report.weather)] }),
                                    ],
                                }),
                            ],
                        })
                    );

                    // Contractor Details Section
                    groupedReportsContent.push(new Paragraph({
                        text: "Contractor Details",
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 400 },
                    }));

                    report.contractorDetails.forEach((contractor , i) => {
                        // if(i > 0){
                            groupedReportsContent.push(new Paragraph({ text: " " }));// Space between sections
                        // }
                        groupedReportsContent.push(new Paragraph({ text: `Contractor: ${contractor.contractorName}` }));
                        // groupedReportsContent.push(new Paragraph({ text: " " }));// Space between sections
                        groupedReportsContent.push(
                            new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({ children: [new Paragraph("Labour Role")] }),
                                            new TableCell({ children: [new Paragraph("Quantity")] }),
                                            new TableCell({ children: [new Paragraph("Hours")] }),
                                            new TableCell({ children: [new Paragraph("Total Hours")] }),
                                        ],
                                    }),
                                    ...contractor.labours.map((labour) =>
                                        new TableRow({
                                            children: [
                                                new TableCell({ children: [new Paragraph(labour.role)] }),
                                                new TableCell({ children: [new Paragraph(labour.quantity.toString())] }),
                                                new TableCell({ children: [new Paragraph(labour.hours.toString())] }),
                                                new TableCell({ children: [new Paragraph(labour.totalHours.toString())] }),
                                            ],
                                        })
                                    ),
                                ],
                            })
                        );
                    });

                    // Equipment Details
                    groupedReportsContent.push(new Paragraph({
                        text: "Equipment Details",
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 400 },
                    }));
                    groupedReportsContent.push(
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Equipment Name")] }),
                                        new TableCell({ children: [new Paragraph("Quantity")] }),
                                        new TableCell({ children: [new Paragraph("Hours")] }),
                                        new TableCell({ children: [new Paragraph("Total Hours")] }),
                                    ],
                                }),
                                ...report.equipments.map((equipment) =>
                                    new TableRow({
                                        children: [
                                            new TableCell({ children: [new Paragraph(equipment.equipmentName)] }),
                                            new TableCell({ children: [new Paragraph(equipment.quantity.toString())] }),
                                            new TableCell({ children: [new Paragraph(equipment.hours.toString())] }),
                                            new TableCell({ children: [new Paragraph(equipment.totalHours.toString())] }),
                                        ],
                                    })
                                ),
                            ],
                        })
                    );

                    // Visitors Section
                    groupedReportsContent.push(new Paragraph({
                        text: "Visitors",
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 400 },
                    }));
                    groupedReportsContent.push(
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Visitor Name")] }),
                                        new TableCell({ children: [new Paragraph("Company")] }),
                                        new TableCell({ children: [new Paragraph("Total Hours")] }),
                                    ],
                                }),
                                ...report.visitors.map((visitor) =>
                                    new TableRow({
                                        children: [
                                            new TableCell({ children: [new Paragraph(visitor.visitorName)] }),
                                            new TableCell({ children: [new Paragraph(visitor.visitorCompany || "N/A")] }),
                                            new TableCell({ children: [new Paragraph(visitor.totalHours.toString())] }),
                                        ],
                                    })
                                ),
                            ],
                        })
                    );
                });
            }
        }

        // Image Section with grid layout (2 images per row)
        const imageRows = [];
        const images = projectData.project.images;

        for (let i = 0; i < images.length; i += 2) {
            const imageRow = new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: await fetchRemoteImage(images[i].photo),
                                        transformation: { width: 250, height: 180 },
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }),
                            new Paragraph({
                                text: images[i].description,
                                alignment: AlignmentType.CENTER,
                            }),
                        ],
                    }),
                    i + 1 < images.length
                        ? new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: await fetchRemoteImage(images[i + 1].photo),
                                            transformation: { width: 250, height: 180 },
                                        }),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                }),
                                new Paragraph({
                                    text: images[i + 1].description,
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                        })
                        : new TableCell({ children: [new Paragraph(" ")] }), // Empty cell if no second image
                ],
            });

            imageRows.push(imageRow);
        }

        const imageSection = [
            new Paragraph({
                text: "Image and Description Section",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 600, after: 400 },
            }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: imageRows,
            }),
        ];

        sections.push({
            properties: { pageBreakBefore: true },
            children: [...projectHeaderSection, ...groupedReportsContent, ...imageSection],
        });
    }

    const doc = new Document({ sections });

    // Generate and save the document
    const buffer = Packer.toBuffer(doc).then((buffer) => {
        fs.writeFileSync("./weekly_Inspection_Report.docx", buffer);
        console.log("Weekly inspection report created successfully.");
    });
    return buffer;
};

module.exports = generateWeeklyReport;
