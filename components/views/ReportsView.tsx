import React, { useState } from 'react';
import { useData } from '../../services/dataContext';
import { TaskStatus } from '../../types';
import { PieChart, BarChart3, TrendingUp, Calendar } from 'lucide-react';

const ReportsView: React.FC = () => {
  const { clients, tasks, config } = useData();
  const [period, setPeriod] = useState<'week' | 'month'>('month');

  // Helper para verificar se data está no período
  const isDateInPeriod = (dateStr: string) => {
    const date = new Date(dateStr);
    // Zerar horas para comparação apenas de data
    date.setHours(0,0,0,0);
    
    const today = new Date();
    today.setHours(0,0,0,0);

    if (period === 'month') {
        return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    } else {
        // Lógica da semana (Domingo a Sábado da semana atual)
        const day = today.getDay(); 
        const diff = today.getDate() - day; 
        const startOfWeek = new Date(today);
        startOfWeek.setDate(diff);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        return date >= startOfWeek && date <= endOfWeek;
    }
  };

  // Calculate totals based on period
  const clientStats = clients.map(client => {
    // Filtrar tarefas que pertencem a este período (baseado no Prazo)
    const periodTasks = tasks.filter(t => t.clientId === client.id && isDateInPeriod(t.deadline));
    
    const completedTasks = periodTasks.filter(t => t.status === TaskStatus.COMPLETED);
    
    // Soma horas estimadas das tarefas concluídas neste período
    const executedHours = completedTasks.reduce((acc, task) => acc + task.estimatedHours, 0);
    
    const totalPending = periodTasks.filter(t => t.status !== TaskStatus.COMPLETED).length;

    // Cálculo de horas contratadas
    const contractedHours = period === 'week' ? client.weeklyHours : client.weeklyHours * 4;

    return {
        client,
        totalTasks: periodTasks.length,
        completedTasks: completedTasks.length,
        executedHours,
        contractedHours,
        pendingTasks: totalPending
    };
  });

  const totalExecuted = clientStats.reduce((acc, curr) => acc + curr.executedHours, 0);
  const totalCompleted = clientStats.reduce((acc, curr) => acc + curr.completedTasks, 0);
  const totalPendingGlobal = clientStats.reduce((acc, curr) => acc + curr.pendingTasks, 0);

  return (
    <div className="p-6 bg-gray-50 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Relatórios de Desempenho</h2>
                <p className="text-gray-500">Acompanhamento de horas e entregas por cliente.</p>
            </div>

            {/* Toggle Period */}
            <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm">
                <button 
                    onClick={() => setPeriod('week')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${period === 'week' ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                    style={period === 'week' ? { backgroundColor: config.visual.primaryColor } : {}}
                >
                    <Calendar size={16} />
                    <span>Esta Semana</span>
                </button>
                <button 
                    onClick={() => setPeriod('month')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${period === 'month' ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                    style={period === 'month' ? { backgroundColor: config.visual.primaryColor } : {}}
                >
                    <Calendar size={16} />
                    <span>Este Mês</span>
                </button>
            </div>
        </div>

        {/* Cards Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><TrendingUp size={20} /></div>
                    <span className="text-sm font-medium text-gray-500">Horas Executadas ({period === 'week' ? 'Semana' : 'Mês'})</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                    {totalExecuted}h
                </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600"><BarChart3 size={20} /></div>
                    <span className="text-sm font-medium text-gray-500">Tarefas Concluídas</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                    {totalCompleted}
                </p>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><PieChart size={20} /></div>
                    <span className="text-sm font-medium text-gray-500">Pendentes no Período</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                    {totalPendingGlobal}
                </p>
            </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Detalhamento por Cliente</h3>
                <span className="text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded text-gray-500 uppercase">
                    {period === 'week' ? 'Visão Semanal' : 'Visão Mensal'}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-medium">Cliente</th>
                            <th className="px-6 py-3 font-medium">Horas Contratadas</th>
                            <th className="px-6 py-3 font-medium">Horas Executadas</th>
                            <th className="px-6 py-3 font-medium">Consumo</th>
                            <th className="px-6 py-3 font-medium">Entregas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {clientStats.map((stat, index) => {
                            const percentage = stat.contractedHours > 0 ? (stat.executedHours / stat.contractedHours) * 100 : 0;
                            return (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.client.color }}></div>
                                        <span>{stat.client.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{stat.contractedHours}h</td>
                                    <td className="px-6 py-4 text-gray-900 font-semibold">{stat.executedHours}h</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full ${percentage > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500">{percentage.toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {stat.completedTasks} <span className="text-gray-300">/</span> {stat.totalTasks}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {clientStats.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    Nenhum dado encontrado para este período.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;