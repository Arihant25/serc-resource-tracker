import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';

interface ReservationEmailDetails {
    requesterName: string;
    requesterEmail: string;
    resourceName: string;
    startTime: Date;
    endTime: Date;
    reason: string;
    priority: string;
}

function formatRange(start: Date, end: Date): string {
    const opts: Intl.DateTimeFormatOptions = {
        dateStyle: 'medium',
        timeStyle: 'short',
    };
    return `${new Date(start).toLocaleString('en-IN', opts)} → ${new Date(end).toLocaleString('en-IN', opts)}`;
}

function detailRows(details: ReservationEmailDetails): string {
    const row = (label: string, value: string) =>
        `<tr>
            <td style="padding:6px 12px 6px 0;color:#71717a;white-space:nowrap;vertical-align:top;">${label}</td>
            <td style="padding:6px 0;color:#18181b;font-weight:500;">${value}</td>
        </tr>`;
    return `<table style="border-collapse:collapse;margin:8px 0 20px;font-size:14px;">
        ${row('Resource', details.resourceName)}
        ${row('When', formatRange(details.startTime, details.endTime))}
        ${row('Priority', details.priority === 'urgent' ? '🔴 Urgent' : 'Normal')}
        ${row('Reason', details.reason)}
    </table>`;
}

/**
 * Email every admin that a new reservation request needs review.
 * Never throws — email failures must not break reservation creation.
 */
export async function notifyAdminsNewReservation(details: ReservationEmailDetails): Promise<void> {
    try {
        await connectDB();
        const admins = await User.find({ isAdmin: true }).select('email');
        const adminEmails = admins.map((a) => a.email).filter(Boolean);

        if (adminEmails.length === 0) {
            return;
        }

        const html = `
            <p>A new reservation request from <strong>${details.requesterName}</strong> (${details.requesterEmail}) is awaiting your approval.</p>
            ${detailRows(details)}
            <p style="margin-top:20px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/admin"
                   style="display:inline-block;background:#1A1A1A;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;font-size:14px;">
                    Review request
                </a>
            </p>`;

        await sendEmail({
            to: adminEmails,
            subject: `New reservation request: ${details.resourceName}`,
            html,
        });
    } catch (error) {
        console.error('Failed to send new-reservation email to admins:', error);
    }
}

/**
 * Email the requester that their reservation was approved or rejected.
 * Never throws — email failures must not break the status update.
 */
export async function notifyRequesterDecision(
    details: ReservationEmailDetails,
    status: 'approved' | 'rejected'
): Promise<void> {
    try {
        if (!details.requesterEmail) {
            return;
        }

        const approved = status === 'approved';
        const html = `
            <p>Hi ${details.requesterName},</p>
            <p>Your reservation request has been
                <strong style="color:${approved ? '#16a34a' : '#dc2626'};">${approved ? 'approved' : 'rejected'}</strong>.
            </p>
            ${detailRows(details)}
            <p>${approved
                ? 'The resource is reserved for you during the window above. Please mark it complete once you are done.'
                : 'If you have questions about this decision, please reach out to a SERC admin.'}
            </p>`;

        await sendEmail({
            to: details.requesterEmail,
            subject: `Reservation ${approved ? 'approved' : 'rejected'}: ${details.resourceName}`,
            html,
        });
    } catch (error) {
        console.error('Failed to send decision email to requester:', error);
    }
}
