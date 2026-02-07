import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReservationStatus = 'pending' | 'approved' | 'rejected';
export type ReservationPriority = 'urgent' | 'normal';

export interface IReservation extends Document {
    _id: mongoose.Types.ObjectId;
    resourceId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    startTime: Date;
    endTime: Date;
    date_created: Date;
    status: ReservationStatus;
    priority: ReservationPriority;
    reason: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
    {
        resourceId: {
            type: Schema.Types.ObjectId,
            ref: 'Resource',
            required: [true, 'Resource ID is required'],
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        startTime: {
            type: Date,
            required: [true, 'Start time is required'],
        },
        endTime: {
            type: Date,
            required: [true, 'End time is required'],
        },
        date_created: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        priority: {
            type: String,
            enum: ['urgent', 'normal'],
            default: 'normal',
        },
        reason: {
            type: String,
            required: [true, 'Reason is required'],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
ReservationSchema.index({ resourceId: 1, status: 1 });
ReservationSchema.index({ userId: 1 });
ReservationSchema.index({ startTime: 1, endTime: 1 });

const Reservation: Model<IReservation> =
    mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', ReservationSchema);

export default Reservation;
