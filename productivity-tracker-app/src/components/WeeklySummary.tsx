
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import dayjs from 'dayjs';
import { DateRange } from 'react-day-picker';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import ReactMarkdown from 'react-markdown';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const WeeklySummary: React.FC = () => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weekRange, setWeekRange] = useState<DateRange>();

  const handleDaySelect = (date: Date | undefined) => {
    if (!date) return;
    const from = dayjs(date).startOf('day').toDate();
    const to = dayjs(from).add(6, 'day').endOf('day').toDate();
    setWeekRange({ from, to });
  };

  const generateSummary = async () => {
    if (!weekRange?.from || !weekRange.to) {
      setError('Please select a week.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const raw = localStorage.getItem('productivityTasks') || '[]';
      const parsed = JSON.parse(raw);

      const start = dayjs(weekRange.from).startOf('day');
      const end = dayjs(weekRange.to).endOf('day');

      const filtered = parsed
        .filter((t: any) => t.completed)
        .map((t: any) => ({ ...t, date: dayjs(t.date) }))
        .filter((t: any) => t.date.isSameOrAfter(start) && t.date.isSameOrBefore(end));

      console.log(filtered);

      const totalTasks = filtered.length;
      const totalMinutes = filtered.reduce((sum: number, t: any) => sum + parseInt(t.time), 0);
      const averageFocus =
        filtered.reduce((sum: number, t: any) => {
          return (
            sum +
            (t.focusLevel === 'high'
              ? 9
              : t.focusLevel === 'medium'
              ? 6
              : 3)
          );
        }, 0) / (filtered.length || 1);

      const tasksByDay: Record<string, number> = {};
      filtered.forEach((t: any) => {
        const day = t.date.format('dddd');
        tasksByDay[day] = (tasksByDay[day] || 0) + 1;
      });
      const mostProductiveDay = Object.entries(tasksByDay).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      const formatted = filtered
        .map(
          (t: any) =>
            `• ${t.name} (${t.time}, focus: ${t.focusLevel}) on ${t.date.format('dddd, MMM D')}`
        )
        .join('\n');

      const prompt = `This is a user’s productivity data from ${start.format(
        'MMM DD'
      )} to ${end.format('MMM DD')}, ${end.format('YYYY')}:
\t• Total tasks completed: ${totalTasks}
\t• Total time spent: ${(totalMinutes / 60).toFixed(1)} hours
\t• Average focus level: ${averageFocus.toFixed(1)}/10
\t• Most productive day: ${mostProductiveDay}
\t• Task breakdown:\n${formatted}`;

console.log(prompt);

      const response = await fetch('http://localhost:8000/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: prompt }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Failed to generate summary');

      setSummary(result.summary);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!summary ? (
        <>
          <p className="text-gray-600">
            Select the start of the week you'd like to summarize. We'll automatically include 7 days.
          </p>

          <div className="border rounded-md">
            <Calendar
              mode="single"
              selected={weekRange?.from}
              onSelect={handleDaySelect}
              className="rounded-md"
            />
          </div>

          {weekRange?.from && (
            <p className="text-sm text-gray-500 mt-1">
              Selected Week: {dayjs(weekRange.from).format('MMM D')} →{' '}
              {dayjs(weekRange.to).format('MMM D')}
            </p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            onClick={generateSummary}
            className="w-full bg-teal-500 hover:bg-teal-600"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Weekly Summary'}
          </Button>
        </>
      ) : (
        <>
                    {/* 1. Date Range Header */}
                    <div className="text-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Summary for{' '}
              <strong className="text-gray-800 dark:text-gray-200">
                {dayjs(weekRange!.from).format('MMM D, YYYY')} –{' '}
                {dayjs(weekRange!.to).format('MMM D, YYYY')}
              </strong>
            </span>
          </div>

          {/* Markdown with custom heading styles */}
          <div className="prose dark:prose-dark max-w-none bg-teal-50 p-4 rounded-md shadow-sm">
            <ReactMarkdown
              components={{
                // First-level "Weekly Summary" — bigger:
                h2: ({ node, ...props }) => (
                  <h2
                    className="mt-0 mb-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100"
                    {...props}
                  />
                ),
                // All other h3s get extra space:
                h3: ({ node, ...props }) => (
                  <h3
                    className="mt-6 mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200"
                    {...props}
                  />
                ),
                // You can also tweak h4, paragraphs, etc.
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>

          {/* 3. Regenerate Button */}
          <Button
            variant="outline"
            onClick={() => {
              setSummary('');
              setWeekRange(undefined);
            }}
            className="w-full mt-2"
          >
            Generate New Summary
          </Button>
        </>
      )}
    </div>
  );
};

export default WeeklySummary;
