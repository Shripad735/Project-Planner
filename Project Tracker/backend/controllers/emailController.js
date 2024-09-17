const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const mysql = require("mysql2/promise"); // Ensure you have mysql2 installed
const md5 = require("md5");
dotenv.config();

let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const saveOTPToDatabase = async (userId, email, otp) => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  });

  try {
    const query = `
      INSERT INTO otps (userid, email, otp, createdAt, expiresAt)
      VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    `;
    await connection.execute(query, [userId, email, otp]);
  } catch (error) {
    console.error("Error saving OTP to database:", error);
    throw new Error("Database error");
  } finally {
    await connection.end();
  }
};

const getUserIdAndUsername = async (email) => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  });

  try {
    const query = `SELECT userid, username FROM users WHERE email = ?`;
    const [rows] = await connection.execute(query, [email]);

    if (rows.length === 0) {
      throw new Error("User not found");
    }

    return { userId: rows[0].userid, username: rows[0].username };
  } catch (error) {
    console.error("Error retrieving user information:", error);
    throw new Error("Invalid OTP");
  } finally {
    await connection.end();
  }
};

exports.sendOTP = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const { userId, username } = await getUserIdAndUsername(email);
    const otp = generateOTP();
    await saveOTPToDatabase(userId, email, otp);

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #34495e;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #eff7b8;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .logo {
              max-width: 150px;
              height: auto;
            }
            h1 {
              color: #2c3e50;
              margin-bottom: 20px;
            }
            .otp-container {
              background-color: #2c3e50;
              color: #ffffff;
              font-size: 24px;
              font-weight: bold;
              text-align: center;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #7f8c8d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <p>Dear ${username},</p>
            <p>We received a request to reset your password for your Project Tracker account. To proceed with resetting your password, please use the following One-Time Password (OTP):</p>
            <div class="otp-container">
              ${otp}
            </div>
            <p>This OTP is valid for the next 10 minutes. If you did not request a password reset, please ignore this email or contact our support team immediately.</p>
            <p>For security reasons, please do not share this OTP with anyone.</p>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The Project Tracker Team</p>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Project Tracker. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res
      .status(500)
      .json({ message: "Failed to send OTP. Please try again later." });
  }
});

const verifyOTPFromDatabase = async (email, otp) => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  });

  try {
    const query = `SELECT * FROM otps WHERE email = ? AND otp = ? AND expiresAt > NOW()`;
    const [rows] = await connection.execute(query, [email, otp]);

    if (rows.length === 0) {
      throw new Error("Invalid or expired OTP");
    }
  } catch (error) {
    console.error("Error verifying OTP from database:", error);
    throw new Error("Database error");
  } finally {
    await connection.end();
  }
};

const resetPasswordInDatabase = async (email, newPassword) => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  });

  try {
    const hashedPassword = md5(newPassword); // Use MD5 hashing here
    const query = `UPDATE users SET password = ? WHERE email = ?`;
    await connection.execute(query, [hashedPassword, email]);
  } catch (error) {
    console.error("Error resetting password in database:", error);
    throw new Error("Database error");
  } finally {
    await connection.end();
  }
};

exports.verifyOtp = expressAsyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    await verifyOTPFromDatabase(email, otp);
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(400).json({ message: error.message });
  }
});

exports.resetPassword = expressAsyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email and new password are required" });
  }

  try {
    await resetPasswordInDatabase(email, newPassword);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res
      .status(500)
      .json({ message: "Failed to reset password. Please try again later." });
  }
});
