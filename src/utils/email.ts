import nodemailer from 'nodemailer';

type TEmailOptions = {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
};

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for 587/25
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
});

if (process.env.DEBUG === 'true') {
    transporter.verify((error, success) => {
        if (error) {
            console.error('SMTP transporter verification failed:', {
                message: error.message,
                name: error.name,
            });
            return;
        }

        console.log('SMTP transporter is ready to send mail:', success);
    });
}

const validateSmtpConfig = () => {
    const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missing = requiredVars.filter((key) => !(process.env[key] || '').trim());

    if (missing.length > 0) {
        throw new Error(`Missing SMTP configuration: ${missing.join(', ')}`);
    }
};

const resolveFromAddress = () => {
    const smtpUser = (process.env.SMTP_USER || '').trim();
    const rawFrom = (process.env.FROM_EMAIL || '').trim();
    const smtpHost = (process.env.SMTP_HOST || '').toLowerCase();

    if (!rawFrom) {
        return smtpUser || 'no-reply@fundingpanda.com';
    }

    // Most SMTP providers are strict with sender identity; use authenticated mailbox to improve deliverability.
    if (smtpUser) {
        const rawFromHasSmtpUser = rawFrom.toLowerCase().includes(smtpUser.toLowerCase());
        if (smtpHost.includes('gmail.com') || !rawFromHasSmtpUser) {
            console.warn('FROM_EMAIL does not match authenticated SMTP user; using SMTP_USER as sender identity for reliability.');
            return `"FundingPanda Security" <${smtpUser}>`;
        }

        return `"FundingPanda Security" <${smtpUser}>`;
    }

    return rawFrom;
};

export const sendEmail = async (options: TEmailOptions) => {
    validateSmtpConfig();

    // 1. Generate HTML based on the templateName
    let htmlContent = '';

    if (options.templateName === 'otp') {
        htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px;">
          <h2 style="color: #333;">Hello ${options.templateData.name},</h2>
          <p style="color: #555; font-size: 16px;">Your One-Time Password (OTP) for FundingPanda is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <h1 style="color: #4CAF50; letter-spacing: 8px; margin: 0;">${options.templateData.otp}</h1>
          </div>
          <p style="color: #777; font-size: 14px;">This code is valid for 2 minutes. Please do not share it with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin-top: 30px;" />
          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 FundingPanda Inc.</p>
      </div>
    `;
    }

    if (options.templateName === 'verification') {
        const url = options.templateData.url || '#';
        htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px;">
          <h2 style="color: #333;">Hello ${options.templateData.name},</h2>
          <p style="color: #555; font-size: 16px;">Click the button below to verify your email for FundingPanda:</p>
          <div style="text-align:center; margin: 20px 0;">
              <a href="${url}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a>
          </div>
          <p style="color: #777; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #777; font-size: 12px; word-break:break-all;">${url}</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin-top: 30px;" />
          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 FundingPanda Inc.</p>
      </div>
    `;
    }

    if (options.templateName === 'reset-password') {
        const url = options.templateData.url || '#';
        htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #555; font-size: 16px;">Hello,</p>
          <p style="color: #555; font-size: 16px;">We received a request to reset your password for FundingPanda. Click the button below to choose a new password:</p>
          <div style="text-align:center; margin: 30px 0;">
              <a href="${url}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #777; font-size: 14px;">If you did not request this, please ignore this email. This link will expire shortly.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin-top: 30px;" />
          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 FundingPanda Inc.</p>
      </div>
    `;
    }

    if (!htmlContent) {
        throw new Error(`Unsupported email template: ${options.templateName}`);
    }

    // 2. Define the mail options
    const primaryFrom = resolveFromAddress();
    const fallbackFrom = (process.env.SMTP_USER || '').trim();

    const mailOptions = {
        from: primaryFrom,
        to: options.to,
        subject: options.subject,
        html: htmlContent,
    };

    if (process.env.DEBUG === 'true') {
        console.log('Sending email', {
            templateName: options.templateName,
            to: options.to,
            from: primaryFrom,
            smtpHost: process.env.SMTP_HOST,
            smtpPort: process.env.SMTP_PORT,
        });
    }

    // 3. Send the email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.to} [Message ID: ${info.messageId}]`);
    } catch (error) {
        // Retry once with authenticated mailbox if primary sender fails.
        if (fallbackFrom && fallbackFrom !== primaryFrom) {
            try {
                const retryInfo = await transporter.sendMail({
                    ...mailOptions,
                    from: `"FundingPanda Security" <${fallbackFrom}>`,
                });
                console.log(`Email sent successfully on retry to ${options.to} [Message ID: ${retryInfo.messageId}]`);
                return;
            } catch (retryError) {
                console.error('Error sending email (retry failed):', retryError);
                throw retryError;
            }
        }

        const err = error as {
            message?: string;
            code?: string;
            response?: string;
            responseCode?: number;
            command?: string;
        };

        console.error('Error sending email:', {
            message: err?.message,
            code: err?.code,
            responseCode: err?.responseCode,
            command: err?.command,
            response: err?.response,
        });
        throw error;
    }
};