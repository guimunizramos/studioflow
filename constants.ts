
import { 
  Client, ClientCategory, Priority, Project, ProjectStatus, ProjectType, 
  Task, TaskStatus, TaskType
} from './types';

// Helper to get local YYYY-MM-DD
const toLocalISOString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

export const SEED_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Toque Bateria Já',
    brand: 'TBJ Academy',
    category: ClientCategory.DRUMS,
    color: '#ef4444', // Red
    weeklyHours: 10,
    minDailyHours: 1,
    priority: Priority.HIGH,
    observations: 'Foco em lançamentos trimestrais.',
  },
  {
    id: 'c2',
    name: 'YouCon',
    brand: 'YouCon Construtora',
    category: ClientCategory.REAL_ESTATE,
    color: '#3b82f6', // Blue
    weeklyHours: 5,
    minDailyHours: 0.5,
    priority: Priority.MEDIUM,
    observations: 'Postagens institucionais.',
  },
  {
    id: 'c3',
    name: 'Biosalli',
    brand: 'Clínica Biosalli',
    category: ClientCategory.HEALTH,
    color: '#10b981', // Emerald
    weeklyHours: 8,
    minDailyHours: 1,
    priority: Priority.HIGH,
    observations: 'Conteúdo técnico de saúde.',
  },
  {
    id: 'c4',
    name: 'Studio Arq',
    brand: 'Mattos Arquitetura',
    category: ClientCategory.ARCHITECTURE,
    color: '#f59e0b', // Amber
    weeklyHours: 4,
    minDailyHours: 0,
    priority: Priority.LOW,
    observations: 'Portfólio visual.',
  }
];

export const SEED_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Lançamento Curso Básico',
    clientId: 'c1',
    status: ProjectStatus.EXECUTION,
    type: ProjectType.LAUNCH,
    startDate: '2023-10-01',
    estimatedDeadline: '2023-11-15',
    description: 'Campanha de lançamento Q4.',
  },
  {
    id: 'p2',
    name: 'Gestão Social Media',
    clientId: 'c2',
    status: ProjectStatus.CONTINUOUS,
    type: ProjectType.CONTINUOUS,
    startDate: '2023-01-01',
    estimatedDeadline: '2024-12-31',
    description: 'Posts semanais.',
  },
  {
    id: 'p3',
    name: 'Rebranding Site',
    clientId: 'c3',
    status: ProjectStatus.PLANNING,
    type: ProjectType.ADJUSTMENT,
    startDate: '2023-10-20',
    estimatedDeadline: '2023-12-01',
    description: 'Novo site institucional.',
  }
];

const todayDate = new Date();
const today = toLocalISOString(todayDate);
const tomorrowDate = new Date(todayDate); tomorrowDate.setDate(todayDate.getDate() + 1);
const tomorrow = toLocalISOString(tomorrowDate);
const in3DaysDate = new Date(todayDate); in3DaysDate.setDate(todayDate.getDate() + 3);
const in3Days = toLocalISOString(in3DaysDate);

export const SEED_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Criar Landing Page de Captura',
    description: 'Página para inscrição no evento gratuito.',
    clientId: 'c1',
    projectId: 'p1',
    status: TaskStatus.IN_PROGRESS,
    type: TaskType.LANDING,
    priority: Priority.URGENT,
    estimatedHours: 4,
    deadline: today,
    startTime: '09:00',
    createdAt: '2023-10-01',
    isRecurring: false,
  },
  {
    id: 't2',
    title: 'Escrever Sequência de Emails',
    description: '3 emails de aquecimento.',
    clientId: 'c1',
    projectId: 'p1',
    status: TaskStatus.BACKLOG,
    type: TaskType.COPY,
    priority: Priority.HIGH,
    estimatedHours: 2,
    deadline: tomorrow,
    startTime: '14:00',
    createdAt: '2023-10-05',
    isRecurring: false,
  },
  {
    id: 't3',
    title: 'Design Posts Novembro',
    description: '12 peças para feed.',
    clientId: 'c2',
    projectId: 'p2',
    status: TaskStatus.PLANNED,
    type: TaskType.DESIGN,
    priority: Priority.MEDIUM,
    estimatedHours: 6,
    deadline: in3Days,
    startTime: '10:00',
    createdAt: '2023-10-10',
    isRecurring: true,
  },
  {
    id: 't4',
    title: 'Revisar Textos Site',
    description: 'Revisão médica dos textos.',
    clientId: 'c3',
    projectId: 'p3',
    status: TaskStatus.WAITING_CLIENT,
    type: TaskType.REVIEW,
    priority: Priority.HIGH,
    estimatedHours: 1,
    deadline: today,
    startTime: '14:00',
    createdAt: '2023-10-12',
    isRecurring: false,
  },
    {
    id: 't5',
    title: 'Configurar Automação ActiveCampaign',
    description: 'Tagging e funil de vendas.',
    clientId: 'c1',
    projectId: 'p1',
    status: TaskStatus.PLANNED,
    type: TaskType.AUTOMATION,
    priority: Priority.HIGH,
    estimatedHours: 3,
    deadline: tomorrow,
    startTime: '09:00',
    createdAt: '2023-10-12',
    isRecurring: false,
  }
];

export const KANBAN_COLUMNS = [
  TaskStatus.BACKLOG,
  TaskStatus.PLANNED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.WAITING_CLIENT,
  TaskStatus.APPROVAL,
  TaskStatus.COMPLETED,
  TaskStatus.PAUSED,
];
