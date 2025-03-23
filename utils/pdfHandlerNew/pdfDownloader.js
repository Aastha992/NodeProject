const puppeteer = require('puppeteer');
// const fs = require('fs');

// Function to generate PDF from HTML
async function generatePDF(htmlContent, outputPath) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Enable local file access for images
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Wait for images to load
    await page.evaluate(async () => {
        const images = Array.from(document.images);
        await Promise.all(images.map(img => {
            if (img.complete) return;
            return new Promise(resolve => {
                img.onload = img.onerror = resolve;
            });
        }));
    });

    // Generate PDF
    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true
    });

    await browser.close();
    console.log(`PDF generated at: ${outputPath}`);
    return outputPath;
}

module.exports = { generatePDF };
