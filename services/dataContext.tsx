
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo, useCallback } from 'react';
import { Client, Project, Task, AppConfig, TaskStatus } from '../types';
import { SEED_CLIENTS, SEED_PROJECTS, SEED_TASKS, WEEKDAY_LABELS_SUN_FIRST } from '../constants';
import { getStorageAdapter, DatabaseSchema } from './storage';
import { createEmptySchema, updateChecksum } from './storage/storage-utils';

interface AutoScheduleResult {
  addedCount: number;
  message: string;
}

interface DataContextType {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  config: AppConfig;
  updateTaskStatus: (taskId: string, status: any) => void;
  updateTask: (task: Task) => void;
  addTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  autoScheduleDay: (date: string) => AutoScheduleResult;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const storage = getStorageAdapter();
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>(SEED_CLIENTS);
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);
  const [config, setConfig] = useState<AppConfig>({
    totalHoursPerDay: 8,
    workWindowStart: '09:00',
    workWindowEnd: '18:00',
    notes: '',
    unavailableDays: [],
    agencyName: 'StudioFlow',
    userName: '',
    breaks: [],
    visual: {
      themeMode: 'light',
      density: 'comfortable'
    }
  });

  // Ref para rastrear se é a primeira carga
  const isInitialLoad = useRef(true);
  // Ref para evitar salvamento durante carregamento inicial
  const isSavingEnabled = useRef(false);

  // Carrega dados do armazenamento na inicialização
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = await storage.load();
        
        if (savedData) {
          // Usa dados salvos
          setClients(savedData.clients);
          setProjects(savedData.projects);
          setTasks(savedData.tasks);
          setConfig(savedData.config);
        } else {
          // Primeira execução - inicializa com dados padrão
          const emptySchema = createEmptySchema();
          const schemaWithMetadata: DatabaseSchema = await updateChecksum({
            ...emptySchema,
            metadata: {
              lastSync: new Date().toISOString(),
              lastBackup: '',
              checksum: ''
            }
          });
          await storage.save(schemaWithMetadata);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Em caso de erro, usa dados seed
      } finally {
        setIsLoading(false);
        isSavingEnabled.current = true;
      }
    };

    loadData();
  }, []);

  // Salva dados automaticamente quando há mudanças
  useEffect(() => {
    if (!isSavingEnabled.current || isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    const saveData = async () => {
      try {
        const dataToSave: DatabaseSchema = await updateChecksum({
          version: 1,
          clients,
          projects,
          tasks,
          config,
          metadata: {
            lastSync: new Date().toISOString(),
            lastBackup: '',
            checksum: ''
          }
        });
        await storage.save(dataToSave);
      } catch (error) {
        console.error('Erro ao salvar dados:', error);
      }
    };

    saveData();
  }, [clients, projects, tasks, config]);

  // Salva dados ao fechar aplicação
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (storage && typeof (storage as any).flush === 'function') {
        try {
          await (storage as any).flush();
        } catch (error) {
          console.error('Erro ao salvar dados ao fechar:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const updateTaskStatus = useCallback((taskId: string, newStatus: any) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  }, []);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  }, []);

  const addTask = useCallback((newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const addClient = useCallback((client: Client) => {
    setClients(prev => [...prev, client]);
  }, []);

  const updateClient = useCallback((updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  }, []);

  const deleteClient = useCallback((clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Algoritmo de Agendamento que atualiza diretamente as Tarefas
  const autoScheduleDay = useCallback((dateStr: string): AutoScheduleResult => {
    const globalStart = parseInt(config.workWindowStart.split(':')[0]);
    const globalEnd = parseInt(config.workWindowEnd.split(':')[0]);

    // 1. Identificar horas já ocupadas no dia por outras tarefas
    // Considera tarefas que já tem startTime definido para este dia
    const occupiedHours = new Set<number>();

    tasks.forEach(t => {
      if (t.deadline === dateStr && t.startTime) {
         const start = parseInt(t.startTime.split(':')[0]);
         const duration = Math.ceil(t.estimatedHours);
         for(let i=0; i<duration; i++) occupiedHours.add(start + i);
      }
    });

    // 1b. Marca intervalos bloqueados (ex: almoço) como ocupados
    (config.breaks || []).forEach(b => {
      const breakStart = parseInt(b.start.split(':')[0]);
      const breakEnd = parseInt(b.end.split(':')[0]);
      for (let h = breakStart; h < breakEnd; h++) occupiedHours.add(h);
    });

    const clientsById = new Map<string, Client>(clients.map(c => [c.id, c]));
    const weekdayLabel = WEEKDAY_LABELS_SUN_FIRST[new Date(dateStr + 'T00:00:00').getDay()];

    // 2. Selecionar tarefas pendentes (que NÃO estão agendadas para hoje ou não tem hora)
    // Inclui tarefas atrasadas ou de dias futuros para trazer para hoje
    const pendingTasks = tasks.filter(t => 
      t.status !== TaskStatus.COMPLETED && 
      t.status !== TaskStatus.PAUSED &&
      t.status !== TaskStatus.WAITING_CLIENT &&
      // Se já está agendada para hoje com hora definida, não mexer
      !(t.deadline === dateStr && t.startTime)
    );

    // 3. Ordenar por Prioridade
    pendingTasks.sort((a, b) => {
      const priorityWeight: Record<string, number> = { 'Urgente': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
      const pA = priorityWeight[a.priority] || 0;
      const pB = priorityWeight[b.priority] || 0;
      if (pA !== pB) return pB - pA;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    const tasksToUpdate: Task[] = [];
    let addedCount = 0;

    // 4. Tentar encaixar
    for (const task of pendingTasks) {
        if (occupiedHours.size >= (globalEnd - globalStart)) break;

        const desiredDuration = Math.min(task.estimatedHours, 4); // Max 4h block per auto-schedule

        // Se o cliente da tarefa tem janelas de trabalho preferenciais para
        // este dia da semana, restringe a busca a elas; senão usa a janela
        // global (comportamento anterior, mantido para clientes sem blocos).
        const client = clientsById.get(task.clientId);
        const clientBlocksToday = (client?.workBlocks || []).filter(wb => wb.day === weekdayLabel);
        const candidateRanges = clientBlocksToday.length > 0
            ? clientBlocksToday.map(wb => ({
                start: Math.max(globalStart, parseInt(wb.start.split(':')[0])),
                end: Math.min(globalEnd, parseInt(wb.end.split(':')[0])),
              }))
            : [{ start: globalStart, end: globalEnd }];

        let slotFound = -1;

        // Tenta encontrar slot dentro de alguma janela candidata
        rangeSearch:
        for (const range of candidateRanges) {
            for (let hour = range.start; hour <= (range.end - desiredDuration); hour++) {
                let fits = true;
                for (let d = 0; d < desiredDuration; d++) {
                    if (occupiedHours.has(hour + d)) {
                        fits = false;
                        break;
                    }
                }
                if (fits) {
                    slotFound = hour;
                    break rangeSearch;
                }
            }
        }

        if (slotFound !== -1) {
            // Agenda a tarefa
            const updatedTask: Task = {
                ...task,
                deadline: dateStr, // Move a data para hoje
                startTime: `${slotFound.toString().padStart(2, '0')}:00` // Define a hora
            };
            
            tasksToUpdate.push(updatedTask);
            addedCount++;

            // Marca horas como ocupadas
            for (let d = 0; d < desiredDuration; d++) {
                occupiedHours.add(slotFound + d);
            }
        }
    }

    if (tasksToUpdate.length > 0) {
        setTasks(prev => prev.map(t => {
            const updated = tasksToUpdate.find(up => up.id === t.id);
            return updated || t;
        }));
        return { addedCount, message: `${addedCount} tarefas foram organizadas para hoje!` };
    }
    return { addedCount: 0, message: 'Agenda cheia ou sem tarefas pendentes adequadas para hoje.' };
  }, [tasks, config, clients]);

  const value = useMemo(() => ({
    clients, projects, tasks, config,
    updateTaskStatus, updateTask, addTask, deleteTask, addClient, updateClient, deleteClient, updateConfig, autoScheduleDay
  }), [clients, projects, tasks, config, updateTaskStatus, updateTask, addTask, deleteTask, addClient, updateClient, deleteClient, updateConfig, autoScheduleDay]);

  // Mostra loading durante carregamento inicial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Carregando dados...</div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
