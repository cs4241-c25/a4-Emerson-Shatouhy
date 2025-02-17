import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getToken } from 'next-auth/jwt';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET(request) {
    try {
        const token = await getToken({ req: request });
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await client.connect();
        const database = client.db('todos');
        const collection = database.collection('todos');

        const tasks = await collection.find({ userId: token.sub }).toArray();

        return NextResponse.json(
            { tasks },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to get tasks ' + error.message },
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}