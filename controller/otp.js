import twilio from 'twilio';
import users from '../models/auth.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const client = twilio(accountSid, authToken);

export const sendOtp = async (req, res) => {
  const { phone } = req.body;
  try {
    if (!phone || !/^\+\d{10,15}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format. Use +<countrycode><number>' });
    }
    const verification = await client.verify.v2.services(serviceSid)
      .verifications.create({ to: phone, channel: 'sms' });
    res.json({ status: verification.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { phone, code } = req.body;
  try {
    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone and code are required.' });
    }
    const verification_check = await client.verify.v2.services(serviceSid)
      .verificationChecks.create({ to: phone, code });
    if (verification_check.status === 'approved') {
      // Optionally update user as verified
      await users.findOneAndUpdate({ phone }, { $set: { otp: null, otpExpires: null } });
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
