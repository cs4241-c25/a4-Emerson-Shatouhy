import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { getToken } from 'next-auth/jwt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function PUT(request) {
    try {
        const token = await getToken({ req: request });
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await client.connect();
        const database = client.db('todos');
        const collection = database.collection('todos');

        const data = await request.json();
        const { taskId, status } = data;

        if (!taskId || !status) {
            return NextResponse.json(
                { error: 'Task ID and status are required' },
                { status: 400 }
            );
        }

        // First check if the task belongs to the user
        const task = await collection.findOne({
            _id: new ObjectId(taskId),
            userId: token.sub
        });

        if (!task) {
            return NextResponse.json(
                { error: 'Task not found or unauthorized' },
                { status: 404 }
            );
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(taskId), userId: token.sub },
            { $set: { status } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Task not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: 'Task updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update task: ' + error.message },
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}
