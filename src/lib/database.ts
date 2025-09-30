import { supabase } from '@/lib/supabase'
import type { UserProfile, Task, Expense, Appointment, UserReward, Trophy } from '@/lib/supabase'

// Funções para gerenciar perfil do usuário
export const createUserProfile = async (userId: string, email: string, name: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([
      {
        id: userId,
        email,
        name,
        avatar: 'dino',
        join_date: new Date().toISOString(),
        total_tasks_completed: 0,
        days_used: 1,
        current_level: 1,
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        total_rewards: 0,
        record_days: 1
      }
    ])
    .select()
    .single()

  return { data, error }
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

// Funções para gerenciar tarefas
export const getUserTasks = async (userId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const createTask = async (userId: string, task: Omit<Task, 'id' | 'user_id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        ...task,
        user_id: userId,
        created_at: new Date().toISOString()
      }
    ])
    .select()
    .single()

  return { data, error }
}

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  return { data, error }
}

export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  return { error }
}

// Funções para gerenciar gastos
export const getUserExpenses = async (userId: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  return { data, error }
}

export const createExpense = async (userId: string, expense: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([
      {
        ...expense,
        user_id: userId,
        created_at: new Date().toISOString()
      }
    ])
    .select()
    .single()

  return { data, error }
}

// Funções para gerenciar compromissos
export const getUserAppointments = async (userId: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  return { data, error }
}

export const createAppointment = async (userId: string, appointment: Omit<Appointment, 'id' | 'user_id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([
      {
        ...appointment,
        user_id: userId,
        created_at: new Date().toISOString()
      }
    ])
    .select()
    .single()

  return { data, error }
}

// Funções para gerenciar recompensas
export const getUserRewards = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_rewards')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })

  return { data, error }
}

export const createUserReward = async (userId: string, reward: Omit<UserReward, 'id' | 'user_id' | 'unlocked_at'>) => {
  const { data, error } = await supabase
    .from('user_rewards')
    .insert([
      {
        ...reward,
        user_id: userId,
        unlocked_at: new Date().toISOString()
      }
    ])
    .select()
    .single()

  return { data, error }
}

// Funções para gerenciar troféus
export const getUserTrophies = async (userId: string) => {
  const { data, error } = await supabase
    .from('trophies')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })

  return { data, error }
}

export const createUserTrophy = async (userId: string, trophy: Omit<Trophy, 'id' | 'user_id' | 'unlocked_at'>) => {
  const { data, error } = await supabase
    .from('trophies')
    .insert([
      {
        ...trophy,
        user_id: userId,
        unlocked_at: new Date().toISOString()
      }
    ])
    .select()
    .single()

  return { data, error }
}

// Função para sincronizar dados locais com o servidor
export const syncLocalDataToServer = async (userId: string, localData: any) => {
  try {
    // Sincronizar tarefas
    if (localData.tasks && localData.tasks.length > 0) {
      for (const task of localData.tasks) {
        // Verificar se a tarefa já existe no servidor
        const { data: existingTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('user_id', userId)
          .eq('title', task.title)
          .eq('created_at', task.createdAt || new Date(task.createdAt).toISOString())

        if (!existingTasks || existingTasks.length === 0) {
          await createTask(userId, {
            title: task.title,
            description: task.description,
            completed: task.completed,
            category: task.category,
            priority: task.priority,
            estimated_time: task.estimatedTime,
            actual_time: task.actualTime,
            completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : undefined,
            xp_awarded: task.xpAwarded || false,
            week_day: task.weekDay
          })
        }
      }
    }

    // Sincronizar gastos
    if (localData.expenses && localData.expenses.length > 0) {
      for (const expense of localData.expenses) {
        // Verificar se o gasto já existe no servidor
        const { data: existingExpenses } = await supabase
          .from('expenses')
          .select('id')
          .eq('user_id', userId)
          .eq('title', expense.title)
          .eq('amount', expense.amount)
          .eq('date', new Date(expense.date).toISOString())

        if (!existingExpenses || existingExpenses.length === 0) {
          await createExpense(userId, {
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            date: new Date(expense.date).toISOString(),
            month: expense.month
          })
        }
      }
    }

    // Sincronizar compromissos
    if (localData.appointments && localData.appointments.length > 0) {
      for (const appointment of localData.appointments) {
        // Verificar se o compromisso já existe no servidor
        const { data: existingAppointments } = await supabase
          .from('appointments')
          .select('id')
          .eq('user_id', userId)
          .eq('title', appointment.title)
          .eq('date', new Date(appointment.date).toISOString())

        if (!existingAppointments || existingAppointments.length === 0) {
          await createAppointment(userId, {
            title: appointment.title,
            description: appointment.description,
            date: new Date(appointment.date).toISOString(),
            duration: appointment.duration,
            category: appointment.category
          })
        }
      }
    }

    // Sincronizar recompensas
    if (localData.rewards && localData.rewards.length > 0) {
      for (const reward of localData.rewards) {
        // Verificar se a recompensa já existe no servidor
        const { data: existingRewards } = await supabase
          .from('user_rewards')
          .select('id')
          .eq('user_id', userId)
          .eq('reward_id', reward.id)

        if (!existingRewards || existingRewards.length === 0) {
          await createUserReward(userId, {
            reward_id: reward.id,
            name: reward.name,
            description: reward.description,
            type: reward.type,
            unlock_level: reward.unlockLevel,
            icon: reward.icon
          })
        }
      }
    }

    // Sincronizar troféus
    if (localData.trophies && localData.trophies.length > 0) {
      for (const trophy of localData.trophies) {
        // Verificar se o troféu já existe no servidor
        const { data: existingTrophies } = await supabase
          .from('trophies')
          .select('id')
          .eq('user_id', userId)
          .eq('trophy_id', trophy.id)

        if (!existingTrophies || existingTrophies.length === 0) {
          await createUserTrophy(userId, {
            trophy_id: trophy.id,
            name: trophy.name,
            description: trophy.description,
            icon: trophy.icon,
            days_required: trophy.daysRequired,
            unlocked: trophy.unlocked
          })
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao sincronizar dados:', error)
    return { success: false, error }
  }
}

// Função para fazer backup completo dos dados do usuário
export const backupUserData = async (userId: string) => {
  try {
    const [profileResult, tasksResult, expensesResult, appointmentsResult, rewardsResult, trophiesResult] = await Promise.all([
      getUserProfile(userId),
      getUserTasks(userId),
      getUserExpenses(userId),
      getUserAppointments(userId),
      getUserRewards(userId),
      getUserTrophies(userId)
    ])

    return {
      success: true,
      data: {
        profile: profileResult.data,
        tasks: tasksResult.data || [],
        expenses: expensesResult.data || [],
        appointments: appointmentsResult.data || [],
        rewards: rewardsResult.data || [],
        trophies: trophiesResult.data || []
      }
    }
  } catch (error) {
    console.error('Erro ao fazer backup dos dados:', error)
    return { success: false, error }
  }
}

// Função para restaurar dados do backup
export const restoreUserData = async (userId: string, backupData: any) => {
  try {
    // Restaurar perfil
    if (backupData.profile) {
      await updateUserProfile(userId, backupData.profile)
    }

    // Restaurar dados usando a função de sincronização
    await syncLocalDataToServer(userId, {
      tasks: backupData.tasks || [],
      expenses: backupData.expenses || [],
      appointments: backupData.appointments || [],
      rewards: backupData.rewards || [],
      trophies: backupData.trophies || []
    })

    return { success: true }
  } catch (error) {
    console.error('Erro ao restaurar dados:', error)
    return { success: false, error }
  }
}