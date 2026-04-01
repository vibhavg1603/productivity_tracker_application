
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HistoricalSearch from './HistoricalSearch';

const HistoricalSearchTab: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Historical Search</h2>
        <p className="text-gray-600">Search Past Productivity Patterns</p>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
          </CardHeader>
          <CardContent>
            <HistoricalSearch />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HistoricalSearchTab;
