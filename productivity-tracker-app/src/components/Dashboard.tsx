
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProductivityMetrics from './ProductivityMetrics';
import TaskList from './TaskList';
import {ProductivityTrends} from './ProductivityTrends';
import {ProductivityHeatmap} from './ProductivityHeatmap';
import Challenges from './Challenges';

const Dashboard: React.FC = () => {
  const today = new Date();
  const greeting = () => {
    const hour = today.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold dark:text-white">{greeting()} Champ!</h2>
        <p className="text-xl text-gray-600 dark:text-gray-300">Time to seize the day 🌞</p>
      </div>

      {/*<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ProductivityMetrics />
      </div>*/}

      

      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card className="h-full dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl dark:text-white">Tasks Management</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList />
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl dark:text-white">Productivity Trends (Past 2 weeks)</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-6">
      <ProductivityTrends />
      {/*<ProductivityHeatmap />*/}
    </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <Challenges />
      </div>

      
    </div>
  );
};

export default Dashboard;
