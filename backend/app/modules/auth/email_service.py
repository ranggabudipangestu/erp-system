import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailService:
    """Email service for sending invitations and other notifications with multiple provider support"""
    
    def __init__(self):
        # Email configuration - in production, these should come from environment variables
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_user)
        self.from_name = os.getenv("FROM_NAME", "ERP System")
        self.debug_mode = os.getenv("EMAIL_DEBUG", "true").lower() == "true"
        
        # Log configuration (but don't log passwords)
        if self.debug_mode:
            logger.info(f"Email service initialized:")
            logger.info(f"  SMTP Server: {self.smtp_server}")
            logger.info(f"  SMTP Port: {self.smtp_port}")
            logger.info(f"  SMTP User: {self.smtp_user}")
            logger.info(f"  From Email: {self.from_email}")
            logger.info(f"  Has Password: {'Yes' if self.smtp_password else 'No'}")
            
        # Validate required configuration
        self._validate_config()
    
    def _validate_config(self):
        """Validate email configuration"""
        if not self.smtp_user or not self.smtp_password:
            logger.warning("Email credentials not configured. Emails will be logged instead of sent.")
        
    def _log_email_instead_of_sending(self, recipient_email: str, subject: str, content: str):
        """Log email content instead of sending when credentials are missing"""
        logger.info(f"""
=== EMAIL WOULD BE SENT ===
To: {recipient_email}
Subject: {subject}
Content:
{content}
=========================
        """)
        
    def send_invitation_email(
        self, 
        recipient_email: str, 
        recipient_name: str, 
        company_name: str, 
        inviter_name: str, 
        invitation_link: str,
        roles: list[str]
    ) -> bool:
        """Send invitation email to new user"""
        
        # If credentials are not configured, log the email instead
        if not self.smtp_user or not self.smtp_password:
            subject = f"Invitation to join {company_name} on ERP System"
            text_content = self._create_invitation_text_template(
                recipient_name=recipient_name or "there",
                company_name=company_name,
                inviter_name=inviter_name,
                invitation_link=invitation_link,
                roles=roles
            )
            self._log_email_instead_of_sending(recipient_email, subject, text_content)
            return True  # Return True for development/testing
        
        try:
            if self.debug_mode:
                logger.info(f"Attempting to send email to {recipient_email}")
                
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"Invitation to join {company_name} on ERP System"
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = recipient_email

            # Create the HTML content
            html_content = self._create_invitation_html_template(
                recipient_name=recipient_name or "there",
                company_name=company_name,
                inviter_name=inviter_name,
                invitation_link=invitation_link,
                roles=roles
            )

            # Create the plain text content
            text_content = self._create_invitation_text_template(
                recipient_name=recipient_name or "there",
                company_name=company_name,
                inviter_name=inviter_name,
                invitation_link=invitation_link,
                roles=roles
            )

            # Turn these into plain/html MIMEText objects
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")

            # Add HTML/plain-text parts to MIMEMultipart message
            message.attach(part1)
            message.attach(part2)

            # Send the email
            if self.debug_mode:
                logger.info(f"Connecting to SMTP server {self.smtp_server}:{self.smtp_port}")
                
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.debug_mode:
                    server.set_debuglevel(1)
                    
                server.starttls(context=ssl.create_default_context())
                
                if self.debug_mode:
                    logger.info(f"Logging in with user: {self.smtp_user}")
                    
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)

            if self.debug_mode:
                logger.info(f"Email sent successfully to {recipient_email}")
                
            return True
            
        except Exception as e:
            error_msg = f"Failed to send invitation email to {recipient_email}: {str(e)}"
            logger.error(error_msg)
            
            # In development, also log the email content for debugging
            if self.debug_mode:
                subject = f"Invitation to join {company_name} on ERP System"
                text_content = self._create_invitation_text_template(
                    recipient_name=recipient_name or "there",
                    company_name=company_name,
                    inviter_name=inviter_name,
                    invitation_link=invitation_link,
                    roles=roles
                )
                logger.info("Email content that failed to send:")
                self._log_email_instead_of_sending(recipient_email, subject, text_content)
                
            return False

    def _create_invitation_html_template(
        self, 
        recipient_name: str, 
        company_name: str, 
        inviter_name: str, 
        invitation_link: str,
        roles: list[str]
    ) -> str:
        """Create HTML template for invitation email"""
        
        roles_text = ", ".join(roles) if roles else "team member"
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Join {company_name} on ERP System</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    text-align: center;
                    padding: 20px 0;
                    border-bottom: 2px solid #f0f0f0;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 24px;
                    font-weight: bold;
                    color: #2563eb;
                }}
                .content {{
                    padding: 20px 0;
                }}
                .button {{
                    display: inline-block;
                    background-color: #2563eb;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 500;
                    margin: 20px 0;
                }}
                .button:hover {{
                    background-color: #1d4ed8;
                }}
                .info-box {{
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 16px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    font-size: 14px;
                    color: #6b7280;
                    border-top: 1px solid #f0f0f0;
                    padding-top: 20px;
                    margin-top: 40px;
                }}
                .warning {{
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🏢 ERP System</div>
            </div>
            
            <div class="content">
                <h2>You're invited to join {company_name}!</h2>
                
                <p>Hi {recipient_name},</p>
                
                <p><strong>{inviter_name}</strong> has invited you to join <strong>{company_name}</strong> on our ERP System platform.</p>
                
                <div class="info-box">
                    <p><strong>Your Role:</strong> {roles_text}</p>
                    <p><strong>Company:</strong> {company_name}</p>
                </div>
                
                <p>Click the button below to accept your invitation and set up your account:</p>
                
                <div style="text-align: center;">
                    <a href="{invitation_link}" class="button">Accept Invitation</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6b7280; font-size: 14px;">{invitation_link}</p>
                
                <div class="warning">
                    <p>⚠️ This invitation will expire in 7 days. If you don't accept it by then, please ask {inviter_name} to send you a new invitation.</p>
                    <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
                </div>
            </div>
            
            <div class="footer">
                <p>Best regards,<br>The ERP System Team</p>
                <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
        </body>
        </html>
        """

    def _create_invitation_text_template(
        self, 
        recipient_name: str, 
        company_name: str, 
        inviter_name: str, 
        invitation_link: str,
        roles: list[str]
    ) -> str:
        """Create plain text template for invitation email"""
        
        roles_text = ", ".join(roles) if roles else "team member"
        
        return f"""
ERP System - Invitation to join {company_name}

Hi {recipient_name},

{inviter_name} has invited you to join {company_name} on our ERP System platform.

Your Role: {roles_text}
Company: {company_name}

To accept your invitation and set up your account, please visit:
{invitation_link}

Important:
- This invitation will expire in 7 days
- If you weren't expecting this invitation, you can safely ignore this email

Best regards,
The ERP System Team

---
This is an automated message. Please do not reply to this email.
        """

    def send_password_reset_email(self, recipient_email: str, recipient_name: str, reset_link: str) -> bool:
        """Send password reset email to user"""
        
        # If credentials are not configured, log the email instead
        if not self.smtp_user or not self.smtp_password:
            subject = "Reset Your ERP System Password"
            text_content = self._create_password_reset_text_template(
                recipient_name=recipient_name or "there",
                reset_link=reset_link
            )
            self._log_email_instead_of_sending(recipient_email, subject, text_content)
            return True  # Return True for development/testing
        
        try:
            if self.debug_mode:
                logger.info(f"Attempting to send password reset email to {recipient_email}")
                
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = "Reset Your ERP System Password"
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = recipient_email

            # Create the HTML content
            html_content = self._create_password_reset_html_template(
                recipient_name=recipient_name or "there",
                reset_link=reset_link
            )

            # Create the plain text content
            text_content = self._create_password_reset_text_template(
                recipient_name=recipient_name or "there",
                reset_link=reset_link
            )

            # Turn these into plain/html MIMEText objects
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")

            # Add HTML/plain-text parts to MIMEMultipart message
            message.attach(part1)
            message.attach(part2)

            # Send the email
            if self.debug_mode:
                logger.info(f"Connecting to SMTP server {self.smtp_server}:{self.smtp_port}")
                
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.debug_mode:
                    server.set_debuglevel(1)
                    
                server.starttls(context=ssl.create_default_context())
                
                if self.debug_mode:
                    logger.info(f"Logging in with user: {self.smtp_user}")
                    
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)

            if self.debug_mode:
                logger.info(f"Password reset email sent successfully to {recipient_email}")
                
            return True
            
        except Exception as e:
            error_msg = f"Failed to send password reset email to {recipient_email}: {str(e)}"
            logger.error(error_msg)
            
            # In development, also log the email content for debugging
            if self.debug_mode:
                subject = "Reset Your ERP System Password"
                text_content = self._create_password_reset_text_template(
                    recipient_name=recipient_name or "there",
                    reset_link=reset_link
                )
                logger.info("Email content that failed to send:")
                self._log_email_instead_of_sending(recipient_email, subject, text_content)
                
            return False

    def send_password_confirmation_email(self, recipient_email: str, recipient_name: str) -> bool:
        """Send password reset confirmation email to user"""
        
        # If credentials are not configured, log the email instead
        if not self.smtp_user or not self.smtp_password:
            subject = "Password Successfully Changed - ERP System"
            text_content = self._create_password_confirmation_text_template(
                recipient_name=recipient_name or "there"
            )
            self._log_email_instead_of_sending(recipient_email, subject, text_content)
            return True  # Return True for development/testing
        
        try:
            if self.debug_mode:
                logger.info(f"Attempting to send password confirmation email to {recipient_email}")
                
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = "Password Successfully Changed - ERP System"
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = recipient_email

            # Create the HTML content
            html_content = self._create_password_confirmation_html_template(
                recipient_name=recipient_name or "there"
            )

            # Create the plain text content
            text_content = self._create_password_confirmation_text_template(
                recipient_name=recipient_name or "there"
            )

            # Turn these into plain/html MIMEText objects
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")

            # Add HTML/plain-text parts to MIMEMultipart message
            message.attach(part1)
            message.attach(part2)

            # Send the email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.debug_mode:
                    server.set_debuglevel(1)
                    
                server.starttls(context=ssl.create_default_context())
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)

            if self.debug_mode:
                logger.info(f"Password confirmation email sent successfully to {recipient_email}")
                
            return True
            
        except Exception as e:
            error_msg = f"Failed to send password confirmation email to {recipient_email}: {str(e)}"
            logger.error(error_msg)
            return False

    def _create_password_reset_html_template(self, recipient_name: str, reset_link: str) -> str:
        """Create HTML template for password reset email"""
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Reset Your ERP System Password</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    text-align: center;
                    padding: 20px 0;
                    border-bottom: 2px solid #f0f0f0;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 24px;
                    font-weight: bold;
                    color: #2563eb;
                }}
                .content {{
                    padding: 20px 0;
                }}
                .button {{
                    display: inline-block;
                    background-color: #dc2626;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 500;
                    margin: 20px 0;
                }}
                .button:hover {{
                    background-color: #b91c1c;
                }}
                .warning-box {{
                    background-color: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 6px;
                    padding: 16px;
                    margin: 20px 0;
                    color: #991b1b;
                }}
                .footer {{
                    text-align: center;
                    font-size: 14px;
                    color: #6b7280;
                    border-top: 1px solid #f0f0f0;
                    padding-top: 20px;
                    margin-top: 40px;
                }}
                .security-note {{
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 20px;
                    background-color: #f8fafc;
                    padding: 12px;
                    border-radius: 4px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🏢 ERP System</div>
            </div>
            
            <div class="content">
                <h2>Reset Your Password</h2>
                
                <p>Hi {recipient_name},</p>
                
                <p>We received a request to reset your password for your ERP System account.</p>
                
                <div class="warning-box">
                    <p><strong>⚠️ Security Notice:</strong> If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
                </div>
                
                <p>To reset your password, click the button below:</p>
                
                <div style="text-align: center;">
                    <a href="{reset_link}" class="button">Reset Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6b7280; font-size: 14px;">{reset_link}</p>
                
                <div class="security-note">
                    <p><strong>Security Information:</strong></p>
                    <ul>
                        <li>This link will expire in 15 minutes</li>
                        <li>You can only use this link once</li>
                        <li>If the link has expired, please request a new password reset</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>Best regards,<br>The ERP System Team</p>
                <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
        </body>
        </html>
        """

    def _create_password_reset_text_template(self, recipient_name: str, reset_link: str) -> str:
        """Create plain text template for password reset email"""
        
        return f"""
ERP System - Reset Your Password

Hi {recipient_name},

We received a request to reset your password for your ERP System account.

SECURITY NOTICE: If you did not request a password reset, please ignore this email. Your password will remain unchanged.

To reset your password, please visit:
{reset_link}

Security Information:
- This link will expire in 15 minutes
- You can only use this link once
- If the link has expired, please request a new password reset

Best regards,
The ERP System Team

---
This is an automated message. Please do not reply to this email.
        """

    def _create_password_confirmation_html_template(self, recipient_name: str) -> str:
        """Create HTML template for password confirmation email"""
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Successfully Changed</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    text-align: center;
                    padding: 20px 0;
                    border-bottom: 2px solid #f0f0f0;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 24px;
                    font-weight: bold;
                    color: #2563eb;
                }}
                .content {{
                    padding: 20px 0;
                }}
                .success-box {{
                    background-color: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 6px;
                    padding: 16px;
                    margin: 20px 0;
                    color: #166534;
                }}
                .footer {{
                    text-align: center;
                    font-size: 14px;
                    color: #6b7280;
                    border-top: 1px solid #f0f0f0;
                    padding-top: 20px;
                    margin-top: 40px;
                }}
                .security-note {{
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 20px;
                    background-color: #f8fafc;
                    padding: 12px;
                    border-radius: 4px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🏢 ERP System</div>
            </div>
            
            <div class="content">
                <h2>Password Successfully Changed</h2>
                
                <p>Hi {recipient_name},</p>
                
                <div class="success-box">
                    <p><strong>✅ Success!</strong> Your password has been successfully changed.</p>
                </div>
                
                <p>This is a confirmation that your password for your ERP System account has been updated.</p>
                
                <div class="security-note">
                    <p><strong>Security Information:</strong></p>
                    <ul>
                        <li>All your previous sessions have been revoked for security</li>
                        <li>You will need to log in again with your new password</li>
                        <li>If you did not make this change, please contact your administrator immediately</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>Best regards,<br>The ERP System Team</p>
                <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
        </body>
        </html>
        """

    def _create_password_confirmation_text_template(self, recipient_name: str) -> str:
        """Create plain text template for password confirmation email"""
        
        return f"""
ERP System - Password Successfully Changed

Hi {recipient_name},

This is a confirmation that your password for your ERP System account has been successfully updated.

Security Information:
- All your previous sessions have been revoked for security
- You will need to log in again with your new password
- If you did not make this change, please contact your administrator immediately

Best regards,
The ERP System Team

---
This is an automated message. Please do not reply to this email.
        """

    def send_test_email(self, recipient_email: str) -> bool:
        """Send a test email to verify email configuration"""
        try:
            message = MIMEText("This is a test email from ERP System.")
            message["Subject"] = "ERP System - Test Email"
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = recipient_email

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=ssl.create_default_context())
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)

            return True
            
        except Exception as e:
            print(f"Failed to send test email: {str(e)}")
            return False