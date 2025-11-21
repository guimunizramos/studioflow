
import React from 'react';
import { useData } from '../../services/dataContext';
import { TaskStatus, Priority } from '../../types';
import { Clock, AlertCircle, Calendar, CheckCircle2, ArrowRight, Sun, Moon, Sunrise } from 'lucide-react';

interface HomeViewProps {
    onTaskClick?: (task: any) => void;
    onChangeView: (view: string) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onTaskClick, onChangeView }) => {
  const { tasks, clients, config } = useData();

  // Saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Bom dia', icon: <Sunrise size={32} className="text-orange-400" /> };
    if (hour < 18) return { text: 'Boa tarde', icon: <Sun size={32} className="text-yellow-500" /> };
    return { text: 'Boa noite', icon: <Moon size={32} className="text-indigo-400" /> };
  };

  const greeting = getGreeting();

  // Helper de Datas
  const getLocalISODate = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
  };
  const todayStr = getLocalISODate(new Date());

  // Métricas
  const todayTasks = tasks.filter(t => t.deadline === todayStr && t.status !== TaskStatus.COMPLETED);
  const completedToday = tasks.filter(t => t.deadline === todayStr && t.status === TaskStatus.COMPLETED);
  const urgentTasks = tasks.filter(t => t.priority === Priority.URGENT && t.status !== TaskStatus.COMPLETED);
  
  // Próximas tarefas (com horário definido para hoje)
  const upcomingSchedule = todayTasks
    .filter(t => t.startTime)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  return (
    <div className="p-8 bg-gray-50 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header de Saudação */}
        <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
                {greeting.icon}
            </div>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{greeting.text}, Gui Muniz.</h1>
                <p className="text-gray-500 text-lg">Aqui está o resumo das suas tarefas para hoje.</p>
            </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Foco Hoje */}
            <div 
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onChangeView('agenda')}
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 text-blue-600 mb-2">
                        <Calendar size={20} />
                        <span className="font-semibold">Agenda de Hoje</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-gray-900">{todayTasks.length}</span>
                        <span className="text-gray-500">tarefas restantes</span>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                        <CheckCircle2 size={16} className="mr-1" />
                        <span>{completedToday.length} concluídas hoje</span>
                    </div>
                </div>
            </div>

            {/* Card 2: Urgências */}
            <div 
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onChangeView('list_view')}
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 text-red-600 mb-2">
                        <AlertCircle size={20} />
                        <span className="font-semibold">Atenção Necessária</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-gray-900">{urgentTasks.length}</span>
                        <span className="text-gray-500">tarefas urgentes</span>
                    </div>
                    <p className="mt-4 text-sm text-gray-400">Em todo o backlog</p>
                </div>
            </div>

            {/* Card 3: Clientes Ativos */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                <div className="relative z-10">
                     <p className="text-gray-300 mb-1 font-medium">Clientes Ativos</p>
                     <h3 className="text-3xl font-bold">{clients.length}</h3>
                     <div className="mt-6 flex -space-x-2 overflow-hidden">
                        {clients.slice(0, 5).map(c => (
                            <div key={c.id} className="w-8 h-8 rounded-full border-2 border-gray-800" style={{ backgroundColor: c.color }} title={c.name}></div>
                        ))}
                        {clients.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-gray-800 bg-gray-700 flex items-center justify-center text-xs font-bold">
                                +{clients.length - 5}
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Próximas na Agenda */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Próximas na Agenda</h3>
                    <button onClick={() => onChangeView('agenda')} className="text-sm text-blue-600 font-medium hover:underline flex items-center">
                        Ver tudo <ArrowRight size={16} className="ml-1" />
                    </button>
                </div>

                <div className="space-y-4">
                    {upcomingSchedule.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Clock size={32} className="mx-auto mb-2 opacity-50" />
                            <p>Sem tarefas agendadas para o restante do dia.</p>
                        </div>
                    ) : (
                        upcomingSchedule.slice(0, 4).map(task => {
                            const client = clients.find(c => c.id === task.clientId);
                            return (
                                <div 
                                    key={task.id} 
                                    onClick={() => onTaskClick && onTaskClick(task)}
                                    className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 cursor-pointer group"
                                >
                                    <div className="w-16 text-center shrink-0">
                                        <span className="block text-lg font-bold text-gray-800">{task.startTime}</span>
                                    </div>
                                    <div className="w-1 self-stretch bg-gray-200 mx-4 rounded-full relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundColor: client?.color }}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate">{task.title}</h4>
                                        <p className="text-sm text-gray-500 truncate">{client?.name}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2">
                                        <ArrowRight size={18} className="text-gray-400" />
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Quick Actions / Status */}
            <div className="space-y-6">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-2">Lembrete Rápido</h3>
                    <p className="text-sm text-blue-800 mb-4">Não se esqueça de organizar a agenda para amanhã antes de finalizar o dia.</p>
                    <button 
                        onClick={() => onChangeView('agenda')}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                    >
                        Ir para Agenda
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default HomeView;
