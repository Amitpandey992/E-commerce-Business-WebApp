// utils/EmailTemplates.ts
import fs from "fs";
import path from "path";

class EmailTemplate {
    static getOTPTemplate(otp: string): string {
        try {
            const templatePath = path.join(
                process.cwd(),
                "src/template/otp-email.html"
            );

            console.log("Looking for template at:", templatePath);

            let template = fs.readFileSync(templatePath, "utf8");

            template = template.replace("{{OTP}}", otp);

            return template;
        } catch (error) {
            console.error("Error loading email template:", error);

            return this.getFallbackTemplate(otp);
        }
    }

    static getFallbackTemplate(otp: string): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: rgba(255,255,255,0.1); padding: 40px 30px; text-align: center;">
                            <h1 style="color: white; font-size: 28px; font-weight: 300; margin: 0 0 10px 0;">🔐 Secure Verification</h1>
                            <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">Your one-time password is ready</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="background: white; padding: 50px 30px; text-align: center;">
                            
                            <!-- OTP Container -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; padding: 30px; text-align: center;">
                                        <div style="color: white; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">Your OTP Code</div>
                                        <div style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="font-size: 16px; color: #666; line-height: 1.8; margin: 20px 0;">
                                We received a request to verify your account. Please use the code above to complete your signup process.
                            </p>
                            
                            <!-- Warning -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 20px; color: #856404;">
                                        <div style="font-size: 20px; margin-bottom: 10px;">⚠️</div>
                                        <strong>Important:</strong> This code will expire in 10 minutes. Never share this code with anyone.
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="display: inline-block; background: #e74c3c; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 500;">
                                ⏱️ Expires in 10 minutes
                            </div>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8f9fa; padding: 30px; text-align: center;">
                            <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;"><strong>Didn't request this code?</strong></p>
                            <p style="color: #6c757d; font-size: 14px; margin: 0;">If you didn't request this verification code, please ignore this email.</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    static getOrderConfirmationTemplate(orderId: string): string {
        try {
            const templatePath = path.join(
                process.cwd(),
                "src/template/order-confirmation-email.html"
            );

            console.log("Looking for template at:", templatePath);

            let template = fs.readFileSync(templatePath, "utf8");

            template = template.replace("{{orderId}}", orderId);

            return template;
        } catch (error) {
            console.error("Error loading email template:", error);

            return this.getFallbackTemplateForOrderConfirmation(orderId);
        }
    }

    static getFallbackTemplateForOrderConfirmation(orderId: string): string {
        return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: rgba(255,255,255,0.1); padding: 40px 30px; text-align: center;">
                                <h1 style="color: white; font-size: 28px; font-weight: 300; margin: 0 0 10px 0;">Order Confirmation</h1>
                                <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">Your order has been confirmed!</p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="background: white; padding: 50px 30px; text-align: center;">
                                
                                <!-- OTP Container -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; padding: 30px; text-align: center;">
                                            <div style="color: white; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">Your Order ID</div>
                                            <div style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace;">${orderId}</div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="font-size: 16px; color: #666; line-height: 1.8; margin: 20px 0;">
                                    We received a request to verify your account. Please use the code above to complete your signup process.
                                </p>
                                
                                <!-- Warning -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                                    <tr>
                                        <td style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 20px; color: #856404;">
                                            <strong>Important:</strong> Please keep this Order ID safe for your records.
                                            
                                        </td>
                                    </tr>
                                </table>
    
                                <p style="font-size: 16px; color: #666; line-height: 1.8; margin: 20px 0;">
                                    If you have any questions about your order, feel free to contact our support team.
                                </p>
    
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background: #f8f9fa; padding: 30px; text-align: center;">
                                <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;"><strong>Didn't request this code?</strong></p>
                                <p style="color: #6c757d; font-size: 12px; margin: 0;">If you did not place this order, please contact our support team immediately.</p>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
            `;
    }
}

export default EmailTemplate;
