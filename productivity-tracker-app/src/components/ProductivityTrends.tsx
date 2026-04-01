import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import dayjs from 'dayjs';

interface Row { date: string; tasks: number; hours: number; focus: number; }

export const ProductivityTrends: React.FC = () => {
  const [data, setData] = useState<Row[]>([]);

  const loadData = async () => {
    // 1) read storage (or fallback JSON if empty)
    let allTasks: any[] = [];
    const raw = localStorage.getItem('productivityTasks');
    if (raw) {
      allTasks = JSON.parse(raw);
    }
    //if (!allTasks.length) {
      //const resp = await fetch('/productivityTasks_two_weeks.json');
      //if (resp.ok) allTasks = await resp.json();
    //}

    // 2) only completed ones, map to dayjs etc.
    const tasks = allTasks
      .filter(t => t.completed)
      .map(t => ({
        date: dayjs(t.date).startOf('day'),
        mins: parseInt(t.time.replace('min','').trim(), 10) || 0,
        focus: t.focusLevel === 'high'   ? 9
               : t.focusLevel === 'medium' ? 6
               :                             3,
      }));

    // 3) build 14-day window
    const today = dayjs().startOf('day');
    const start = today.subtract(13, 'day');

    // 4) bucket by day
    const bucket: Record<string, { tasks:number; totalMins:number; focusSum:number }> = {};
    tasks.forEach(t => {
      const ts = t.date.valueOf();
      if (ts < start.valueOf() || ts > today.valueOf()) return;
      const key = t.date.format('YYYY-MM-DD');
      if (!bucket[key]) bucket[key] = { tasks:0, totalMins:0, focusSum:0 };
      bucket[key].tasks++;
      bucket[key].totalMins += t.mins;
      bucket[key].focusSum += t.focus;
    });

    // 5) assemble series
    const series: Row[] = [];
    for (let d = start.clone(); d.valueOf() <= today.valueOf(); d = d.add(1, 'day')) {
      const key = d.format('YYYY-MM-DD');
      const b = bucket[key] || { tasks:0, totalMins:0, focusSum:0 };
      series.push({
        date: d.format('MMM D'),
        tasks: b.tasks,
        hours: parseFloat((b.totalMins / 60).toFixed(1)),
        focus: b.tasks ? parseFloat((b.focusSum / b.tasks).toFixed(1)) : 0,
      });
    }

    setData(series);
  };

  useEffect(() => {
    loadData();
    // re-load whenever tasksUpdated fires:
    window.addEventListener("tasksUpdated", loadData);
    return () => { window.removeEventListener("tasksUpdated", loadData); };
  }, []);

  return (
    <Card>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top:10, right:20, bottom:10, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend verticalAlign="top" height={36}/>
            <Line type="monotone" dataKey="tasks"  name="Tasks" stroke="#009294" />
            <Line type="monotone" dataKey="hours"  name="Hours" stroke="#66bebe" />
            <Line type="monotone" dataKey="focus"  name="Avg Focus" stroke="#FFA726" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProductivityTrends;
