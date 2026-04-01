import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface HistoricalResult {
  week: string;
  summary: string;
  similarity: number;
  focus_level?: number;
  tasks?: number;
  most_productive_day?: string;
}

interface TraceLogEntry {
  week?: string;
  score?: number;
  filtered_out?: boolean;
}

interface SearchResponse {
  results: HistoricalResult[];
  filters_used?: Record<string, Record<string, string | number>>;
  trace_log?: TraceLogEntry[];
  note?: string;
}

const RESULT_LIMIT = 5;

const HistoricalSearch: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<HistoricalResult[]>([]);
  const [filtersUsed, setFiltersUsed] = useState<SearchResponse['filters_used']>();
  const [traceLog, setTraceLog] = useState<TraceLogEntry[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(RESULT_LIMIT);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);
    setVisibleCount(RESULT_LIMIT);
    setFiltersUsed(undefined);
    setTraceLog([]);

    try {
      const response = await fetch('http://localhost:8001/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data: SearchResponse = await response.json();

      if (!response.ok) throw new Error(data.note || 'Failed to fetch results');

      setResults(data.results || []);
      setFiltersUsed(data.filters_used);
      setTraceLog(data.trace_log || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for similar weeks..."
          className="flex-1"
        />
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="bg-teal-500 hover:bg-teal-600"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-sm text-gray-500 dark:text-white">
        Try queries like "Show me past weeks focused on backend development" or "Find weeks when my most productive day was Tuesday"
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading && (
        <div className="text-center py-4">
          <p className="dark:text-white">Searching...</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3 mt-2">
          <h4 className="font-medium dark:text-white">Search Results</h4>
          <p className="text-sm text-gray-500 dark:text-white mb-2">
            Showing top {Math.min(visibleCount, results.length)} of {results.length} most relevant weeks
          </p>
          {results.slice(0, visibleCount).map((result, index) => (
            <div key={index} className="border rounded-md p-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800 dark:text-white">{result.week}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-white mt-1">{result.summary}</p>

              <div className="text-xs text-gray-500 dark:text-white mt-2 space-x-4">
                {result.focus_level != null && <span>Focus: {result.focus_level}</span>}
                {result.tasks != null && <span>Tasks: {result.tasks}</span>}
                {result.most_productive_day && <span>Productive Day: {result.most_productive_day}</span>}
              </div>
            </div>
          ))}

          {visibleCount < results.length && (
            <div className="text-center pt-2">
              <Button
                onClick={() => setVisibleCount((prev) => prev + RESULT_LIMIT)}
                className="bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 dark:text-white"
              >
                Show more results
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoricalSearch;