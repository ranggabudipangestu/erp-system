# Email Setup Guide for Invitation System

## Quick Setup for Development

The invitation system is configured to work in **development mode** by default. When email credentials are not configured, emails will be **logged to the console** instead of being sent. This allows you to test the invitation flow without email setup.

## Testing Without Email Configuration

1. **Start your backend server**
2. **Create an invitation** - The email content will be logged to the console
3. **Copy the invitation link** from the console logs  
4. **Paste the link in your browser** to test the acceptance flow

Look for logs like this in your backend console:
```
=== EMAIL WOULD BE SENT ===
To: user@example.com
Subject: Invitation to join Company Name on ERP System
Content: [Full email content with invitation link]
=========================
```

## Email Provider Setup (Optional)

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail" 
3. **Update your `.env` file**:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   FROM_EMAIL=your-email@gmail.com
   ```

### Option 2: Outlook/Hotmail

```env
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
FROM_EMAIL=your-email@outlook.com
```

### Option 3: Custom SMTP

```env
SMTP_SERVER=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
FROM_EMAIL=your-email@domain.com
```

## Configuration Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SMTP_SERVER` | SMTP server hostname | `smtp.gmail.com` | No* |
| `SMTP_PORT` | SMTP server port | `587` | No* |
| `SMTP_USER` | Email username | Empty | No* |
| `SMTP_PASSWORD` | Email password | Empty | No* |
| `FROM_EMAIL` | Sender email address | Same as `SMTP_USER` | No* |
| `FROM_NAME` | Sender display name | `ERP System` | No |
| `FRONTEND_URL` | Frontend URL for links | `http://localhost:3000` | No |
| `EMAIL_DEBUG` | Enable debug logging | `true` | No |

*\* If not provided, emails will be logged instead of sent*

## Troubleshooting

### Email Not Sending

1. **Check Console Logs** - Look for detailed error messages
2. **Verify Credentials** - Ensure username/password are correct
3. **Check App Passwords** - Gmail requires app passwords, not regular passwords
4. **Firewall/Network** - Ensure SMTP ports (587/465) are not blocked
5. **Enable Less Secure Apps** - Some providers require this setting

### Common Error Messages

- **"Authentication failed"** → Wrong username/password
- **"Connection refused"** → Wrong SMTP server/port
- **"SSL/TLS errors"** → Try different ports (465 for SSL, 587 for TLS)

### Debug Mode

Set `EMAIL_DEBUG=true` in your `.env` file to see detailed SMTP logs:

```env
EMAIL_DEBUG=true
```

This will show:
- SMTP connection attempts
- Authentication steps  
- Email sending progress
- Full error details

## Testing the Complete Flow

1. **Backend Setup**:
   ```bash
   cd backend
   # Make sure your .env file has email settings
   python -m uvicorn app.main:app --reload --port 8000
   ```

2. **Frontend Setup**:
   ```bash
   cd ui/erp-dashboard
   npm run dev
   ```

3. **Test Invitation**:
   - Go to `http://localhost:3000/users` (admin page)
   - Click "Invite User"
   - Fill out the form
   - Check backend console for email content
   - Copy invitation link and test acceptance

## Production Deployment

For production, consider:

1. **Environment Variables** - Set via deployment platform
2. **Email Service** - Use services like SendGrid, Mailgun, or AWS SES
3. **Security** - Store credentials securely, not in code
4. **Monitoring** - Log email sending failures
5. **Rate Limiting** - Prevent spam/abuse

Example production config:
```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Company Name
EMAIL_DEBUG=false
```

## Email Template Customization

The email templates are in `backend/app/modules/auth/email_service.py`:

- `_create_invitation_html_template()` - HTML version
- `_create_invitation_text_template()` - Plain text version

You can customize:
- Company branding
- Email styling
- Content and messaging
- Additional information

## Security Notes

- **Never commit email passwords** to version control
- **Use app passwords** instead of regular passwords when possible
- **Enable 2FA** on email accounts used for sending
- **Monitor email sending** for abuse/spam
- **Implement rate limiting** in production