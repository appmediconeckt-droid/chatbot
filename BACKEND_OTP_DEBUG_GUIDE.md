# Backend OTP 500 Error - Complete Debugging Guide

## 🔍 Step 1: Check Backend Server Logs

### **Where to Look:**
```
1. Terminal/Console where backend is running
2. Log files in backend directory
3. Docker logs (if using Docker)
4. PM2 logs (if using PM2)
```

### **Check Terminal Output**
Look for error messages like:
```
❌ Error in generateOtp:
❌ Cannot send email:
❌ SMTP Error:
❌ Database Error:
❌ TypeError:
❌ ReferenceError:
```

### **Copy the Full Error Message**
The error might look like:
```
Error: SMTP login failed: Invalid credentials
Error: Email service not configured
Error: Cannot find user with that email
TypeError: Cannot read property 'email' of undefined
```

---

## 🔧 Step 2: Common OTP Backend Issues & Fixes

### **Issue 1: Email Service Not Configured**

**Error:** 
```
Error: SMTP connection error / Cannot connect to email service
```

**Fix:**
Create or update `.env` file in backend:
```
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@chatbot.com
MAIL_SERVICE=gmail

# Or use SendGrid:
SENDGRID_API_KEY=your-sendgrid-api-key

# Or use other provider:
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain.com
```

**For Gmail:**
1. Enable 2FA on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use that as SMTP_PASSWORD

### **Issue 2: Database Error**

**Error:**
```
Error: Cannot find user / User not in database
MongoError: connection refused
```

**Fix:**
```javascript
// Check in backend code:
const user = await User.findOne({ email: normalizedEmail });
if (!user) {
  return res.status(404).json({ 
    success: false, 
    message: 'User not found' 
  });
}
```

### **Issue 3: OTP Collection Not Created**

**Error:**
```
Error: Collection 'otp' not found
MongoError: ns does not exist
```

**Fix:**
```javascript
// Backend should create OTP collection if it doesn't exist:
const otpSchema = new Schema({
  email: String,
  otp: String,
  expiresAt: Date,
  attempts: Number
});

const OTP = mongoose.model('OTP', otpSchema);
```

### **Issue 4: Email Template Missing**

**Error:**
```
Error: Cannot find email template
ReferenceError: emailTemplate is not defined
```

**Fix:**
```javascript
// Create email template in backend:
const emailTemplate = `
  <h1>Your OTP Code</h1>
  <p>Your OTP is: <strong>${otp}</strong></p>
  <p>This code expires in 10 minutes.</p>
`;
```

### **Issue 5: Rate Limiting**

**Error:**
```
Error: Too many OTP requests
429 Too Many Requests
```

**Fix:**
```javascript
// Check rate limiting in backend:
// Should have mechanism like:
const otpAttempts = await OTP.countDocuments({ 
  email, 
  createdAt: { $gt: Date.now() - 60000 } // Last 1 minute
});

if (otpAttempts >= 3) {
  return res.status(429).json({ 
    success: false, 
    message: 'Too many attempts. Try again later.' 
  });
}
```

---

## 📋 Step 3: Debug Checklist

Run through these checks:

- [ ] **Check Backend Logs**
  ```bash
  # If running locally:
  npm run dev
  # Look at console output
  
  # If using PM2:
  pm2 logs
  
  # If using Docker:
  docker logs container-name
  ```

- [ ] **Verify .env Variables**
  ```bash
  # Backend root directory should have .env with:
  SMTP_HOST=...
  SMTP_PORT=...
  SMTP_USER=...
  SMTP_PASSWORD=...
  DB_URI=...
  JWT_SECRET=...
  ```

- [ ] **Test Email Service**
  ```bash
  # In backend terminal:
  node -e "require('nodemailer').createTransport({...}).verify((err, success) => console.log(err || success))"
  ```

- [ ] **Check Database**
  ```bash
  # MongoDB:
  db.users.findOne({email: "test@example.com"})
  
  # If user doesn't exist, create one first
  ```

- [ ] **Restart Backend Server**
  ```bash
  npm run dev
  # or
  pm2 restart all
  # or
  docker restart container-name
  ```

- [ ] **Test OTP Endpoint**
  ```bash
  curl -X POST http://localhost:5000/api/auth/generateOtp \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"email": "test@example.com"}'
  ```

---

## 🔌 Step 4: Backend Code Example (Node.js/Express)

Here's a working OTP endpoint:

```javascript
// routes/auth.js
router.post('/generateOtp', async (req, res) => {
  try {
    console.log('📧 generateOtp called with:', req.body);

    const { email } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('✅ Generated OTP:', otp);

    // Save OTP to database
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send email
    await sendEmail({
      to: email,
      subject: 'Your OTP Code',
      html: `<h1>Your OTP: <strong>${otp}</strong></h1>`
    });

    console.log('📧 Email sent to:', email);

    return res.json({ 
      success: true, 
      message: 'OTP sent to your email' 
    });

  } catch (error) {
    console.error('❌ Error in generateOtp:', error.message);
    console.error('Stack:', error.stack);

    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
```

---

## 📱 Frontend (Already Fixed)

The frontend now shows:
- ✅ Better error messages
- ✅ Console logging
- ✅ User-friendly errors
- ✅ Detailed error reporting

---

## 🎯 Next Steps

1. **Find the error message** in backend logs
2. **Match it to one of the issues above**
3. **Apply the fix**
4. **Restart backend server**
5. **Test in browser**

---

## 📞 If Stuck

Copy from backend console/logs:
```
1. Full error message
2. Stack trace
3. What endpoint/function failed
4. Request body being sent
```

Then we can fix it!
