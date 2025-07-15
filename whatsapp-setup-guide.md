# WhatsApp Business API Setup Guide

## 🚨 Current Issue: Test Mode Limitations

Your WhatsApp Business account is currently in **test mode**, which means:
- ❌ Can only send messages to test phone numbers
- ❌ Cannot send to regular phone numbers
- ❌ Limited to "Hello World" template

## 🔧 Solutions

### **Option 1: Add Your Phone as Test Number (Quick Fix)**

1. **Go to Meta for Developers Dashboard**
   - Visit: https://developers.facebook.com/
   - Navigate to your app → WhatsApp → Configuration

2. **Add Test Phone Number**
   - Go to **Phone Numbers** section
   - Find your business phone number
   - Add `+393761024080` as a **test phone number**
   - Save the changes

3. **Test Again**
   - Run the test script again
   - You should now receive messages

### **Option 2: Business Verification (Production Ready)**

1. **Verify Your Business**
   - Go to **Business Settings** → **Business Info**
   - Complete business verification process
   - Submit required documents

2. **Request Production Access**
   - Go to **WhatsApp** → **Getting Started**
   - Click **"Request Production Access"**
   - Fill out the application form

3. **Create Custom Templates**
   - Go to **Message Templates**
   - Create templates for:
     - Appointment reminders
     - Confirmation messages
     - General notifications

### **Option 3: Test with 24-Hour Window**

1. **Message Your Business Number**
   - Send a message to your WhatsApp Business number
   - This opens a 24-hour window for free-form messages

2. **Test Within 24 Hours**
   - Run the test script within 24 hours
   - You should receive the message

## 📋 Required Steps for Production

### **1. Business Verification**
```
✅ Business name verification
✅ Address verification  
✅ Phone number verification
✅ Business category selection
```

### **2. Message Templates**
Create these templates for your salon:
```
- appointment_reminder
- appointment_confirmation
- appointment_cancellation
- general_notification
```

### **3. Production Access**
```
✅ Submit business verification
✅ Wait for Meta review (1-3 days)
✅ Get approved for production
✅ Start sending to any phone number
```

## 🧪 Testing Steps

### **Step 1: Add Test Number**
1. Add `+393761024080` as test number
2. Run: `node test-template-message.mjs`
3. Check if you receive the message

### **Step 2: Test 24-Hour Window**
1. Send a message to your business number
2. Run: `node test-whatsapp-simple.mjs`
3. Check if you receive the message

### **Step 3: Production Setup**
1. Complete business verification
2. Create custom templates
3. Request production access
4. Test with real clients

## 📞 Support

If you need help:
1. **Meta Developer Support**: https://developers.facebook.com/support/
2. **WhatsApp Business API Documentation**: https://developers.facebook.com/docs/whatsapp
3. **Business Verification Guide**: https://developers.facebook.com/docs/whatsapp/overview/business-accounts

## 🎯 Next Steps

1. **Immediate**: Add your phone as test number
2. **Short-term**: Complete business verification
3. **Long-term**: Create custom message templates
4. **Production**: Request production access

Your salon management system is ready - we just need to complete the WhatsApp Business setup! 