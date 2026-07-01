
import React, { useState } from 'react';
import { useData } from '../../services/dataContext';
import { Save, Calculator, AlertTriangle, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { Break } from '../../types';
import { WEEKDAY_LABELS_SUN_FIRST } from '../../constants';

const SettingsView: React.FC = () => {
  const { config, updateConfig, clients, updateClient } = useData();
  const [localConfig, setLocalConfig] = useState({
      totalHoursPerDay: config.totalHoursPerDay,
      workWindowStart: config.workWindowStart,
      workWindowEnd: config.workWindowEnd,
      agencyName: config.agencyName,
      userName: config.userName,
      notes: config.notes,
      unavailableDays: config.unavailableDays,
      breaks: config.breaks,
  });
  const [saveConfirmation, setSaveConfirmation] = useState(false);
  const [newBreak, setNewBreak] = useState<Omit<Break, 'id'>>({ name: 'Almoço', start: '12:00', end: '13:00' });

  const handleSave = () => {
    updateConfig(localConfig);
    setSaveConfirmation(true);
    setTimeout(() => setSaveConfirmation(false), 3000);
  };

  const toggleUnavailableDay = (day: string) => {
    setLocalConfig(prev => ({
        ...prev,
        unavailableDays: prev.unavailableDays.includes(day)
            ? prev.unavailableDays.filter(d => d !== day)
            : [...prev.unavailableDays, day]
    }));
  };

  const addBreak = () => {
    setLocalConfig(prev => ({
        ...prev,
        breaks: [...prev.breaks, { ...newBreak, id: `b-${Date.now()}` }]
    }));
  };

  const removeBreak = (id: string) => {
    setLocalConfig(prev => ({ ...prev, breaks: prev.breaks.filter(b => b.id !== id) }));
  };

  const handleClientHoursChange = (id: string, value: string, type: 'weekly' | 'daily') => {
    const client = clients.find(c => c.id === id);
    if (client) {
        let newWeekly = 0;
        if (type === 'weekly') {
            newWeekly = Number(value);
        } else {
            newWeekly = Number(value) * 5; // Assume 5 dias úteis
        }
        updateClient({ ...client, weeklyHours: newWeekly });
    }
  };

  const totalAllocatedWeekly = clients.reduce((sum, client) => sum + client.weeklyHours, 0);
  const capacityWeekly = config.totalHoursPerDay * 5;

  return (
    <div className="p-6 bg-[#f2f2f3] dark:bg-black h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">Configurações Gerais</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Configurações da Agência */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Jornada de Trabalho</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horas Totais por Dia</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={localConfig.totalHoursPerDay}
                                    onChange={e => setLocalConfig({...localConfig, totalHoursPerDay: Number(e.target.value)})}
                                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg pl-3 pr-10 py-2 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 outline-none"
                                />
                                <span className="absolute right-3 top-2 text-gray-400 dark:text-gray-500 text-sm">h</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Capacidade diária da agência.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Início</label>
                                <input
                                    type="time"
                                    value={localConfig.workWindowStart}
                                    onChange={e => setLocalConfig({...localConfig, workWindowStart: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fim</label>
                                <input
                                    type="time"
                                    value={localConfig.workWindowEnd}
                                    onChange={e => setLocalConfig({...localConfig, workWindowEnd: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 outline-none text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dias Indisponíveis</label>
                            <div className="flex flex-wrap gap-2">
                                {WEEKDAY_LABELS_SUN_FIRST.map(day => {
                                    const active = localConfig.unavailableDays.includes(day);
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleUnavailableDay(day)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                                active
                                                    ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            className="w-full mt-4 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-90 flex items-center justify-center space-x-2"
                        >
                            <Save size={18} />
                            <span>Salvar Config</span>
                        </button>
                        {saveConfirmation && (
                            <div className="flex items-start space-x-2 p-3 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 rounded-lg text-xs">
                                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                                <p>Configurações salvas com sucesso.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Identidade */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Identidade</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Agência</label>
                            <input
                                type="text"
                                value={localConfig.agencyName}
                                onChange={e => setLocalConfig({...localConfig, agencyName: e.target.value})}
                                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seu Nome</label>
                            <input
                                type="text"
                                value={localConfig.userName}
                                onChange={e => setLocalConfig({...localConfig, userName: e.target.value})}
                                placeholder="Ex: Gui Muniz"
                                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Resumo de Capacidade */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wider">Saúde da Agência</h3>

                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Ocupação Semanal</span>
                            <span className={`font-bold ${totalAllocatedWeekly > capacityWeekly ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-50'}`}>
                                {totalAllocatedWeekly}h / {capacityWeekly}h
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${totalAllocatedWeekly > capacityWeekly ? 'bg-red-500' : 'bg-black dark:bg-white'}`}
                                style={{ width: `${Math.min((totalAllocatedWeekly / capacityWeekly) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {totalAllocatedWeekly > capacityWeekly ? (
                        <div className="flex items-start space-x-2 p-3 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded-lg text-xs">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <p>Você vendeu <strong>{totalAllocatedWeekly - capacityWeekly} horas</strong> a mais do que sua capacidade de entrega!</p>
                        </div>
                    ) : (
                        <div className="flex items-start space-x-2 p-3 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 rounded-lg text-xs">
                            <Calculator size={16} className="shrink-0 mt-0.5" />
                            <p>Você ainda tem <strong>{capacityWeekly - totalAllocatedWeekly} horas</strong> livres para vender por semana.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Distribuição por Cliente */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Distribuição de Horas por Cliente</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">Defina o contrato semanal ou a meta diária. O cálculo é feito automaticamente considerando 5 dias úteis.</p>

                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 dark:text-gray-600 uppercase border-b border-gray-100 dark:border-gray-800 pb-2">
                            <div className="col-span-6">Cliente</div>
                            <div className="col-span-3 text-center">Horas/Semana</div>
                            <div className="col-span-3 text-center">Média/Dia</div>
                        </div>

                        {clients.map(client => (
                            <div key={client.id} className="grid grid-cols-12 gap-4 items-center py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors px-2 -mx-2">
                                <div className="col-span-6 flex items-center space-x-3">
                                     <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: client.color }}></div>
                                     <div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300 block truncate">{client.name}</span>
                                        <span className="text-xs text-gray-400 dark:text-gray-600 block truncate">{client.category}</span>
                                     </div>
                                </div>

                                <div className="col-span-3 relative">
                                    <input
                                        type="number"
                                        value={client.weeklyHours}
                                        onChange={(e) => handleClientHoursChange(client.id, e.target.value, 'weekly')}
                                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 outline-none"
                                    />
                                </div>

                                <div className="col-span-3 relative">
                                    <input
                                        type="number"
                                        value={client.weeklyHours / 5}
                                        onChange={(e) => handleClientHoursChange(client.id, e.target.value, 'daily')}
                                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 outline-none"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Intervalos Bloqueados */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Intervalos Bloqueados</h3>
                    <div className="space-y-2 mb-3">
                        {localConfig.breaks.map(b => (
                            <div key={b.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 text-sm">
                                <span className="text-gray-700 dark:text-gray-300">{b.name}: {b.start} - {b.end}</span>
                                <button
                                    onClick={() => removeBreak(b.id)}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {localConfig.breaks.length === 0 && (
                            <p className="text-xs text-gray-400 dark:text-gray-600 italic">Nenhum intervalo bloqueado.</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newBreak.name}
                            onChange={e => setNewBreak({...newBreak, name: e.target.value})}
                            placeholder="Nome (ex: Almoço)"
                            className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm outline-none"
                        />
                        <input
                            type="time"
                            value={newBreak.start}
                            onChange={e => setNewBreak({...newBreak, start: e.target.value})}
                            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm outline-none"
                        />
                        <input
                            type="time"
                            value={newBreak.end}
                            onChange={e => setNewBreak({...newBreak, end: e.target.value})}
                            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm outline-none"
                        />
                        <button
                            onClick={addBreak}
                            className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-lg text-sm hover:opacity-90"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                {/* Notas */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Notas</h3>
                    <textarea
                        value={localConfig.notes}
                        onChange={e => setLocalConfig({...localConfig, notes: e.target.value})}
                        placeholder="Anotações gerais..."
                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 outline-none h-40 resize-none"
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
