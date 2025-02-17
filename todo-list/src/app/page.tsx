'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

interface Task {
  name: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'done';
  _id?: string;
  deadline?: string;
  createdAt?: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    priority: 'high' as 'high' | 'medium' | 'low',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/getTask')
        .then((res) => res.json())
        .then((data) => setTasks(data.tasks));
    }
  }, [session]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/addTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to add task');
      }

      // Refresh tasks list
      const tasksResponse = await fetch('/api/getTask');
      const data = await tasksResponse.json();
      setTasks(data.tasks);

      // Reset form
      setFormData({ name: '', priority: 'high' });
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const response = await fetch('/api/updateTask', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      // Refresh tasks list
      const tasksResponse = await fetch('/api/getTask');
      const data = await tasksResponse.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task status');
    }
  };

  const handleSignout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center p-6 w-full">
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">To Do List</h1>
          <button
            onClick={handleSignout}
            className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Sign Out
          </button>
        </div>

        <form
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
          onSubmit={handleSubmit}
        >
          <div className="mb-4">
            <label className="block text-gray-900 text-sm font-bold mb-2" htmlFor="name">
              Task Name:
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="name"
              type="text"
              placeholder="Task Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 text-sm font-bold mb-2" htmlFor="priority">
              Priority:
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="priority"
              required
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'high' | 'medium' | 'low' })}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center justify-center">
            <button
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded flex flex-col gap-4">
          {tasks.map((task) => (
            <div key={task._id} className="w-full p-4 border rounded bg-gray-100">
              <h3 className="font-bold">{task.name}</h3>
              <p>Priority: {task.priority}</p>
              <div className="mt-2">
                <label htmlFor={`status-${task._id}`} className="block text-sm font-medium text-gray-700">
                  Status:
                </label>
                <select
                  id={`status-${task._id}`}
                  value={task.status}
                  onChange={(e) => handleStatusChange(task._id!, e.target.value as Task['status'])}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              {task.deadline && (
                <p className="mt-2 text-sm text-gray-600">
                  Deadline: {new Date(task.deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
