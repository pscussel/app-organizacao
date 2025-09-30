import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface UserProfile {
  id: string
  email: string
  name: string
  avatar: string
  join_date: string
  total_tasks_completed: number
  days_used: number
  current_level: number
  total_xp: number
  current_streak: number
  longest_streak: number
  total_rewards: number
  record_days: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  completed: boolean
  category: 'home' | 'work' | 'personal' | 'health'
  priority: 'low' | 'medium' | 'high'
  estimated_time: number
  actual_time?: number
  created_at: string
  completed_at?: string
  xp_awarded: boolean
  week_day?: number
}

export interface Expense {
  id: string
  user_id: string
  title: string
  amount: number
  category: 'food' | 'transport' | 'entertainment' | 'bills' | 'shopping' | 'health'
  date: string
  month: string
  created_at: string
}

export interface Appointment {
  id: string
  user_id: string
  title: string
  description?: string
  date: string
  duration: number
  category: 'meeting' | 'personal' | 'health' | 'social'
  created_at: string
}

export interface UserReward {
  id: string
  user_id: string
  reward_id: string
  name: string
  description: string
  type: 'sticker' | 'cosmetic' | 'badge'
  unlock_level: number
  icon: string
  unlocked_at: string
}

export interface Trophy {
  id: string
  user_id: string
  trophy_id: string
  name: string
  description: string
  icon: string
  days_required: number
  unlocked: boolean
  unlocked_at?: string
}