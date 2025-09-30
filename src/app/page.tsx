'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, X, Calendar, DollarSign, Clock, Trophy, Settings, BarChart3, Target, Zap, Star, Trash2, Edit3, ChevronLeft, ChevronRight, Sun, Moon, Gift, User, Camera, Upload, LogOut } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'
import { 
  getUserProfile, 
  updateUserProfile, 
  getUserTasks, 
  createTask, 
  updateTask, 
  deleteTask,
  getUserExpenses,
  createExpense,
  getUserAppointments,
  createAppointment,
  getUserRewards,
  createUserReward,
  getUserTrophies,
  createUserTrophy,
  syncLocalDataToServer,
  createUserProfile
} from '@/lib/database'
import AuthComponent from '@/components/Auth'

// Tipos
interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  category: 'home' | 'work' | 'personal' | 'health'
  priority: 'low' | 'medium' | 'high'
  estimatedTime: number // em minutos
  actualTime?: number
  createdAt: Date
  completedAt?: Date
  xpAwarded?: boolean
  weekDay?: number // Dia da semana que foi criada (0-6)
}

interface Expense {
  id: string
  title: string
  amount: number
  category: 'food' | 'transport' | 'entertainment' | 'bills' | 'shopping' | 'health'
  date: Date
  month: string
}

interface Appointment {
  id: string
  title: string
  description?: string
  date: Date
  duration: number // em minutos
  category: 'meeting' | 'personal' | 'health' | 'social'
}

interface Theme {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  isDark: boolean
}

interface UserReward {
  id: string
  name: string
  description: string
  type: 'sticker' | 'cosmetic' | 'badge'
  unlockLevel: number
  icon: string
}

interface UserProfile {
  name: string
  avatar: string
  joinDate: Date
  totalTasksCompleted: number
  daysUsed: number
  currentLevel: number
  totalXP: number
  currentStreak: number
  longestStreak: number
  totalRewards: number
  recordDays: number // Novo campo para recorde de dias
}

interface Trophy {
  id: string
  name: string
  description: string
  icon: string
  daysRequired: number
  unlocked: boolean
}

// Temas disponíveis
const themes: Theme[] = [
  {
    id: 'day',
    name: 'Dia',
    primary: 'from-yellow-400 to-orange-500',
    secondary: 'from-yellow-100 to-orange-100',
    accent: 'text-orange-600',
    background: 'bg-white',
    isDark: false
  },
  {
    id: 'night',
    name: 'Noite',
    primary: 'from-gray-600 to-gray-800',
    secondary: 'from-gray-700 to-gray-900',
    accent: 'text-gray-300',
    background: 'bg-black',
    isDark: true
  },
  {
    id: 'sunset',
    name: 'Pôr do Sol',
    primary: 'from-orange-400 to-pink-600',
    secondary: 'from-orange-100 to-pink-100',
    accent: 'text-orange-600',
    background: 'bg-gradient-to-br from-orange-50 to-pink-50',
    isDark: false
  },
  {
    id: 'ocean',
    name: 'Oceano',
    primary: 'from-cyan-500 to-blue-600',
    secondary: 'from-cyan-100 to-blue-100',
    accent: 'text-cyan-600',
    background: 'bg-gradient-to-br from-cyan-50 to-blue-50',
    isDark: false
  },
  {
    id: 'forest',
    name: 'Floresta',
    primary: 'from-emerald-400 to-teal-600',
    secondary: 'from-emerald-100 to-teal-100',
    accent: 'text-emerald-600',
    background: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    isDark: false
  },
  {
    id: 'neon',
    name: 'Neon',
    primary: 'from-purple-500 to-pink-500',
    secondary: 'from-purple-100 to-pink-100',
    accent: 'text-purple-600',
    background: 'bg-gradient-to-br from-purple-50 to-pink-50',
    isDark: false
  }
]

// Troféus disponíveis
const availableTrophies: Trophy[] = [
  { id: 'week', name: '🏆 7 Dias Consecutivos', description: 'Uma semana de dedicação!', icon: '🏆', daysRequired: 7, unlocked: false },
  { id: 'month', name: '🥇 30 Dias Consecutivos', description: 'Um mês inteiro de consistência!', icon: '🥇', daysRequired: 30, unlocked: false },
  { id: 'quarter', name: '💎 90 Dias Consecutivos', description: 'Três meses de excelência!', icon: '💎', daysRequired: 90, unlocked: false },
  { id: 'halfyear', name: '👑 6 Meses Consecutivos', description: 'Meio ano de dedicação!', icon: '👑', daysRequired: 180, unlocked: false },
  { id: 'year', name: '🌟 1 Ano Consecutivo', description: 'Um ano completo de conquistas!', icon: '🌟', daysRequired: 365, unlocked: false }
]

// Recompensas disponíveis (agora chamadas de troféus)
const availableRewards: UserReward[] = [
  { id: 'star1', name: '⭐ Primeira Estrela', description: 'Sua primeira conquista!', type: 'badge', unlockLevel: 2, icon: '⭐' },
  { id: 'fire1', name: '🔥 Em Chamas', description: 'Você está pegando fogo!', type: 'sticker', unlockLevel: 3, icon: '🔥' },
  { id: 'trophy1', name: '🏆 Campeão', description: 'Um verdadeiro campeão!', type: 'badge', unlockLevel: 5, icon: '🏆' },
  { id: 'rocket1', name: '🚀 Foguete', description: 'Decolando para o sucesso!', type: 'sticker', unlockLevel: 7, icon: '🚀' },
  { id: 'crown1', name: '👑 Coroa Real', description: 'Você é a realeza da produtividade!', type: 'cosmetic', unlockLevel: 10, icon: '👑' },
  { id: 'diamond1', name: '💎 Diamante', description: 'Raro como um diamante!', type: 'badge', unlockLevel: 15, icon: '💎' },
  { id: 'unicorn1', name: '🦄 Unicórnio', description: 'Mágico e único!', type: 'cosmetic', unlockLevel: 20, icon: '🦄' }
]

// Avatares disponíveis
const availableAvatars = [
  { id: 'dino', name: 'Dinossauro', emoji: '🦕' },
  { id: 'dog', name: 'Cachorro', emoji: '🐕' },
  { id: 'cat', name: 'Gato', emoji: '🐱' },
  { id: 'giraffe', name: 'Girafa', emoji: '🦒' },
  { id: 'lion', name: 'Leão', emoji: '🦁' },
  { id: 'panda', name: 'Panda', emoji: '🐼' },
  { id: 'koala', name: 'Coala', emoji: '🐨' },
  { id: 'fox', name: 'Raposa', emoji: '🦊' },
  { id: 'wolf', name: 'Lobo', emoji: '🐺' },
  { id: 'bear', name: 'Urso', emoji: '🐻' },
  { id: 'rabbit', name: 'Coelho', emoji: '🐰' },
  { id: 'monkey', name: 'Macaco', emoji: '🐵' }
]

// Utilitários para calendário
const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
}

const getMonthName = (date: Date) => {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

// Utilitário para calcular dias desde instalação
const getDaysSinceInstall = () => {
  const installDate = localStorage.getItem('org-install-date')
  if (!installDate) {
    const now = new Date()
    localStorage.setItem('org-install-date', now.toISOString())
    return 1
  }
  
  const install = new Date(installDate)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - install.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Utilitário para obter dia da semana atual
const getCurrentWeekDay = () => {
  return new Date().getDay() // 0 = Domingo, 1 = Segunda, etc.
}

// Função para salvar dados locais no localStorage
const saveLocalData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data))
}

// Função para carregar dados locais do localStorage
const loadLocalData = (key: string, defaultValue: any = null) => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

// Função para sincronizar dados do servidor para local
const syncServerDataToLocal = async (userId: string) => {
  try {
    // Carregar dados do servidor
    const [profileResult, tasksResult, expensesResult, appointmentsResult, rewardsResult, trophiesResult] = await Promise.all([
      getUserProfile(userId),
      getUserTasks(userId),
      getUserExpenses(userId),
      getUserAppointments(userId),
      getUserRewards(userId),
      getUserTrophies(userId)
    ])

    const serverData = {
      profile: profileResult.data,
      tasks: tasksResult.data || [],
      expenses: expensesResult.data || [],
      appointments: appointmentsResult.data || [],
      rewards: rewardsResult.data || [],
      trophies: trophiesResult.data || []
    }

    // Carregar dados locais
    const localData = {
      profile: loadLocalData('org-user-profile'),
      tasks: loadLocalData('org-tasks', []),
      expenses: loadLocalData('org-expenses', []),
      appointments: loadLocalData('org-appointments', []),
      rewards: loadLocalData('org-rewards', []),
      trophies: loadLocalData('org-trophies', [])
    }

    // Fazer merge dos dados (priorizar dados do servidor, mas preservar dados locais únicos)
    const mergedData = {
      profile: serverData.profile || localData.profile,
      tasks: [...(serverData.tasks || []), ...localData.tasks.filter((localTask: any) => 
        !serverData.tasks?.some((serverTask: any) => serverTask.title === localTask.title && 
          new Date(serverTask.created_at).toDateString() === new Date(localTask.createdAt).toDateString())
      )],
      expenses: [...(serverData.expenses || []), ...localData.expenses.filter((localExpense: any) => 
        !serverData.expenses?.some((serverExpense: any) => serverExpense.title === localExpense.title && 
          serverExpense.amount === localExpense.amount && 
          new Date(serverExpense.date).toDateString() === new Date(localExpense.date).toDateString())
      )],
      appointments: [...(serverData.appointments || []), ...localData.appointments.filter((localAppt: any) => 
        !serverData.appointments?.some((serverAppt: any) => serverAppt.title === localAppt.title && 
          new Date(serverAppt.date).toDateString() === new Date(localAppt.date).toDateString())
      )],
      rewards: [...(serverData.rewards || []), ...localData.rewards.filter((localReward: any) => 
        !serverData.rewards?.some((serverReward: any) => serverReward.reward_id === localReward.id)
      )],
      trophies: [...(serverData.trophies || []), ...localData.trophies.filter((localTrophy: any) => 
        !serverData.trophies?.some((serverTrophy: any) => serverTrophy.trophy_id === localTrophy.id)
      )]
    }

    // Se há dados locais únicos, sincronizar com o servidor
    if (localData.tasks.length > 0 || localData.expenses.length > 0 || localData.appointments.length > 0) {
      await syncLocalDataToServer(userId, localData)
    }

    return mergedData
  } catch (error) {
    console.error('Erro ao sincronizar dados:', error)
    // Em caso de erro, retornar dados locais
    return {
      profile: loadLocalData('org-user-profile'),
      tasks: loadLocalData('org-tasks', []),
      expenses: loadLocalData('org-expenses', []),
      appointments: loadLocalData('org-appointments', []),
      rewards: loadLocalData('org-rewards', []),
      trophies: loadLocalData('org-trophies', [])
    }
  }
}

export default function GreeTaskApp() {
  // Estados de autenticação
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Estados
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]) // Tarefas concluídas separadas
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0])
  const [activeTab, setActiveTab] = useState('tasks')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [userLevel, setUserLevel] = useState(1)
  const [userXP, setUserXP] = useState(0)
  const [streak, setStreak] = useState(0)
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set())
  const [currentDay, setCurrentDay] = useState(1)
  const [unlockedRewards, setUnlockedRewards] = useState<UserReward[]>([])
  const [unlockedTrophies, setUnlockedTrophies] = useState<Trophy[]>([])
  const [showLevelUpDialog, setShowLevelUpDialog] = useState(false)
  const [newRewards, setNewRewards] = useState<UserReward[]>([])

  // Estados para perfil
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Usuário',
    avatar: 'dino',
    joinDate: new Date(),
    totalTasksCompleted: 0,
    daysUsed: 1,
    currentLevel: 1,
    totalXP: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalRewards: 0,
    recordDays: 0
  })
  const [showAvatarDialog, setShowAvatarDialog] = useState(false)
  const [showProfileEditDialog, setShowProfileEditDialog] = useState(false)
  const [editingName, setEditingName] = useState('')

  // Estados para calendário e gastos por mês
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState(new Date())

  // Formulários
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'personal' as Task['category'],
    priority: 'medium' as Task['priority'],
    estimatedTime: 30
  })

  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: 0,
    category: 'food' as Expense['category']
  })

  const [newAppointment, setNewAppointment] = useState({
    title: '',
    description: '',
    date: new Date(),
    duration: 60,
    category: 'personal' as Appointment['category']
  })

  // Verificar autenticação e carregar dados
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          await loadUserData(session.user.id)
        } else {
          // Carregar dados locais se não estiver logado
          loadLocalUserData()
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        loadLocalUserData()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        await loadUserData(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        loadLocalUserData()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Função para carregar dados do usuário logado
  const loadUserData = async (userId: string) => {
    try {
      // Sincronizar dados entre servidor e local
      const syncedData = await syncServerDataToLocal(userId)
      
      // Aplicar dados sincronizados
      if (syncedData.profile) {
        const profile = {
          name: syncedData.profile.name || 'Usuário',
          avatar: syncedData.profile.avatar || 'dino',
          joinDate: new Date(syncedData.profile.join_date || Date.now()),
          totalTasksCompleted: syncedData.profile.total_tasks_completed || 0,
          daysUsed: syncedData.profile.days_used || 1,
          currentLevel: syncedData.profile.current_level || 1,
          totalXP: syncedData.profile.total_xp || 0,
          currentStreak: syncedData.profile.current_streak || 0,
          longestStreak: syncedData.profile.longest_streak || 0,
          totalRewards: syncedData.profile.total_rewards || 0,
          recordDays: syncedData.profile.record_days || 0
        }
        setUserProfile(profile)
        setUserLevel(profile.currentLevel)
        setUserXP(profile.totalXP)
        setStreak(profile.currentStreak)
      }

      // Carregar tarefas
      if (syncedData.tasks) {
        const formattedTasks = syncedData.tasks.map((task: any) => ({
          id: task.id || Math.random().toString(36).substr(2, 9),
          title: task.title,
          description: task.description || '',
          completed: task.completed || false,
          category: task.category || 'personal',
          priority: task.priority || 'medium',
          estimatedTime: task.estimated_time || task.estimatedTime || 30,
          actualTime: task.actual_time || task.actualTime,
          createdAt: new Date(task.created_at || task.createdAt || Date.now()),
          completedAt: task.completed_at ? new Date(task.completed_at) : (task.completedAt ? new Date(task.completedAt) : undefined),
          xpAwarded: task.xp_awarded || task.xpAwarded || false,
          weekDay: task.week_day || task.weekDay
        }))
        
        const activeTasks = formattedTasks.filter((task: Task) => !task.completed)
        const completedTasksList = formattedTasks.filter((task: Task) => task.completed)
        
        setTasks(activeTasks)
        setCompletedTasks(completedTasksList)
      }

      // Carregar gastos
      if (syncedData.expenses) {
        const formattedExpenses = syncedData.expenses.map((expense: any) => ({
          id: expense.id || Math.random().toString(36).substr(2, 9),
          title: expense.title,
          amount: expense.amount,
          category: expense.category || 'food',
          date: new Date(expense.date),
          month: expense.month || new Date(expense.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        }))
        setExpenses(formattedExpenses)
      }

      // Carregar compromissos
      if (syncedData.appointments) {
        const formattedAppointments = syncedData.appointments.map((appointment: any) => ({
          id: appointment.id || Math.random().toString(36).substr(2, 9),
          title: appointment.title,
          description: appointment.description || '',
          date: new Date(appointment.date),
          duration: appointment.duration || 60,
          category: appointment.category || 'personal'
        }))
        setAppointments(formattedAppointments)
      }

      // Carregar recompensas
      if (syncedData.rewards) {
        const formattedRewards = syncedData.rewards.map((reward: any) => ({
          id: reward.reward_id || reward.id,
          name: reward.name,
          description: reward.description,
          type: reward.type,
          unlockLevel: reward.unlock_level || reward.unlockLevel,
          icon: reward.icon
        }))
        setUnlockedRewards(formattedRewards)
      }

      // Carregar troféus
      if (syncedData.trophies) {
        const formattedTrophies = syncedData.trophies.map((trophy: any) => ({
          id: trophy.trophy_id || trophy.id,
          name: trophy.name,
          description: trophy.description,
          icon: trophy.icon,
          daysRequired: trophy.days_required || trophy.daysRequired,
          unlocked: trophy.unlocked
        }))
        setUnlockedTrophies(formattedTrophies)
      }

    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
      // Em caso de erro, carregar dados locais
      loadLocalUserData()
    }
  }

  // Função para carregar dados locais (quando não logado)
  const loadLocalUserData = () => {
    const savedProfile = loadLocalData('org-user-profile')
    const savedTasks = loadLocalData('org-tasks', [])
    const savedExpenses = loadLocalData('org-expenses', [])
    const savedAppointments = loadLocalData('org-appointments', [])
    const savedRewards = loadLocalData('org-rewards', [])
    const savedTrophies = loadLocalData('org-trophies', [])
    const savedTheme = loadLocalData('org-theme')

    if (savedProfile) {
      setUserProfile(savedProfile)
      setUserLevel(savedProfile.currentLevel)
      setUserXP(savedProfile.totalXP)
      setStreak(savedProfile.currentStreak)
    }

    if (savedTasks.length > 0) {
      const activeTasks = savedTasks.filter((task: Task) => !task.completed)
      const completedTasksList = savedTasks.filter((task: Task) => task.completed)
      setTasks(activeTasks)
      setCompletedTasks(completedTasksList)
    }

    if (savedExpenses.length > 0) {
      setExpenses(savedExpenses)
    }

    if (savedAppointments.length > 0) {
      setAppointments(savedAppointments)
    }

    if (savedRewards.length > 0) {
      setUnlockedRewards(savedRewards)
    }

    if (savedTrophies.length > 0) {
      setUnlockedTrophies(savedTrophies)
    }

    if (savedTheme) {
      const theme = themes.find(t => t.id === savedTheme.id) || themes[0]
      setCurrentTheme(theme)
    }

    setCurrentDay(getDaysSinceInstall())
  }

  // Função para lidar com sucesso de autenticação
  const handleAuthSuccess = async (authUser: any) => {
    setUser(authUser)
    
    // Verificar se o perfil já existe
    const { data: existingProfile } = await getUserProfile(authUser.id)
    
    if (!existingProfile) {
      // Criar perfil se não existir
      await createUserProfile(
        authUser.id,
        authUser.email,
        authUser.user_metadata?.name || 'Usuário'
      )
    }
    
    // Carregar dados do usuário
    await loadUserData(authUser.id)
  }

  // Função para logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      loadLocalUserData()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Salvar dados automaticamente quando houver mudanças
  useEffect(() => {
    if (!isLoading) {
      saveLocalData('org-user-profile', userProfile)
      saveLocalData('org-tasks', [...tasks, ...completedTasks])
      saveLocalData('org-expenses', expenses)
      saveLocalData('org-appointments', appointments)
      saveLocalData('org-rewards', unlockedRewards)
      saveLocalData('org-trophies', unlockedTrophies)
      saveLocalData('org-theme', currentTheme)
    }
  }, [userProfile, tasks, completedTasks, expenses, appointments, unlockedRewards, unlockedTrophies, currentTheme, isLoading])

  // Função para verificar troféus de dias consecutivos
  const checkConsecutiveDaysTrophies = () => {
    const newTrophies: Trophy[] = []
    
    availableTrophies.forEach(trophy => {
      const isAlreadyUnlocked = unlockedTrophies.some(t => t.id === trophy.id)
      if (!isAlreadyUnlocked && streak >= trophy.daysRequired) {
        newTrophies.push({ ...trophy, unlocked: true })
      }
    })
    
    if (newTrophies.length > 0) {
      setUnlockedTrophies(prev => [...prev, ...newTrophies])
      
      // Salvar troféus no servidor se logado
      if (user) {
        newTrophies.forEach(async (trophy) => {
          await createUserTrophy(user.id, {
            trophy_id: trophy.id,
            name: trophy.name,
            description: trophy.description,
            icon: trophy.icon,
            days_required: trophy.daysRequired,
            unlocked: trophy.unlocked
          })
        })
      }
    }
  }

  // Verificar troféus quando streak mudar
  useEffect(() => {
    if (streak > 0) {
      checkConsecutiveDaysTrophies()
    }
  }, [streak])

  // Função para adicionar tarefa
  const addTask = async () => {
    if (!newTask.title.trim()) return

    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTask.title,
      description: newTask.description,
      completed: false,
      category: newTask.category,
      priority: newTask.priority,
      estimatedTime: newTask.estimatedTime,
      createdAt: new Date(),
      weekDay: getCurrentWeekDay()
    }

    setTasks(prev => [task, ...prev])

    // Salvar no servidor se logado
    if (user) {
      try {
        await createTask(user.id, {
          title: task.title,
          description: task.description,
          completed: task.completed,
          category: task.category,
          priority: task.priority,
          estimated_time: task.estimatedTime,
          actual_time: task.actualTime,
          completed_at: task.completedAt?.toISOString(),
          xp_awarded: task.xpAwarded || false,
          week_day: task.weekDay
        })
      } catch (error) {
        console.error('Erro ao salvar tarefa no servidor:', error)
      }
    }

    setNewTask({
      title: '',
      description: '',
      category: 'personal',
      priority: 'medium',
      estimatedTime: 30
    })
    setShowAddDialog(false)
  }

  // Função para completar tarefa
  const completeTask = async (taskId: string) => {
    setCompletingTasks(prev => new Set(prev).add(taskId))
    
    setTimeout(async () => {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const completedTask = {
        ...task,
        completed: true,
        completedAt: new Date(),
        xpAwarded: true
      }

      setTasks(prev => prev.filter(t => t.id !== taskId))
      setCompletedTasks(prev => [completedTask, ...prev])

      // Atualizar XP e nível
      const xpGain = task.priority === 'high' ? 15 : task.priority === 'medium' ? 10 : 5
      const newXP = userXP + xpGain
      const newLevel = Math.floor(newXP / 100) + 1
      
      setUserXP(newXP)
      
      if (newLevel > userLevel) {
        setUserLevel(newLevel)
        setShowLevelUpDialog(true)
        
        // Verificar novas recompensas desbloqueadas
        const newUnlockedRewards = availableRewards.filter(reward => 
          reward.unlockLevel <= newLevel && !unlockedRewards.some(ur => ur.id === reward.id)
        )
        
        if (newUnlockedRewards.length > 0) {
          setNewRewards(newUnlockedRewards)
          setUnlockedRewards(prev => [...prev, ...newUnlockedRewards])
          
          // Salvar recompensas no servidor se logado
          if (user) {
            newUnlockedRewards.forEach(async (reward) => {
              await createUserReward(user.id, {
                reward_id: reward.id,
                name: reward.name,
                description: reward.description,
                type: reward.type,
                unlock_level: reward.unlockLevel,
                icon: reward.icon
              })
            })
          }
        }
      }

      // Atualizar perfil
      const updatedProfile = {
        ...userProfile,
        totalTasksCompleted: userProfile.totalTasksCompleted + 1,
        currentLevel: newLevel,
        totalXP: newXP,
        totalRewards: unlockedRewards.length + (newRewards.length || 0)
      }
      
      setUserProfile(updatedProfile)

      // Salvar no servidor se logado
      if (user) {
        try {
          await updateTask(taskId, {
            completed: true,
            completed_at: completedTask.completedAt?.toISOString(),
            xp_awarded: true
          })
          
          await updateUserProfile(user.id, {
            total_tasks_completed: updatedProfile.totalTasksCompleted,
            current_level: updatedProfile.currentLevel,
            total_xp: updatedProfile.totalXP,
            total_rewards: updatedProfile.totalRewards
          })
        } catch (error) {
          console.error('Erro ao atualizar no servidor:', error)
        }
      }

      setCompletingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }, 1000)
  }

  // Função para adicionar gasto
  const addExpense = async () => {
    if (!newExpense.title.trim() || newExpense.amount <= 0) return

    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      title: newExpense.title,
      amount: newExpense.amount,
      category: newExpense.category,
      date: new Date(),
      month: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    }

    setExpenses(prev => [expense, ...prev])

    // Salvar no servidor se logado
    if (user) {
      try {
        await createExpense(user.id, {
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          date: expense.date.toISOString(),
          month: expense.month
        })
      } catch (error) {
        console.error('Erro ao salvar gasto no servidor:', error)
      }
    }

    setNewExpense({
      title: '',
      amount: 0,
      category: 'food'
    })
    setShowAddDialog(false)
  }

  // Função para adicionar compromisso
  const addAppointment = async () => {
    if (!newAppointment.title.trim()) return

    const appointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      title: newAppointment.title,
      description: newAppointment.description,
      date: newAppointment.date,
      duration: newAppointment.duration,
      category: newAppointment.category
    }

    setAppointments(prev => [appointment, ...prev])

    // Salvar no servidor se logado
    if (user) {
      try {
        await createAppointment(user.id, {
          title: appointment.title,
          description: appointment.description,
          date: appointment.date.toISOString(),
          duration: appointment.duration,
          category: appointment.category
        })
      } catch (error) {
        console.error('Erro ao salvar compromisso no servidor:', error)
      }
    }

    setNewAppointment({
      title: '',
      description: '',
      date: new Date(),
      duration: 60,
      category: 'personal'
    })
    setShowAddDialog(false)
  }

  // Função para deletar tarefa
  const deleteTaskById = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setCompletedTasks(prev => prev.filter(t => t.id !== taskId))

    // Deletar no servidor se logado
    if (user) {
      try {
        await deleteTask(taskId)
      } catch (error) {
        console.error('Erro ao deletar tarefa no servidor:', error)
      }
    }
  }

  // Função para alterar avatar
  const changeAvatar = async (avatarId: string) => {
    const updatedProfile = { ...userProfile, avatar: avatarId }
    setUserProfile(updatedProfile)
    setShowAvatarDialog(false)

    // Salvar no servidor se logado
    if (user) {
      try {
        await updateUserProfile(user.id, { avatar: avatarId })
      } catch (error) {
        console.error('Erro ao atualizar avatar no servidor:', error)
      }
    }
  }

  // Função para editar nome
  const saveProfileName = async () => {
    if (!editingName.trim()) return

    const updatedProfile = { ...userProfile, name: editingName }
    setUserProfile(updatedProfile)
    setShowProfileEditDialog(false)

    // Salvar no servidor se logado
    if (user) {
      try {
        await updateUserProfile(user.id, { name: editingName })
      } catch (error) {
        console.error('Erro ao atualizar nome no servidor:', error)
      }
    }
  }

  // Calcular estatísticas
  const totalTasks = tasks.length + completedTasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const currentMonthExpenses = expenses.filter(expense => 
    expense.month === new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  ).reduce((sum, expense) => sum + expense.amount, 0)

  // Dados para gráficos
  const tasksByCategory = [
    { name: 'Casa', value: tasks.filter(t => t.category === 'home').length + completedTasks.filter(t => t.category === 'home').length },
    { name: 'Trabalho', value: tasks.filter(t => t.category === 'work').length + completedTasks.filter(t => t.category === 'work').length },
    { name: 'Pessoal', value: tasks.filter(t => t.category === 'personal').length + completedTasks.filter(t => t.category === 'personal').length },
    { name: 'Saúde', value: tasks.filter(t => t.category === 'health').length + completedTasks.filter(t => t.category === 'health').length }
  ].filter(item => item.value > 0)

  const expensesByCategory = [
    { name: 'Comida', value: expenses.filter(e => e.category === 'food').reduce((sum, e) => sum + e.amount, 0) },
    { name: 'Transporte', value: expenses.filter(e => e.category === 'transport').reduce((sum, e) => sum + e.amount, 0) },
    { name: 'Entretenimento', value: expenses.filter(e => e.category === 'entertainment').reduce((sum, e) => sum + e.amount, 0) },
    { name: 'Contas', value: expenses.filter(e => e.category === 'bills').reduce((sum, e) => sum + e.amount, 0) },
    { name: 'Compras', value: expenses.filter(e => e.category === 'shopping').reduce((sum, e) => sum + e.amount, 0) },
    { name: 'Saúde', value: expenses.filter(e => e.category === 'health').reduce((sum, e) => sum + e.amount, 0) }
  ].filter(item => item.value > 0)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  // Se ainda está carregando
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse">
            <img 
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/127f6328-03b6-4eef-8939-6aeedbe1a70c.png" 
              alt="GreeTask" 
              className="w-10 h-10"
            />
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não está logado, mostrar tela de autenticação
  if (!user) {
    return <AuthComponent onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className={`min-h-screen ${currentTheme.background} transition-all duration-300`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${currentTheme.primary} rounded-xl flex items-center justify-center`}>
                <img 
                  src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/127f6328-03b6-4eef-8939-6aeedbe1a70c.png" 
                  alt="GreeTask" 
                  className="w-6 h-6"
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900">GreeTask</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Informações do usuário - Desktop */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                  <p className="text-xs text-gray-500">Nível {userLevel} • {currentDay} dias</p>
                </div>
              </div>
              
              {/* Avatar clicável */}
              <Dialog open={showProfileEditDialog} onOpenChange={setShowProfileEditDialog}>
                <DialogTrigger asChild>
                  <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 flex items-center justify-center text-white text-lg">
                      {availableAvatars.find(a => a.id === userProfile.avatar)?.emoji || '🦕'}
                    </div>
                    {/* Mostrar apenas dias no mobile */}
                    <div className="sm:hidden">
                      <p className="text-xs text-gray-500">{currentDay} dias</p>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Perfil do Usuário</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Avatar */}
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 flex items-center justify-center text-white text-3xl mb-4">
                        {availableAvatars.find(a => a.id === userProfile.avatar)?.emoji || '🦕'}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAvatarDialog(true)}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Alterar Avatar
                      </Button>
                    </div>

                    {/* Informações */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Nome:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{userProfile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingName(userProfile.name)
                              setShowProfileEditDialog(false)
                              setTimeout(() => setShowProfileEditDialog(true), 100)
                            }}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="font-medium">{user.email}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Nível:</span>
                        <span className="font-medium">{userLevel}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">XP Total:</span>
                        <span className="font-medium">{userXP}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Tarefas Concluídas:</span>
                        <span className="font-medium">{userProfile.totalTasksCompleted}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Dias de Uso:</span>
                        <span className="font-medium">{currentDay}</span>
                      </div>
                    </div>

                    {/* Botão de Logout */}
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair da Conta
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tarefas Concluídas</p>
                  <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
                  <p className="text-xs text-gray-500">{completionRate}% de conclusão</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${currentTheme.primary} rounded-xl flex items-center justify-center`}>
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recorde de Dias</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.max(userProfile.recordDays, currentDay)}</p>
                  <p className="text-xs text-gray-500">Dias consecutivos</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${currentTheme.primary} rounded-xl flex items-center justify-center`}>
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Seus Troféus</p>
                  <p className="text-2xl font-bold text-gray-900">{unlockedRewards.length + unlockedTrophies.length}</p>
                  <p className="text-xs text-gray-500">Conquistas desbloqueadas</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${currentTheme.primary} rounded-xl flex items-center justify-center`}>
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navegação por Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="tasks" className="flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Tarefas</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Gastos</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab de Tarefas */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Suas Tarefas</h2>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className={`bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Título</label>
                      <Input
                        placeholder="Digite o título da tarefa"
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Descrição</label>
                      <Textarea
                        placeholder="Descrição opcional"
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Categoria</label>
                        <Select value={newTask.category} onValueChange={(value: Task['category']) => setNewTask({...newTask, category: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Pessoal</SelectItem>
                            <SelectItem value="work">Trabalho</SelectItem>
                            <SelectItem value="home">Casa</SelectItem>
                            <SelectItem value="health">Saúde</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Prioridade</label>
                        <Select value={newTask.priority} onValueChange={(value: Task['priority']) => setNewTask({...newTask, priority: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tempo Estimado (minutos)</label>
                      <Input
                        type="number"
                        value={newTask.estimatedTime}
                        onChange={(e) => setNewTask({...newTask, estimatedTime: parseInt(e.target.value) || 30})}
                      />
                    </div>
                    <Button onClick={addTask} className={`w-full bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90`}>
                      Adicionar Tarefa
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Lista de Tarefas Ativas */}
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <Card className="bg-white shadow-lg border-0">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma tarefa pendente</h3>
                    <p className="text-gray-500 mb-4">Adicione uma nova tarefa para começar a organizar seu dia!</p>
                    <Button 
                      onClick={() => setShowAddDialog(true)}
                      className={`bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeira Tarefa
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                tasks.map((task) => (
                  <Card key={task.id} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{task.title}</h3>
                            <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                              {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                            <Badge variant="outline">
                              {task.category === 'personal' ? 'Pessoal' : task.category === 'work' ? 'Trabalho' : task.category === 'home' ? 'Casa' : 'Saúde'}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-gray-600 mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{task.estimatedTime} min</span>
                            </div>
                            <span>Criada em {task.createdAt.toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTaskById(task.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => completeTask(task.id)}
                            disabled={completingTasks.has(task.id)}
                            className={`bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90 ${
                              completingTasks.has(task.id) ? 'animate-pulse' : ''
                            }`}
                          >
                            {completingTasks.has(task.id) ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Tarefas Concluídas */}
            {completedTasks.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarefas Concluídas</h3>
                <div className="space-y-3">
                  {completedTasks.slice(0, 5).map((task) => (
                    <Card key={task.id} className="bg-gray-50 border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 line-through">{task.title}</h4>
                              <p className="text-sm text-gray-500">
                                Concluída em {task.completedAt?.toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              +{task.priority === 'high' ? 15 : task.priority === 'medium' ? 10 : 5} XP
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTaskById(task.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {completedTasks.length > 5 && (
                    <p className="text-center text-gray-500 text-sm">
                      E mais {completedTasks.length - 5} tarefas concluídas...
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab de Gastos */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Controle de Gastos</h2>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className={`bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Gasto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Gasto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Descrição</label>
                      <Input
                        placeholder="Ex: Almoço, Combustível, etc."
                        value={newExpense.title}
                        onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Valor (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={newExpense.amount || ''}
                        onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Categoria</label>
                      <Select value={newExpense.category} onValueChange={(value: Expense['category']) => setNewExpense({...newExpense, category: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Alimentação</SelectItem>
                          <SelectItem value="transport">Transporte</SelectItem>
                          <SelectItem value="entertainment">Entretenimento</SelectItem>
                          <SelectItem value="bills">Contas</SelectItem>
                          <SelectItem value="shopping">Compras</SelectItem>
                          <SelectItem value="health">Saúde</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addExpense} className={`w-full bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90`}>
                      Adicionar Gasto
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Resumo de Gastos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Total Geral</h3>
                    <DollarSign className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-500">Todos os gastos registrados</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Este Mês</h3>
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    R$ {currentMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Gastos */}
            <div className="space-y-4">
              {expenses.length === 0 ? (
                <Card className="bg-white shadow-lg border-0">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum gasto registrado</h3>
                    <p className="text-gray-500 mb-4">Comece a controlar suas finanças adicionando seus gastos!</p>
                    <Button 
                      onClick={() => setShowAddDialog(true)}
                      className={`bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeiro Gasto
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                expenses.slice(0, 10).map((expense) => (
                  <Card key={expense.id} className="bg-white shadow-lg border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${currentTheme.primary} rounded-lg flex items-center justify-center`}>
                            <DollarSign className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{expense.title}</h4>
                            <p className="text-sm text-gray-500">
                              {expense.category === 'food' ? 'Alimentação' : 
                               expense.category === 'transport' ? 'Transporte' :
                               expense.category === 'entertainment' ? 'Entretenimento' :
                               expense.category === 'bills' ? 'Contas' :
                               expense.category === 'shopping' ? 'Compras' : 'Saúde'} • {expense.date.toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab de Agenda */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className={`bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Compromisso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Compromisso</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Título</label>
                      <Input
                        placeholder="Ex: Reunião, Consulta médica, etc."
                        value={newAppointment.title}
                        onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Descrição</label>
                      <Textarea
                        placeholder="Detalhes do compromisso"
                        value={newAppointment.description}
                        onChange={(e) => setNewAppointment({...newAppointment, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Data</label>
                        <Input
                          type="datetime-local"
                          value={newAppointment.date.toISOString().slice(0, 16)}
                          onChange={(e) => setNewAppointment({...newAppointment, date: new Date(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Duração (min)</label>
                        <Input
                          type="number"
                          value={newAppointment.duration}
                          onChange={(e) => setNewAppointment({...newAppointment, duration: parseInt(e.target.value) || 60})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Categoria</label>
                      <Select value={newAppointment.category} onValueChange={(value: Appointment['category']) => setNewAppointment({...newAppointment, category: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Reunião</SelectItem>
                          <SelectItem value="personal">Pessoal</SelectItem>
                          <SelectItem value="health">Saúde</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addAppointment} className={`w-full bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90`}>
                      Adicionar Compromisso
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Calendário */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {getMonthName(calendarDate)}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getFirstDayOfMonth(calendarDate) }, (_, i) => (
                    <div key={`empty-${i}`} className="p-2 h-10"></div>
                  ))}
                  {Array.from({ length: getDaysInMonth(calendarDate) }, (_, i) => {
                    const day = i + 1
                    const currentDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)
                    const hasAppointments = appointments.some(apt => 
                      apt.date.toDateString() === currentDate.toDateString()
                    )
                    const isToday = currentDate.toDateString() === new Date().toDateString()
                    
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(currentDate)}
                        className={`p-2 h-10 text-sm rounded-lg transition-colors ${
                          isToday 
                            ? `bg-gradient-to-r ${currentTheme.primary} text-white` 
                            : hasAppointments
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {day}
                        {hasAppointments && (
                          <div className="w-1 h-1 bg-blue-500 rounded-full mx-auto mt-1"></div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Compromissos do Dia */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>
                  Compromissos de {selectedDate.toLocaleDateString('pt-BR')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.filter(apt => apt.date.toDateString() === selectedDate.toDateString()).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhum compromisso para este dia</p>
                ) : (
                  <div className="space-y-3">
                    {appointments
                      .filter(apt => apt.date.toDateString() === selectedDate.toDateString())
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .map((appointment) => (
                        <div key={appointment.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-3 h-3 bg-gradient-to-r ${currentTheme.primary} rounded-full`}></div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{appointment.title}</h4>
                            <p className="text-sm text-gray-500">
                              {appointment.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {appointment.duration} min
                            </p>
                            {appointment.description && (
                              <p className="text-sm text-gray-600 mt-1">{appointment.description}</p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {appointment.category === 'meeting' ? 'Reunião' : 
                             appointment.category === 'personal' ? 'Pessoal' :
                             appointment.category === 'health' ? 'Saúde' : 'Social'}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Relatórios */}
          <TabsContent value="reports" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Relatórios e Troféus</h2>
            
            {/* Seção de Troféus */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Troféus por Nível */}
              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Troféus por Nível</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availableRewards.map((reward) => {
                      const isUnlocked = unlockedRewards.some(ur => ur.id === reward.id)
                      return (
                        <div key={reward.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
                          isUnlocked ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}>
                          <div className={`text-2xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                            {reward.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-medium ${isUnlocked ? 'text-green-900' : 'text-gray-500'}`}>
                              {reward.name}
                            </h4>
                            <p className={`text-sm ${isUnlocked ? 'text-green-700' : 'text-gray-400'}`}>
                              {reward.description}
                            </p>
                          </div>
                          <div className="text-right">
                            {isUnlocked ? (
                              <Badge className="bg-green-100 text-green-800">Desbloqueado</Badge>
                            ) : (
                              <Badge variant="outline">Nível {reward.unlockLevel}</Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Troféus por Dias Consecutivos */}
              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Troféus por Dias Consecutivos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availableTrophies.map((trophy) => {
                      const isUnlocked = unlockedTrophies.some(ut => ut.id === trophy.id)
                      const progress = Math.min((streak / trophy.daysRequired) * 100, 100)
                      
                      return (
                        <div key={trophy.id} className={`p-3 rounded-lg ${
                          isUnlocked ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`text-2xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                              {trophy.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-medium ${isUnlocked ? 'text-yellow-900' : 'text-gray-700'}`}>
                                {trophy.name}
                              </h4>
                              <p className={`text-sm ${isUnlocked ? 'text-yellow-700' : 'text-gray-500'}`}>
                                {trophy.description}
                              </p>
                            </div>
                            {isUnlocked && (
                              <Badge className="bg-yellow-100 text-yellow-800">Conquistado!</Badge>
                            )}
                          </div>
                          {!isUnlocked && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">{streak} / {trophy.daysRequired} dias</span>
                                <span className="text-gray-600">{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Tarefas por Categoria */}
              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Tarefas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {tasksByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={tasksByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {tasksByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-300 flex items-center justify-center text-gray-500">
                      Nenhuma tarefa para exibir
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de Gastos por Categoria */}
              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Gastos por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {expensesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={expensesByCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-300 flex items-center justify-center text-gray-500">
                      Nenhum gasto para exibir
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas Gerais */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Estatísticas Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-r ${currentTheme.primary} rounded-xl flex items-center justify-center`}>
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
                    <p className="text-sm text-gray-500">Tarefas Concluídas</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-r ${currentTheme.primary} rounded-xl flex items-center justify-center`}>
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{userLevel}</p>
                    <p className="text-sm text-gray-500">Nível Atual</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-r ${currentTheme.primary} rounded-xl flex items-center justify-center`}>
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{userXP}</p>
                    <p className="text-sm text-gray-500">XP Total</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-r ${currentTheme.primary} rounded-xl flex items-center justify-center`}>
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{unlockedRewards.length + unlockedTrophies.length}</p>
                    <p className="text-sm text-gray-500">Troféus Desbloqueados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {/* Dialog de Level Up */}
      <Dialog open={showLevelUpDialog} onOpenChange={setShowLevelUpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">🎉 Parabéns!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className={`w-20 h-20 mx-auto bg-gradient-to-r ${currentTheme.primary} rounded-full flex items-center justify-center`}>
              <Zap className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Você subiu para o nível {userLevel}!</h3>
              <p className="text-gray-600">Continue assim e desbloqueie mais troféus!</p>
            </div>
            {newRewards.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-gray-900">Novos troféus desbloqueados:</p>
                <div className="flex justify-center space-x-2">
                  {newRewards.map((reward) => (
                    <div key={reward.id} className="text-2xl">{reward.icon}</div>
                  ))}
                </div>
              </div>
            )}
            <Button 
              onClick={() => setShowLevelUpDialog(false)}
              className={`w-full bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90`}
            >
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Seleção de Avatar */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escolher Avatar</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4">
            {availableAvatars.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => changeAvatar(avatar.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  userProfile.avatar === avatar.id 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">{avatar.emoji}</div>
                <p className="text-xs text-gray-600">{avatar.name}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Slime no canto inferior direito */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
          <img 
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/127f6328-03b6-4eef-8939-6aeedbe1a70c.png" 
            alt="GreeTask Mascot" 
            className="w-10 h-10"
          />
        </div>
      </div>
    </div>
  )
}