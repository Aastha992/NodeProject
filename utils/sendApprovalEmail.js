const nodemailer = require('nodemailer');
require('dotenv').config();

const sendApprovalEmail = async (to, subject, html) => {
    console.log("Attempting to send approval email...");
    console.log("Sending email to:", to);
    console.log("Email Subject:", subject);

    // Log SMTP details to confirm environment variables
    console.log("SMTP details loaded:", {
        host: process.env.EMAIL_HOST_2,
        port: process.env.EMAIL_PORT_2,
        user: process.env.EMAIL_USER_2,
        pass: process.env.EMAIL_PASS_2 ? "Loaded" : "Missing"
    });

    let transporter;

    try {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST_2,
            port: Number(process.env.EMAIL_PORT_2),
            secure: Number(process.env.EMAIL_PORT_2) === 465,
            auth: {
                user: process.env.EMAIL_USER_2,
                pass: process.env.EMAIL_PASS_2,
            },
           tls: {
                rejectUnauthorized: false
}

        });

        const mailOptions = {
            from: process.env.EMAIL_USER_2,
            to,
            subject,
            html,
        };

        try {  // Inner try...catch for sendMail
            const info = await transporter.sendMail(mailOptions);
            console.log("Email sent:", info.response);
        } catch (sendError) {
            console.error("Error sending email:", sendError);
        }

    } catch (transportError) {
        console.error("Error creating transporter:", transportError);
        return;
    }
};

module.exports = { sendApprovalEmail };