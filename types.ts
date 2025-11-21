
// Enums
export enum ClientCategory {
  DRUMS = 'Bateria',
  ARCHITECTURE = 'Arquitetura',
  HEALTH = 'Saúde',
  REAL_ESTATE = 'Imobiliária',
  OTHER = 'Outros',
}

export enum Priority {
  URGENT = 'Urgente',
  HIGH = 'Alta',
  MEDIUM = 'Média',
  LOW = 'Baixa',
}

export enum ProjectStatus {
  PLANNING = 'Em planejamento',
  EXECUTION = 'Em execução',
  PAUSED = 'Pausado',
  COMPLETED = 'Concluído',
  CONTINUOUS = 'Contínuo',
}

export enum ProjectType {
  LAUNCH = 'Lançamento',
  CONTINUOUS = 'Contínuo',
  INTERNAL = 'Interno',
  ADJUSTMENT = 'Ajuste pontual',
}

export enum TaskStatus {
  BACKLOG = 'Backlog',
  PLANNED = 'Planejado',
  IN_PROGRESS = 'Em execução',
  WAITING_CLIENT = 'Aguardando retorno',
  APPROVAL = 'Em aprovação',
  COMPLETED = 'Concluído',
  PAUSED = 'Pausado',
}

export enum TaskType {
  COPY = 'Copy',
  DESIGN = 'Design',
  LANDING = 'Landing',
  AUTOMATION = 'Automação',
  MEETING = 'Reunião',
  REVIEW = 'Revisão',
  STRATEGY = 'Estratégia',
}

export enum ActivityType {
  EXECUTION = 'Execução',
  MEETING = 'Reunião',
  REVIEW = 'Revisão',
  STRATEGY = 'Estratégia',
  ADMIN = 'Administrativo',
}

export enum AgendaViewMode {
  WEEK = 'Semana',
  FORTNIGHT = 'Quinzena',
  MONTH = 'Mês',
}

// Interfaces
export interface Client {
  id: string;
  name: string;
  brand: string;
  category: ClientCategory;
  color: string;
  weeklyHours: number;
  minDailyHours: number;
  priority: Priority;
  observations: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  status: ProjectStatus;
  type: ProjectType;
  startDate: string; // ISO Date
  estimatedDeadline: string; // ISO Date
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  clientId: string;
  projectId: string;
  status: TaskStatus;
  type: TaskType;
  priority: Priority;
  estimatedHours: number;
  deadline: string; // ISO Date YYYY-MM-DD
  startTime?: string; // HH:mm (Optional, used for Agenda)
  createdAt: string; // ISO Date
  completedAt?: string; // ISO Date
  referenceLink?: string;
  isRecurring: boolean;
}

export interface VisualConfig {
  themeMode: 'light' | 'dark';
  primaryColor: string;
  density: 'compact' | 'comfortable';
  sidebarColor: string;
}

export interface AppConfig {
  totalHoursPerDay: number;
  workWindowStart: string; // 09:00
  workWindowEnd: string; // 18:00
  notes: string;
  unavailableDays: string[];
  visual: VisualConfig;
}
