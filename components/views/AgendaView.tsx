
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../services/dataContext';
import { Task, AgendaViewMode, TaskStatus, Priority } from '../../types';
import { ChevronLeft, ChevronRight, Wand2, Calendar as CalendarIcon, Clock, CheckCircle2, GripHorizontal, AlertCircle } from 'lucide-react';

// --- Constants ---
const START_HOUR = 8;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
const CELL_HEIGHT = 100; // Pixels per hour

// --- Helper Components ---

const AgendaTaskCard: React.FC<{
  task: Task;
  clientColor: string;
  clientName: string;
  isCompleted: boolean;
  height?: number;
  onToggleComplete: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
}> = ({ task, clientColor, clientName, isCompleted, height, onToggleComplete, onResizeStart, onDragStart, onClick }) => {
  
  const baseStyle = isCompleted
    ? 'bg-white/80 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)] opacity-70'
    : 'bg-white border-transparent hover:shadow-md';

  const borderStyle = isCompleted 
    ? { borderColor: '#22c55e', borderWidth: '2px' } 
    : { borderLeftWidth: '4px', borderLeftColor: clientColor, backgroundColor: `${clientColor}15` }; // 15 = ~10% opacity hex

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`relative rounded-lg p-2 text-xs cursor-move group transition-all border border-gray-200 overflow-hidden ${baseStyle}`}
      style={{
        height: height ? `${height}px` : 'auto',
        minHeight: height ? undefined : '60px', // For unscheduled or month view
        ...borderStyle
      }}
    >
      <div className="flex justify-between items-start mb-1">
        <span className={`font-bold truncate mr-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
          {task.startTime || ''}
        </span>
        <button
          onClick={onToggleComplete}
          className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors z-20 ${
            isCompleted ? 'bg-green-500 text-white' : 'bg-white hover:bg-green-100 text-gray-300 border border-gray-200'
          }`}
        >
          <CheckCircle2 size={14} />
        </button>
      </div>

      <div className="pr-4">
        <p className={`font-semibold truncate leading-tight mb-0.5 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
          {clientName}
        </p>
        <p className={`truncate text-[10px] ${isCompleted ? 'line-through text-gray-400' : 'text-gray-600'}`}>
          {task.title}
        </p>
      </div>

      {/* Resize Handle (Only for timed tasks) */}
      {onResizeStart && (
        <div
          className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/5 transition-opacity z-10"
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e); }}
        >
          <GripHorizontal size={12} className="text-gray-400" />
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

const AgendaView: React.FC<{ onTaskClick?: (task: Task) => void }> = ({ onTaskClick }) => {
  const { tasks, clients, updateTask, updateTaskStatus, autoScheduleDay } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<AgendaViewMode>(AgendaViewMode.WEEK);
  const [resizingTask, setResizingTask] = useState<{ id: string, startY: number, startDuration: number } | null>(null);

  // --- Helpers ---

  const getLocalISODate = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
  };

  const getDatesInView = useMemo(() => {
    const d = new Date(currentDate);
    const dates: Date[] = [];

    if (viewMode === AgendaViewMode.MONTH) {
      d.setDate(1); // Start of month
      const month = d.getMonth();
      while (d.getMonth() === month) {
        dates.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
      // Pad start to monday
      const firstDay = dates[0].getDay(); // 0 = Sun
      const padStart = firstDay === 0 ? 6 : firstDay - 1;
      for(let i=0; i<padStart; i++) {
          const prev = new Date(dates[0]);
          prev.setDate(prev.getDate() - 1);
          dates.unshift(prev);
      }
    } else {
      // Week or Fortnight
      const day = d.getDay(); // 0 = Sun
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      d.setDate(diff);
      
      const daysCount = viewMode === AgendaViewMode.WEEK ? 7 : 14;
      for (let i = 0; i < daysCount; i++) {
        dates.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
    }
    return dates;
  }, [currentDate, viewMode]);

  // --- Logic ---

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === AgendaViewMode.MONTH) {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      const days = viewMode === AgendaViewMode.WEEK ? 7 : 14;
      newDate.setDate(newDate.getDate() + (direction === 'next' ? days : -days));
    }
    setCurrentDate(newDate);
  };

  const handleDrop = (e: React.DragEvent, date: Date, hour?: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      const dateStr = getLocalISODate(date);
      // If dropped on a specific hour, set time. If dropped on "Unscheduled" header, clear time (or keep it? Let's clear it to be explicitly 'unscheduled' for that day)
      // Actually, users might drop on header to just change day. Let's keep time if dropped on header, OR set to undefined?
      // Prompt says "tasks sem horário". So if dropped on header, maybe remove startTime? 
      // Let's set it to 09:00 default if dropped on header, OR undefined.
      // Better UX: Dropping on specific hour sets hour. Dropping on day header keeps current time or sets to undefined? 
      // Let's make the header explicitly "Sem Horário" (No Time).
      
      const timeStr = hour !== undefined 
        ? `${hour.toString().padStart(2, '0')}:00` 
        : undefined; // Undefined removes the time

      updateTask({
        ...task,
        deadline: dateStr,
        startTime: timeStr
      });
    }
  };

  const handleResizeStart = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setResizingTask({
      id: task.id,
      startY: e.clientY,
      startDuration: task.estimatedHours || 1
    });
  };

  // Global Resize Listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingTask) return;
      const diff = e.clientY - resizingTask.startY;
      const hourSteps = Math.round(diff / CELL_HEIGHT); // 100px per hour
      if (hourSteps !== 0) {
          // Just visual cursor changes usually, but we update on MouseUp to save writes
          document.body.style.cursor = 'ns-resize';
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!resizingTask) return;
      document.body.style.cursor = 'default';
      const diff = e.clientY - resizingTask.startY;
      const hourSteps = Math.round(diff / CELL_HEIGHT);
      const newDuration = Math.max(1, resizingTask.startDuration + hourSteps);
      
      const task = tasks.find(t => t.id === resizingTask.id);
      if (task && newDuration !== task.estimatedHours) {
        updateTask({ ...task, estimatedHours: newDuration });
      }
      setResizingTask(null);
    };

    if (resizingTask) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingTask, tasks, updateTask]);

  // --- Renderers ---

  const renderMonthView = () => {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-200 p-1">
        <div className="grid grid-cols-7 gap-1 min-h-full">
           {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
             <div key={d} className="p-2 text-center font-bold text-gray-500 bg-gray-50">{d}</div>
           ))}
           {getDatesInView.map((date, i) => {
             const dateStr = getLocalISODate(date);
             const dayTasks = tasks.filter(t => t.deadline === dateStr);
             const isCurrentMonth = date.getMonth() === currentDate.getMonth();
             const isToday = dateStr === getLocalISODate(new Date());

             return (
               <div 
                  key={i} 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, date)}
                  className={`bg-white min-h-[120px] p-2 flex flex-col gap-1 hover:bg-gray-50 transition-colors ${!isCurrentMonth ? 'opacity-50' : ''}`}
                >
                 <div className={`text-right text-sm font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                   {date.getDate()}
                 </div>
                 <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                   {dayTasks.map(task => {
                     const client = clients.find(c => c.id === task.clientId);
                     return (
                        <div 
                          key={task.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                          className={`h-1.5 w-full rounded-full`}
                          style={{ backgroundColor: client?.color }}
                          title={`${task.title} - ${client?.name}`}
                        />
                     );
                   })}
                   <div className="text-xs text-gray-400 mt-auto pt-1 text-center">
                      {dayTasks.length} tarefas
                   </div>
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        
        {/* Header Dates */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <div className="w-16 shrink-0 border-r border-gray-200 bg-white"></div> {/* Time Column Spacer */}
          <div className="flex-1 flex overflow-x-auto hide-scrollbar">
             {getDatesInView.map(date => {
               const dateStr = getLocalISODate(date);
               const isToday = dateStr === getLocalISODate(new Date());
               return (
                 <div key={dateStr} className={`flex-1 min-w-[160px] p-2 text-center border-r border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                      {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                      {date.getDate()}
                    </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="flex min-h-full">
                
                {/* Time Labels Column */}
                <div className="w-16 shrink-0 border-r border-gray-200 bg-white sticky left-0 z-30">
                    {/* Unscheduled Row Label */}
                    <div className="h-auto min-h-[60px] border-b border-gray-200 p-2 text-xs text-center text-gray-400 flex items-center justify-center bg-gray-50/50 font-medium">
                       Sem Horário
                    </div>
                    {HOURS.map(h => (
                        <div key={h} className="border-b border-gray-100 text-xs text-gray-400 flex items-center justify-center" style={{ height: `${CELL_HEIGHT}px` }}>
                            {h.toString().padStart(2, '0')}:00
                        </div>
                    ))}
                </div>

                {/* Days Columns */}
                <div className="flex-1 flex">
                    {getDatesInView.map(date => {
                        const dateStr = getLocalISODate(date);
                        const dayTasks = tasks.filter(t => t.deadline === dateStr);
                        
                        // Separate scheduled vs unscheduled
                        const unscheduledTasks = dayTasks.filter(t => !t.startTime);
                        
                        return (
                            <div key={dateStr} className="flex-1 min-w-[160px] border-r border-gray-200 flex flex-col relative bg-white">
                                
                                {/* Unscheduled Drop Zone */}
                                <div 
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, date, undefined)} // Undefined hour = remove time
                                    className="min-h-[60px] border-b-4 border-double border-gray-200 bg-gray-50/30 p-1 gap-1 flex flex-col transition-colors hover:bg-gray-100/50"
                                >
                                    {unscheduledTasks.length === 0 && (
                                        <div className="text-[10px] text-gray-300 text-center mt-2 italic">Arraste aqui para remover horário</div>
                                    )}
                                    {unscheduledTasks.map(task => {
                                         const client = clients.find(c => c.id === task.clientId);
                                         return (
                                             <AgendaTaskCard 
                                                key={task.id}
                                                task={task}
                                                clientColor={client?.color || '#ccc'}
                                                clientName={client?.name || 'Unknown'}
                                                isCompleted={task.status === TaskStatus.COMPLETED}
                                                onClick={() => onTaskClick && onTaskClick(task)}
                                                onToggleComplete={(e) => updateTaskStatus(task.id, task.status === TaskStatus.COMPLETED ? TaskStatus.PLANNED : TaskStatus.COMPLETED)}
                                                onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                                             />
                                         )
                                    })}
                                </div>

                                {/* Hourly Grid */}
                                <div className="relative flex-1">
                                     {/* Grid Lines Background */}
                                     {HOURS.map(h => (
                                         <div 
                                            key={h} 
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleDrop(e, date, h)}
                                            className="border-b border-gray-100 box-border transition-colors hover:bg-blue-50/30"
                                            style={{ height: `${CELL_HEIGHT}px` }}
                                         />
                                     ))}

                                     {/* Scheduled Tasks (Absolute Positioning) */}
                                     {dayTasks.filter(t => t.startTime).map(task => {
                                         if(!task.startTime) return null;
                                         const client = clients.find(c => c.id === task.clientId);
                                         const hour = parseInt(task.startTime.split(':')[0]);
                                         
                                         // Calculate position relative to start hour
                                         if (hour < START_HOUR || hour > END_HOUR) return null; // Out of view
                                         
                                         const top = (hour - START_HOUR) * CELL_HEIGHT;
                                         const height = (task.estimatedHours || 1) * CELL_HEIGHT;

                                         return (
                                             <div 
                                                key={task.id}
                                                className="absolute left-1 right-1 z-10"
                                                style={{ top: `${top}px` }}
                                             >
                                                 <AgendaTaskCard 
                                                    task={task}
                                                    height={height - 4} // -4 for spacing
                                                    clientColor={client?.color || '#ccc'}
                                                    clientName={client?.name || 'Unknown'}
                                                    isCompleted={task.status === TaskStatus.COMPLETED}
                                                    onClick={() => onTaskClick && onTaskClick(task)}
                                                    onToggleComplete={(e) => updateTaskStatus(task.id, task.status === TaskStatus.COMPLETED ? TaskStatus.PLANNED : TaskStatus.COMPLETED)}
                                                    onResizeStart={(e) => handleResizeStart(e, task)}
                                                    onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                                                 />
                                             </div>
                                         );
                                     })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon size={20} className="text-blue-600" />
            Agenda
          </h2>
          <p className="text-sm text-gray-500">Visão completa de todas as tarefas.</p>
        </div>

        <div className="flex items-center gap-3">
           <button
             onClick={() => autoScheduleDay(getLocalISODate(new Date()))}
             className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium transition-colors"
           >
             <Wand2 size={16} />
             <span>Organizar Hoje</span>
           </button>

           <div className="flex bg-gray-100 rounded-lg p-1">
              {[AgendaViewMode.WEEK, AgendaViewMode.FORTNIGHT, AgendaViewMode.MONTH].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === mode ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {mode}
                </button>
              ))}
           </div>

           <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <button onClick={() => navigate('prev')} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium w-32 text-center text-gray-700">
                 {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => navigate('next')} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                <ChevronRight size={20} />
              </button>
           </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === AgendaViewMode.MONTH ? renderMonthView() : renderTimelineView()}
    </div>
  );
};

export default AgendaView;
