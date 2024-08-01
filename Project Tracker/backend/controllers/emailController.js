const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const mysql = require("mysql2/promise"); // Ensure you have mysql2 installed
const md5 = require('md5');
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

const saveOTPToDatabase = async (email, otp) => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const query = `
      INSERT INTO otps (email, otp, createdAt, expiresAt)
      VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    `;
    await connection.execute(query, [email, otp]);
  } catch (error) {
    console.error('Error saving OTP to database:', error);
    throw new Error('Database error');
  } finally {
    await connection.end();
  }
};

const verifyOTPFromDatabase = async (email, otp) => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const query = `SELECT * FROM otps WHERE email = ? AND otp = ? AND expiresAt > NOW()`;
    const [rows] = await connection.execute(query, [email, otp]);

    if (rows.length === 0) {
      throw new Error('Invalid or expired OTP');
    }
  } catch (error) {
    console.error('Error verifying OTP from database:', error);
    throw new Error('Database error');
  } finally {
    await connection.end();
  }
};

const resetPasswordInDatabase = async (email, newPassword) => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const hashedPassword = md5(newPassword); // Use MD5 hashing here
    const query = `UPDATE users SET password = ? WHERE email = ?`;
    await connection.execute(query, [hashedPassword, email]);
  } catch (error) {
    console.error('Error resetting password in database:', error);
    throw new Error('Database error');
  } finally {
    await connection.end();
  }
};

exports.sendOTP = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const otp = generateOTP();
    await saveOTPToDatabase(email, otp);

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`,
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong></p><p>This OTP will expire in 10 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again later.' });
  }
});

exports.verifyOtp = expressAsyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    await verifyOTPFromDatabase(email, otp);
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(400).json({ message: error.message });
  }
});


exports.resetPassword = expressAsyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required' });
  }

  try {
    await resetPasswordInDatabase(email, newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Failed to reset password. Please try again later.' });
  }
});
