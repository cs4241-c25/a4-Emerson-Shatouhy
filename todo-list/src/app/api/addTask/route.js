import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getToken } from 'next-auth/jwt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function POST(request) {
    try {
        const token = await getToken({ req: request });
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await client.connect();
        const database = client.db('todos');
        const collection = database.collection('todos');

        const data = await request.json();

        if (!data.name || !data.priority) {
            return NextResponse.json(
                { error: 'Name and priority are required' },
                { status: 400 }
            );
        }

        const creationDate = new Date();
        const deadline = new Date(creationDate);

        // Set deadline based on priority
        switch (data.priority) {
            case 'high':
                deadline.setDate(deadline.getDate() + 7);
                break;
            case 'medium':
                deadline.setDate(deadline.getDate() + 14);
                break;
            case 'low':
                deadline.setDate(deadline.getDate() + 21);
                break;
        }

        const task = {
            name: data.name,
            priority: data.priority,
            status: 'todo',
            deadline: deadline.toISOString(),
            createdAt: creationDate.toISOString(),
            userId: token.sub  // Add user ID to the task
        };

        const result = await collection.insertOne(task);

        console.log('Task added with ID: ', result.insertedId);


        return NextResponse.json(
            { message: 'Task added successfully', task },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to add task: ' + error.message },
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}