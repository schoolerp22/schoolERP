import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'blurrystar007@gmail.com',
        pass: process.env.EMAIL_PASS // User must set this in .env
    }
});

export const sendSignupSuccessEmail = async (email, name, role) => {
    const subject = `Welcome to School ERP - Registration Successful`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Welcome to School ERP!</h2>
      <p>Hello ${name},</p>
      <p>Your account has been successfully created as a <strong>${role}</strong>.</p>
      <p>You can now login to your dashboard using your credentials.</p>
      <p>If you signed up with Google, use the "Sign in with Google" button.</p>
      <br/>
      <p>Best regards,</p>
      <p>School ERP Team</p>
    </div>
  `;

    try {
        await transporter.sendMail({
            from: 'School ERP <blurrystar007@gmail.com>',
            to: email,
            subject,
            html
        });
        console.log(`Signup email sent to ${email}`);
    } catch (error) {
        console.error('Error sending signup email:', error);
    }
};

export const sendOTPEmail = async (email, otp) => {
    const subject = `Password Reset OTP - School ERP`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Password Reset Request</h2>
      <p>You requested to reset your password. Use the OTP below to proceed:</p>
      <h1 style="background-color: #F3F4F6; padding: 10px 20px; display: inline-block; letter-spacing: 5px; border-radius: 5px;">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <br/>
      <p>Best regards,</p>
      <p>School ERP Team</p>
    </div>
  `;

    try {
        await transporter.sendMail({
            from: 'School ERP <blurrystar007@gmail.com>',
            to: email,
            subject,
            html
        });
        console.log(`OTP email sent to ${email}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
};
