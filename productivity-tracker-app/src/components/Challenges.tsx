import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import dayjs from 'dayjs';

const parseLocalDate = (iso: string): Date => {
  // drop time+Z and parse Y-M-D as local midnight
  const [yyyy, mm, dd] = iso.split('T')[0].split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
};

const Challenges: React.FC = () => {
  // flag to re-render when tasksUpdated fires
  const [updateFlag, setUpdateFlag] = useState(0);
  useEffect(() => {
    const handler = () => setUpdateFlag(f => f + 1);
    window.addEventListener('tasksUpdated', handler);
    return () => window.removeEventListener('tasksUpdated', handler);
  }, []);

  // 1. load raw JSON from LS every render (updateFlag forces re-render)
  const raw = localStorage.getItem('productivityTasks') || '[]';
  const allTasks: Array<{ date: string; completed: boolean; time: string; focusLevel: 'low' | 'medium' | 'high'; }> = JSON.parse(raw);

  // 2. convert to { date: Date, ... }
  const parsed = allTasks.map(t => ({
    ...t,
    date: parseLocalDate(t.date),
  }));

  // 3. compute ISO-week window (Mon 00:00 … Sun 23:59)
  const now = dayjs();
  const weekDay = now.day(); // 0=Sunday,1=Monday...
  const startOfWeek = now.subtract((weekDay + 6) % 7, 'day').startOf('day');
  const endOfWeek   = startOfWeek.add(6, 'day').endOf('day');
  const weekStartTs = startOfWeek.valueOf();
  const weekEndTs   = endOfWeek.valueOf();

  // 4. filter tasks into this week
  const weekly = parsed.filter(t => {
    const ts = t.date.getTime();
    return ts >= weekStartTs && ts <= weekEndTs;
  });

  // 5. only the completed ones
  const completed = weekly.filter(t => t.completed);

  // 6. weighted focus‐minutes
  const focusMinutes = completed.reduce((sum, t) => {
    const mins   = parseInt(t.time.replace('min','').trim()) || 0;
    const weight = t.focusLevel === 'high'
                  ? 1
                  : t.focusLevel === 'medium'
                  ? 0.5
                  : 0;
    return sum + mins * weight;
  }, 0);

  // 7. build your three progress bars
  const challenges = [
    {
      name: "5-Day Deep Work Streak",
      progress: Math.min(
        100,
        (new Set(
          completed
            .filter(t => t.focusLevel === 'high')
            .map(t => dayjs(t.date).format('YYYY-MM-DD'))
        ).size / 5) * 100
      ),
    },
    {
      name: "Complete 20 Tasks",
      progress: Math.min((completed.length / 20) * 100, 100),
    },
    {
      name: "8 Hours Focus Time",
      progress: Math.min((focusMinutes / 480) * 100, 100),
    },
  ];

  // 8. tally tasks per weekday
  const countsByDay: Record<string, number> = {};
  completed.forEach(t => {
    const wd = dayjs(t.date).format('dddd');
    countsByDay[wd] = (countsByDay[wd] || 0) + 1;
  });
  const mostProductiveDay = Object.entries(countsByDay)
    .sort(([,a],[,b]) => b - a)[0]?.[0] || '-';

  // 9. longest single session
  const longest = completed.reduce((max, t) => {
    const m = parseInt(t.time.replace('min','').trim()) || 0;
    return m > max ? m : max;
  }, 0);

  const trophies = [
    { name: "Most Productive Day",   value: mostProductiveDay },
    { name: "Longest Focus Session", value: `${(longest/60).toFixed(1)} hrs` },
    { name: "Tasks Completed",       value: `${completed.length}` },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Challenges (This Week)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress bars */}
        <div className="space-y-4">
          {challenges.map((c,i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span>{c.name}</span>
                <span>{Math.round(c.progress)}%</span>
              </div>
              <Progress value={c.progress} className="h-2" />
            </div>
          ))}
        </div>

        {/* Trophies */}
        <div className="grid grid-cols-3 gap-2">
          {trophies.map((t,i) => (
            <div
              key={i}
              className="bg-teal-500 text-white p-4 rounded-md flex flex-col items-center text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 
                         6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 
                         12l5.714-2.143L13 3z" />
              </svg>
              <div className="text-xs font-medium">{t.name}</div>
              <div className="text-sm font-bold mt-1">{t.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Challenges;
