
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, BarChart, Check } from 'lucide-react';

const ProductivityMetrics: React.FC = () => {
  // In a real application, this data would come from a state or API
  const metrics = [
    {
      title: "8 hrs",
      subtitle: "Deep Work",
      icon: <Clock className="h-8 w-8 text-teal-500" />,
      bgColor: "bg-teal-50",
    },
    {
      title: "12 Tasks",
      subtitle: "Completed",
      icon: <Check className="h-8 w-8 text-teal-500" />,
      bgColor: "bg-teal-50",
    },
    {
      title: "High",
      subtitle: "Focus Level",
      icon: <BarChart className="h-8 w-8 text-teal-500" />,
      bgColor: "bg-teal-50",
    }
  ];

  return (
    <>
      {metrics.map((metric, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`${metric.bgColor} p-4 rounded-md`}>
              {metric.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold">{metric.title}</h3>
              <p className="text-gray-500">{metric.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default ProductivityMetrics;
