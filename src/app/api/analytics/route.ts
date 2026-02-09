import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Reservation from '@/models/Reservation';
import User from '@/models/User';
import Resource from '@/models/Resource';
import { requireAdmin } from '@/lib/auth';

// Ensure models are registered
const ensureModels = () => {
    if (!User) console.error('User model not loaded');
    if (!Resource) console.error('Resource model not loaded');
};

export async function GET() {
    try {
        await requireAdmin();
        await connectDB();
        ensureModels();

        // 1. Top Reservers by Count
        const topReserversByCount = await Reservation.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $project: {
                    name: '$user.name',
                    email: '$user.email',
                    value: '$count',
                },
            },
        ]);

        // 2. Top Reservers by Time (Duration)
        const topReserversByTime = await Reservation.aggregate([
            { $match: { status: 'approved' } },
            {
                $project: {
                    userId: 1,
                    duration: { $subtract: ['$endTime', '$startTime'] },
                },
            },
            {
                $group: {
                    _id: '$userId',
                    totalDuration: { $sum: '$duration' },
                },
            },
            { $sort: { totalDuration: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $project: {
                    name: '$user.name',
                    email: '$user.email',
                    value: '$totalDuration', // In milliseconds
                },
            },
        ]);

        // 3. Top Resources by Count
        const topResourcesByCount = await Reservation.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: '$resourceId',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'resources',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'resource',
                },
            },
            { $unwind: '$resource' },
            {
                $project: {
                    name: '$resource.name',
                    value: '$count',
                },
            },
        ]);

        // 4. Top Resources by Time (Duration)
        const topResourcesByTime = await Reservation.aggregate([
            { $match: { status: 'approved' } },
            {
                $project: {
                    resourceId: 1,
                    duration: { $subtract: ['$endTime', '$startTime'] },
                },
            },
            {
                $group: {
                    _id: '$resourceId',
                    totalDuration: { $sum: '$duration' },
                },
            },
            { $sort: { totalDuration: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'resources',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'resource',
                },
            },
            { $unwind: '$resource' },
            {
                $project: {
                    name: '$resource.name',
                    value: '$totalDuration', // In milliseconds
                },
            },
        ]);

        return NextResponse.json({
            topReserversByCount,
            topReserversByTime,
            topResourcesByCount,
            topResourcesByTime,
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
