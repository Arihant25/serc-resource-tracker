import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    profilePicture?: string;
    isAdmin: boolean;
    notificationPreferences: {
        push: boolean;
    };
    fcmTokens: string[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            select: false, // Don't include password by default in queries
        },
        profilePicture: {
            type: String,
            default: null,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        notificationPreferences: {
            push: {
                type: Boolean,
                default: true,
            },
        },
        fcmTokens: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster email lookups
UserSchema.index({ email: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
