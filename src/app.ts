import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes';
import globalErrorHandler from './middlewares/globalErrorHandler';
import notFound from './middlewares/notFound';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import 'dotenv/config';
import { DonationWebhook } from './modules/donation/donation.webhook';


const app: Application = express();

// Stripe Webhook needs the raw body
app.post(
    '/api/v1/donations/webhook',
    express.raw({ type: 'application/json' }),
    DonationWebhook.handleStripeWebhook
);

// Parsers + baseline security headers
app.use(express.json());
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // Required for cookies/sessions
}));

// BetterAuth Core Route 
const betterAuthBaseURL = process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 5000}`;
app.use('/api/auth', (req, _res, next) => {
    console.log('BetterAuth request headers:', {
        origin: req.headers.origin,
        host: req.headers.host,
        referer: req.headers.referer,
    });

    // Normalize Origin only in local development when the client doesn't send one.
    // Avoids overriding real origins in production.
    const headersTyped = req.headers as Record<string, string | string[] | undefined>;
    if (process.env.NODE_ENV !== 'production' && !headersTyped.origin) {
        headersTyped.origin = betterAuthBaseURL;
    }

    next();
}, toNodeHandler(auth));

// to test jwt and token
// app.get('/api/test-utils', (req, res) => {
//     const otp = generateNumericOTP();
//     const randomStr = generateRandomToken(16);

//     // Sign a dummy token
//     const jwtToken = signToken({ testId: '123' }, process.env.JWT_ACCESS_SECRET as string, '1h');

//     // Verify it immediately
//     const decoded = verifyToken(jwtToken, process.env.JWT_ACCESS_SECRET as string);

//     res.json({ success: true, otp, randomStr, jwtToken, decoded });
// });

// Application Routes
app.use('/api/v1', router);

// ... after routes
app.use(globalErrorHandler);

// Not Found Route Handler 
app.use(notFound);

export default app;