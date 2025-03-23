const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();  // Load environment variables

const sendEmails = (email, code) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,  // Use SMTP settings from .env
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',  // true for SSL, false for TLS
    auth: {
      user: process.env.EMAIL_USER,  // From email address (e.g., info@kps.ca)
      pass: process.env.EMAIL_PASS,  // Email password from .env
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,  // Sender's email address
    to: email,                     // Recipient's email address
    subject: 'Password Reset Verification Code',  // Subject of the email
    text: `Your verification code is: ${code}`,  // Email body
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

module.exports = sendEmails;
