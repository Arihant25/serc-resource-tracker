import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IResource extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    image?: string; // Base64 encoded, max 2MB
    collegeId?: string;
    isComputer?: boolean;
    systemUser?: string;
    systemIp?: string;
    password?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
    {
        name: {
            type: String,
            required: [true, 'Resource name is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        image: {
            type: String,
            validate: {
                validator: function (v: string) {
                    // Check if base64 string is under 2MB (roughly 2.67MB in base64)
                    if (!v) return true;
                    return v.length <= 2800000; // ~2MB when base64 encoded
                },
                message: 'Image must be under 2MB',
            },
        },
        collegeId: {
            type: String,
            trim: true,
        },
        isComputer: {
            type: Boolean,
            default: false,
        },
        systemUser: {
            type: String,
            trim: true,
        },
        systemIp: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for searching resources
ResourceSchema.index({ name: 'text', description: 'text' });

const Resource: Model<IResource> =
    mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);

export default Resource;
