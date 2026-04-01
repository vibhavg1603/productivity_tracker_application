
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WeeklySummary from './WeeklySummary';

const WeeklySummaryTab: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold dark:text-white">Weekly Summary</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">Review your productivity patterns and get AI-powered insights</p>
      </div>

      <div className="flex justify-center mb-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700 ">
          <CardHeader>
            <CardTitle className="text-xl dark:text-white">Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklySummary />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WeeklySummaryTab;
