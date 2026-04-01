import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Plus, Clock, Calendar, Pencil, Trash2, X, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfDay, parse } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types
type FocusLevel = 'low' | 'medium' | 'high';

type Task = {
  id: number;
  name: string;
  time: string;
  completed: boolean;
  focusLevel: FocusLevel;
  date: Date;
};

const parseLocalDate = (iso: string) => {
  const dateOnly = iso.split('T')[0];
  return parse(dateOnly, 'yyyy-MM-dd', new Date());
};

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskFocus, setNewTaskFocus] = useState<FocusLevel>('medium');
  const [newTaskDate, setNewTaskDate] = useState<Date>(new Date());
  const [editId, setEditId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Task>>({});

  useEffect(() => {
    const isInitialized = localStorage.getItem('isInitialized');
    const stored = localStorage.getItem('productivityTasks');

    if (stored && isInitialized) {
      const parsed = JSON.parse(stored).map((t: any) => ({
        ...t,
        date: parseLocalDate(t.date),
        focusLevel: t.focusLevel as FocusLevel,
      }));
      setTasks(parsed);
    } else {
      fetch('/productivityTasks_two_weeks.json')
        .then(res => res.json())
        .then((data: any[]) => {
          const converted = data.map(t => ({ ...t, date: parseLocalDate(t.date) }));
          setTasks(converted);
          localStorage.setItem('productivityTasks', JSON.stringify(converted));
          localStorage.setItem('isInitialized', 'true');
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'productivityTasks',
      JSON.stringify(tasks.map(t => ({ ...t, date: t.date.toISOString().split('T')[0] })))
    );
    window.dispatchEvent(new Event('tasksUpdated'));
  }, [tasks]);

  const addTask = () => {
    if (!newTaskName || !newTaskTime) return;
    const newTask: Task = {
      id: tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
      name: newTaskName,
      time: newTaskTime.includes('min') ? newTaskTime : `${newTaskTime} min`,
      completed: false,
      focusLevel: newTaskFocus,
      date: newTaskDate,
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskName('');
    setNewTaskTime('');
    setNewTaskFocus('medium');
  };

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const saveEdit = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? {
      ...t,
      name: editValues.name || t.name,
      time: editValues.time || t.time,
      focusLevel: editValues.focusLevel as FocusLevel || t.focusLevel,
      date: editValues.date || t.date,
    } : t));
    setEditId(null);
    setEditValues({});
  };

  const getFocusLevelColor = (lvl: FocusLevel) => {
    if (lvl === 'low') return 'bg-yellow-100 text-yellow-800';
    if (lvl === 'medium') return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const today = startOfDay(new Date());
  const todayTasks = tasks.filter(t => startOfDay(t.date).getTime() === today.getTime() && !t.completed);
  const upcomingTasks = tasks.filter(t => startOfDay(t.date).getTime() > today.getTime() && !t.completed);
  const backlogTasks = tasks.filter(t => startOfDay(t.date).getTime() < today.getTime() && !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4 text-lg">
          <TabsTrigger value="today" className="text-base">Today</TabsTrigger>
          <TabsTrigger value="upcoming" className="text-base">Upcoming</TabsTrigger>
          <TabsTrigger value="all" className="text-base">Backlog</TabsTrigger>
          <TabsTrigger value="completed" className="text-base">Completed</TabsTrigger>
        </TabsList>

        {[{label: 'today', data: todayTasks}, {label: 'upcoming', data: upcomingTasks}, {label: 'all', data: backlogTasks}, {label: 'completed', data: completedTasks}].map(({label, data}) => (
          <TabsContent key={label} value={label} className="space-y-4">
            {data.length ? data.map(t => (
              <div className={`flex items-center p-4 rounded-md ${t.completed ? 'bg-teal-50 dark:bg-teal-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`} key={t.id}>
                <button onClick={() => toggleTask(t.id)} className={`h-6 w-6 rounded-full border mr-4 flex items-center justify-center ${t.completed ? 'bg-teal-500 text-white border-teal-500 dark:bg-teal-600 dark:border-teal-600' : 'border-gray-300 dark:border-gray-600'}`}>
                  {t.completed && <Check className="h-4 w-4" />}
                </button>
                {editId === t.id ? (
                  <div className="flex-1 space-y-1">
                    <Input value={editValues.name || ''} onChange={e => setEditValues({ ...editValues, name: e.target.value })} />
                    <div className="flex gap-2">
                      <Input value={editValues.time || ''} onChange={e => setEditValues({ ...editValues, time: e.target.value })} className="w-28" />
                      <Select value={editValues.focusLevel || 'medium'} onValueChange={val => setEditValues({ ...editValues, focusLevel: val as FocusLevel })}>
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Focus" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="text-xs w-36 justify-start">
                            <Calendar className="h-4 w-4 mr-1" />{format(editValues.date || t.date, 'MMM dd, yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={editValues.date || t.date} onSelect={d => d && setEditValues({ ...editValues, date: d })} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 space-y-1">
                    <p className={`text-base font-medium ${t.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'dark:text-white'}`}>{t.name}</p>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" /> {format(t.date, 'MMM dd, yyyy')}
                    </div>
                  </div>
                )}
                <div className={`px-3 py-1 rounded-full text-sm font-medium mx-2 ${getFocusLevelColor(t.focusLevel)}`}>{t.focusLevel}</div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mx-2">
                  <Clock className="h-4 w-4 mr-1" />{t.time}
                </div>
                {editId === t.id ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => saveEdit(t.id)}><Save className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditId(null); setEditValues({}); }}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => { setEditId(t.id); setEditValues({ ...t }); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            )) : <Empty label={label} />}
          </TabsContent>
        ))}
      </Tabs>

      <AddSection
        name={newTaskName}
        time={newTaskTime}
        focus={newTaskFocus}
        date={newTaskDate}
        setName={setNewTaskName}
        setTime={setNewTaskTime}
        setFocus={setNewTaskFocus}
        setDate={setNewTaskDate}
        addTask={addTask}
      />
    </div>
  );
};

const Empty: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-lg">
    No tasks for {label}.
  </div>
);

const AddSection: React.FC<any> = ({ name, time, focus, date, setName, setTime, setFocus, setDate, addTask }) => (
  <div className="pt-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-medium dark:text-white">Add New Task</h3>
    <div className="flex flex-wrap gap-3">
      <Input placeholder="Task name" value={name} onChange={e => setName(e.target.value)} className="flex-1 text-base" />
      <Input placeholder="Time (e.g. 30 min)" value={time} onChange={e => setTime(e.target.value)} className="w-32 text-base" />
      <Select value={focus} onValueChange={val => setFocus(val)}>
        <SelectTrigger className="w-32 text-base"><SelectValue placeholder="Focus Level" /></SelectTrigger>
        <SelectContent className="text-base">
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-40 text-base justify-start">
            <Calendar className="mr-2 h-4 w-4" />{format(date, 'MMM dd, yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
          <CalendarComponent mode="single" selected={date} onSelect={d => d && setDate(d)} className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
      <Button onClick={addTask} size="default" className="flex-shrink-0 text-base">
        <Plus className="h-5 w-5 mr-1" /> Add Task
      </Button>
    </div>
  </div>
);

export default TaskList;
