const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');
const common = require("./common.util");
// Function to fetch, analyze the image, and overlay the text
async function fetchAndOverlayImage({ imageUrl, locationText, timestampText }) {
    try {
        let imageBuffer;
        // Step 1: Fetch the image from the web
        if (Buffer.isBuffer(imageUrl)) {
            console.log("Input is already a buffer.");
            imageBuffer = imageUrl;
        } else {
            const response = await common.fetchRemoteImage(imageUrl);

            imageBuffer = Buffer.from(response.data);
        }


        // Step 2: Get image dimensions using Sharp
        const metadata = await sharp(imageBuffer).metadata();
        const width = metadata.width || 800;
        const height = metadata.height || 600;

        // Step 3: Create a canvas
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Step 4: Load and draw the image onto the canvas
        const image = await loadImage(imageBuffer);
        ctx.drawImage(image, 0, 0, width, height);

        // Step 5: Sample a small pixel region (10x10 px) to check background color
        const imageData = ctx.getImageData(10, 10, 10, 10).data;
        let [r, g, b] = [0, 0, 0];

        // Calculate the average RGB values
        for (let i = 0; i < imageData.length; i += 4) {
            r += imageData[i];     // Red
            g += imageData[i + 1]; // Green
            b += imageData[i + 2]; // Blue
        }
        r /= (imageData.length / 4);
        g /= (imageData.length / 4);
        b /= (imageData.length / 4);

        // Step 6: Improved yellowish detection (including subtle yellows)
        const brightness = (r + g + b) / 3;
        const isYellowish = (
            r >= 150 && g >= 150 && b <= 180 && brightness > 150
        );

        // Step 7: Set the text color based on the background detection
        const textColor = isYellowish ? 'black' : 'yellow';// Black for yellowish backgrounds, Orange otherwise


        // Step 7: Add the location and timestamp text
        ctx.font = '32px Arial';
        ctx.fillStyle = textColor;

        // Top-right corner: Location
        const locationTextWidth = ctx.measureText(locationText).width;
        ctx.fillText(locationText, width - locationTextWidth - 20, 40);

        // Bottom-right corner: Timestamp
        const timestampTextWidth = ctx.measureText(timestampText).width;
        ctx.fillText(timestampText, width - timestampTextWidth - 20, height - 20);

        // Step 8: Convert the canvas to a buffer and save it using Sharp
        const finalBuffer = canvas.toBuffer();
        // await sharp(finalBuffer).toFile('output_image.png');

        console.log('Image with text overlay saved as output_image.png');
        return finalBuffer;
    } catch (error) {
        console.error('Error fetching or processing image:', error);
    }
}
module.exports = fetchAndOverlayImage;

// Provide the image URL to test the function
// fetchAndOverlayImage('https://images.pexels.com/photos/93400/pexels-photo-93400.jpeg?auto=compress&cs=tinysrgb&w=600');
