'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { dzfColors } from '@/theme/colors';
import {
  DZFBadge,
  CheckIcon,
  TrashIcon,
  EditIcon,
  ClockIcon,
  UsersIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '@/components';
import type { ITaskItemDTO } from '@/lib/admin/types';

export type KanbanStatus = 'todo' | 'inProgress' | 'completed';

interface TaskKanbanBoardProps {
  tasks: ITaskItemDTO[];
  onUpdateStatus: (taskId: string, newStatus: KanbanStatus) => Promise<void>;
  onEditTask?: (task: ITaskItemDTO) => void;
  onDeleteTask?: (taskId: string) => Promise<void>;
  canManage?: boolean;
  currentUsername?: string;
}

interface ColumnConfig {
  id: KanbanStatus;
  title: string;
  color: string;
  bgLight: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: 'todo', title: 'To Do', color: '#64748b', bgLight: '#f8fafc' },
  { id: 'inProgress', title: 'In Progress', color: '#0284c7', bgLight: '#f0f9ff' },
  { id: 'completed', title: 'Completed', color: '#16a34a', bgLight: '#f0fdf4' },
];

export default function TaskKanbanBoard({
  tasks,
  onUpdateStatus,
  onEditTask,
  onDeleteTask,
  canManage = true,
  currentUsername,
}: TaskKanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<KanbanStatus | null>(null);

  // Menu state for mobile or click-based quick status move
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [menuTargetTask, setMenuTargetTask] = React.useState<ITaskItemDTO | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, colId: KanbanStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, colId: KanbanStatus) => {
    if (dragOverColumn === colId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetCol: KanbanStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetCol) return;

    await onUpdateStatus(taskId, targetCol);
  };

  const openMoveMenu = (e: React.MouseEvent<HTMLElement>, task: ITaskItemDTO) => {
    setMenuAnchor(e.currentTarget);
    setMenuTargetTask(task);
  };

  const closeMoveMenu = () => {
    setMenuAnchor(null);
    setMenuTargetTask(null);
  };

  const handleMoveViaMenu = async (newStatus: KanbanStatus) => {
    if (menuTargetTask && menuTargetTask.status !== newStatus) {
      await onUpdateStatus(menuTargetTask.id, newStatus);
    }
    closeMoveMenu();
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2.5}>
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <Grid key={col.id} size={{ xs: 12, md: 4 }}>
              <Box
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: isOver ? 'rgba(2, 132, 199, 0.06)' : col.bgLight,
                  border: isOver
                    ? `2px dashed ${dzfColors.navy[500]}`
                    : `1px solid ${dzfColors.surfaces.border}`,
                  minHeight: 480,
                  transition: 'background-color 0.2s ease, border-color 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Lane Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 1.5,
                    mb: 1.5,
                    borderBottom: `1px solid ${dzfColors.surfaces.border}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: col.color,
                      }}
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 800, color: dzfColors.navy[900], fontSize: '0.9375rem' }}
                    >
                      {col.title}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={colTasks.length}
                    sx={{
                      fontWeight: 700,
                      backgroundColor: '#ffffff',
                      border: `1px solid ${dzfColors.surfaces.border}`,
                      color: dzfColors.navy[700],
                      height: 22,
                    }}
                  />
                </Box>

                {/* Cards Container */}
                {colTasks.length === 0 ? (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 3,
                      border: '1px dashed rgba(0, 0, 0, 0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: dzfColors.surfaces.textMuted, fontStyle: 'italic', textAlign: 'center' }}
                    >
                      {isOver ? 'Drop card here' : 'No tasks in this lane'}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {colTasks.map((t) => {
                      const isBroadcast =
                        t.targetGroup === 'all' || t.assignedTo?.username === 'group:all';
                      const isPrivate = Boolean(
                        t.isSelfAssigned ||
                          (t.assignedTo?.username &&
                            t.assignedBy?.username &&
                            t.assignedTo.username.toLowerCase() === t.assignedBy.username.toLowerCase())
                      );
                      const isMyTask = Boolean(
                        currentUsername &&
                          t.assignedTo?.username &&
                          (t.assignedTo.username.toLowerCase() === currentUsername.toLowerCase() ||
                            isBroadcast)
                      );
                      const isAuthor = Boolean(
                        currentUsername &&
                          t.assignedBy?.username &&
                          t.assignedBy.username.toLowerCase() === currentUsername.toLowerCase()
                      );
                      const canEdit = Boolean(onEditTask && (canManage || isAuthor));
                      const canDelete = Boolean(onDeleteTask && (canManage || isAuthor));
                      const isDragging = draggedTaskId === t.id;

                      return (
                        <Card
                          key={t.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, t.id)}
                          onDragEnd={() => setDraggedTaskId(null)}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            backgroundColor: '#ffffff',
                            border: isMyTask
                              ? `1.5px solid ${dzfColors.gold[500]}`
                              : `1px solid ${dzfColors.surfaces.border}`,
                            boxShadow: isDragging
                              ? '0 12px 28px rgba(0,0,0,0.2)'
                              : '0 2px 8px rgba(0,0,0,0.04)',
                            opacity: isDragging ? 0.4 : 1,
                            cursor: 'grab',
                            '&:active': { cursor: 'grabbing' },
                            '&:hover': {
                              boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                              borderColor: dzfColors.navy[500],
                            },
                            transition: 'box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease',
                          }}
                        >
                          {/* Badges: Broadcast or Private */}
                          {(isBroadcast || isPrivate) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
                              {isBroadcast && (
                                <Chip
                                  size="small"
                                  label="👥 All Team Members"
                                  sx={{
                                    height: 22,
                                    fontSize: '0.6875rem',
                                    fontWeight: 800,
                                    bgcolor: 'rgba(10, 25, 47, 0.08)',
                                    color: dzfColors.navy[900],
                                    border: `1px solid ${dzfColors.navy[200]}`,
                                  }}
                                />
                              )}
                              {isPrivate && (
                                <Chip
                                  size="small"
                                  label="🔒 Private Task"
                                  sx={{
                                    height: 22,
                                    fontSize: '0.6875rem',
                                    fontWeight: 800,
                                    bgcolor: '#fef9c3',
                                    color: '#854d0e',
                                    border: '1px solid #fde047',
                                  }}
                                />
                              )}
                            </Box>
                          )}

                          {/* Title & Priority Badge */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                color: dzfColors.navy[900],
                                lineHeight: 1.3,
                                flex: 1,
                              }}
                            >
                              {t.title}
                            </Typography>
                            <DZFBadge
                              variant={
                                t.priority === 'high'
                                  ? 'error'
                                  : t.priority === 'medium'
                                  ? 'warning'
                                  : 'default'
                              }
                              size="small"
                              label={t.priority}
                            />
                          </Box>

                          {/* Description */}
                          {t.description && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: dzfColors.surfaces.textSecondary,
                                fontSize: '0.8125rem',
                                mb: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {t.description}
                            </Typography>
                          )}

                          {/* Due Date & Assignment Attribution */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
                            {t.dueDate && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ClockIcon size={14} color={dzfColors.surfaces.textMuted} />
                                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 500 }}>
                                  Due: {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Typography>
                              </Box>
                            )}

                            {/* Assignee & Assigned By */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <UsersIcon size={14} color={dzfColors.navy[700]} />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 700,
                                    color: isMyTask ? dzfColors.maroon[900] : dzfColors.navy[700],
                                  }}
                                >
                                  {isBroadcast ? 'All Team Members' : `@${t.assignedTo.username}`}
                                </Typography>
                              </Box>

                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.6875rem',
                                  color: dzfColors.surfaces.textMuted,
                                }}
                              >
                                By: @{t.assignedBy?.username || 'admin'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Footer Controls */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              pt: 1,
                              borderTop: `1px solid ${dzfColors.surfaces.canvas}`,
                            }}
                          >
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {/* Move lane quick-menu button */}
                              <Tooltip title="Move to another lane">
                                <IconButton
                                  size="small"
                                  onClick={(e) => openMoveMenu(e, t)}
                                  sx={{ color: dzfColors.navy[700], p: 0.5 }}
                                >
                                  <ChevronRightIcon size={16} />
                                </IconButton>
                              </Tooltip>

                              {canEdit && onEditTask && (
                                <Tooltip title="Edit Task Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => onEditTask(t)}
                                    sx={{ color: '#2563eb', p: 0.5 }}
                                  >
                                    <EditIcon size={16} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                              {/* Bidirectional lane transition actions */}
                              {col.id === 'todo' && (
                                <Tooltip title="Start Task (Move to In Progress)">
                                  <IconButton
                                    size="small"
                                    onClick={() => onUpdateStatus(t.id, 'inProgress')}
                                    sx={{
                                      color: '#0284c7',
                                      p: 0.5,
                                      '&:hover': { backgroundColor: 'rgba(2, 132, 199, 0.08)' },
                                    }}
                                  >
                                    <ChevronRightIcon size={16} />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {col.id === 'inProgress' && (
                                <Tooltip title="Move back to To Do">
                                  <IconButton
                                    size="small"
                                    onClick={() => onUpdateStatus(t.id, 'todo')}
                                    sx={{
                                      color: '#64748b',
                                      p: 0.5,
                                      '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.08)' },
                                    }}
                                  >
                                    <ChevronLeftIcon size={16} />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {col.id === 'completed' && (
                                <Tooltip title="Reopen (Move back to In Progress)">
                                  <IconButton
                                    size="small"
                                    onClick={() => onUpdateStatus(t.id, 'inProgress')}
                                    sx={{
                                      color: '#0284c7',
                                      p: 0.5,
                                      '&:hover': { backgroundColor: 'rgba(2, 132, 199, 0.08)' },
                                    }}
                                  >
                                    <ChevronLeftIcon size={16} />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {col.id !== 'completed' && (
                                <Tooltip title="Mark as Completed">
                                  <IconButton
                                    size="small"
                                    onClick={() => onUpdateStatus(t.id, 'completed')}
                                    sx={{
                                      color: '#16a34a',
                                      p: 0.5,
                                      '&:hover': { backgroundColor: 'rgba(22, 163, 74, 0.08)' },
                                    }}
                                  >
                                    <CheckIcon size={16} />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {canDelete && onDeleteTask && (
                                <Tooltip title="Delete Task">
                                  <IconButton
                                    size="small"
                                    onClick={() => onDeleteTask(t.id)}
                                    sx={{
                                      color: '#dc2626',
                                      p: 0.5,
                                      '&:hover': { backgroundColor: 'rgba(220, 38, 38, 0.08)' },
                                    }}
                                  >
                                    <TrashIcon size={16} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                        </Card>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Quick Move Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMoveMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            minWidth: 160,
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{ px: 2, py: 1, display: 'block', fontWeight: 700, color: dzfColors.surfaces.textMuted }}
        >
          MOVE TASK TO:
        </Typography>
        {COLUMNS.map((c) => (
          <MenuItem
            key={c.id}
            onClick={() => handleMoveViaMenu(c.id)}
            disabled={menuTargetTask?.status === c.id}
            sx={{ fontSize: '0.8125rem' }}
          >
            <ListItemIcon sx={{ minWidth: 24 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: c.color,
                }}
              />
            </ListItemIcon>
            <ListItemText primary={c.title} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
