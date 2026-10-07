'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ITokenPayload } from '@/lib/auth/jwt';
import type { ITaskItemDTO } from '@/lib/admin/types';
import { AppShell } from '@/components/layout/AppShell';
import TaskKanbanBoard, { KanbanStatus } from '@/components/admin/TaskKanbanBoard';
import TaskFormDialog from '@/components/admin/TaskFormDialog';
import TaskEditDialog from '@/components/admin/TaskEditDialog';
import { DZFButton } from '@/components';
import { dzfColors } from '@/theme/colors';
import Chip from '@mui/material/Chip';

interface TasksWorkspaceClientProps {
  user: ITokenPayload;
  initialTasks: ITaskItemDTO[];
}

export default function TasksWorkspaceClient({
  user,
  initialTasks,
}: TasksWorkspaceClientProps) {
  const [tasks, setTasks] = React.useState<ITaskItemDTO[]>(initialTasks);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedEditTask, setSelectedEditTask] = React.useState<ITaskItemDTO | null>(null);

  // Real-time synchronization for task progression
  const fetchRemoteTasks = React.useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (selectedEditTask || isCreateOpen) return;

    try {
      const res = await fetch('/api/admin/tasks?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks)) {
          setTasks((prev) => {
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(data.tasks);
            return hasChanged ? data.tasks : prev;
          });
        }
      }
    } catch (err) {
      console.warn('Real-time task sync warning:', err);
    }
  }, [selectedEditTask, isCreateOpen]);

  React.useEffect(() => {
    const timer = setInterval(fetchRemoteTasks, 8000);
    return () => clearInterval(timer);
  }, [fetchRemoteTasks]);

  const handleUpdateTaskStatus = async (id: string, newStatus: KanbanStatus) => {
    try {
      const res = await fetch(`/api/admin/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: newStatus as any } : t))
        );
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    assignedToUsername: string;
    assignedToName: string;
  }) => {
    const res = await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create task');
    }
    if (data.task) {
      setTasks((prev) => [data.task, ...prev]);
    }
    setIsCreateOpen(false);
  };

  const handleSaveEditedTask = async (taskId: string, payload: any) => {
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update task');
    }
    if (data.task) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
    }
    setSelectedEditTask(null);
  };

  const canManage =
    user.role === 'admin' ||
    user.role === 'ima' ||
    user.role === 'country_manager';

  return (
    <AppShell user={user} activeNavId="tasks">
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3.5 } }}>
        {/* Breadcrumb & Header Title */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Workspace
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                /
              </Typography>
              <Typography variant="caption" sx={{ color: dzfColors.navy[900], fontWeight: 700 }}>
                Task Board
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: dzfColors.navy[900], letterSpacing: '-0.5px' }}>
              Operational Staff Tasks Board
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Track institutional tasks, maintenance, and collaborative assignments across workflow lanes.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              size="small"
              icon={
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: '#16a34a',
                    boxShadow: '0 0 6px rgba(22, 163, 74, 0.6)',
                    ml: 0.75,
                  }}
                />
              }
              label="Live Sync Active"
              sx={{
                bgcolor: '#f0fdf4',
                color: '#15803d',
                fontWeight: 700,
                fontSize: '0.75rem',
                border: '1px solid #bbf7d0',
              }}
            />
            <DZFButton
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              sx={{ fontWeight: 700 }}
            >
              + Create Task
            </DZFButton>
          </Box>
        </Box>

        {/* 3-Column Drag-and-Drop Kanban Board */}
        <TaskKanbanBoard
          tasks={tasks}
          onUpdateStatus={handleUpdateTaskStatus}
          onEditTask={(task) => setSelectedEditTask(task)}
          onDeleteTask={handleDeleteTask}
          canManage={canManage}
          currentUsername={user.username}
        />

        {/* Create Task Dialog */}
        <TaskFormDialog
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateTask}
          currentUser={user}
        />

        {/* Edit Task Dialog */}
        <TaskEditDialog
          open={Boolean(selectedEditTask)}
          task={selectedEditTask}
          onClose={() => setSelectedEditTask(null)}
          onSubmit={handleSaveEditedTask}
          currentUser={user}
        />
      </Box>
    </AppShell>
  );
}
