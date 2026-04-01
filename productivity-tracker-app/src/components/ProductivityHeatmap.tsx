import React, { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import dayjs from 'dayjs';
import 'react-calendar-heatmap/dist/styles.css';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

// Extend dayjs with the needed plugin for date comparisons
dayjs.extend(isSameOrBefore);

type Heat = {
  date: string;
  count: number;
};

export const ProductivityHeatmap: React.FC = () => {
  const [heatmap, setHeatmap] = useState<Heat[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('productivityTasks') || '[]';
    const all = JSON.parse(raw) as any[];
    const counts: Record<string, number> = {};

    all.filter(t => t.completed).forEach(t => {
      const d = dayjs(t.date).format('YYYY-MM-DD');
      counts[d] = (counts[d] || 0) + 1;
    });

    // build last 2 weeks
    const today = dayjs();
    const start = today.subtract(13, 'day');
    const arr: Heat[] = [];

    for (let d = start; d.isSameOrBefore(today); d = d.add(1, 'day')) {
      const key = d.format('YYYY-MM-DD');
      arr.push({ date: key, count: counts[key] || 0 });
    }

    setHeatmap(arr);
  }, []);

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">🔥 Daily Tasks Heatmap</h3>
      <CalendarHeatmap
        startDate={dayjs().subtract(13, 'day').toDate()}
        endDate={new Date()}
        values={heatmap}
        classForValue={value => {
          // guard for null or missing count
          if (!value || value.count == null) return 'bg-gray-100';
          const c = value.count;
          if (c >= 5) return 'bg-green-600';
          if (c >= 3) return 'bg-green-400';
          if (c >= 1) return 'bg-green-200';
          return 'bg-gray-100';
        }}
        showWeekdayLabels
        tooltipDataAttrs={value => ({
          'data-tip': `${value.date}: ${value.count} tasks`,
        })}
      />
      {/* Integrate with react-tooltip for hover tooltips if desired */}
    </div>
  );
};
