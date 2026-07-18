import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn(
        'GMAIL_USER / GMAIL_APP_PASSWORD are not set. Email notifications will be disabled.'
    );
}

// A single reusable transporter. Gmail SMTP over TLS (port 465).
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        return null;
    }
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_APP_PASSWORD,
            },
        });
    }
    return transporter;
}

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    /** Plain-text fallback. If omitted, derived from `html`. */
    text?: string;
    /** Inner HTML content placed inside the branded wrapper. */
    html: string;
}

/**
 * Send an email from the SERC Resource Tracker mailbox.
 * Resolves even if sending fails so callers never break their main flow.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, text, html } = options;

    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    if (recipients.length === 0) {
        return false;
    }

    const t = getTransporter();
    if (!t) {
        console.error('Email transporter not configured — skipping email:', subject);
        return false;
    }

    try {
        await t.sendMail({
            from: `"SERC Resource Tracker" <${GMAIL_USER}>`,
            to: recipients.join(', '),
            subject,
            text: text ?? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
            html: wrapHtml(subject, html),
        });
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

/** Wrap inner content in a simple, email-client-safe branded layout. */
function wrapHtml(title: string, inner: string): string {
    return `
    <div style="background:#f4f4f5;padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
            <div style="background:#1A1A1A;padding:20px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">SERC Resource Tracker</span>
            </div>
            <div style="padding:28px;color:#27272a;font-size:15px;line-height:1.6;">
                <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">${title}</h1>
                ${inner}
            </div>
            <div style="padding:16px 28px;border-top:1px solid #e4e4e7;color:#a1a1aa;font-size:12px;">
                Software Engineering Research Center, IIIT Hyderabad
            </div>
        </div>
    </div>`;
}
