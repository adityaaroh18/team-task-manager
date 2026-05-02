import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, tasksApi, dashboardApi } from '../utils/api';
import toast from 'react-hot-toast';

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then((r) => r.data),
  });

export const useMyTasks = () =>
  useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => dashboardApi.getMyTasks().then((r) => r.data),
  });

// ── Projects ──────────────────────────────────────────────────────────────────

export const useProjects = () =>
  useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then((r) => r.data),
  });

export const useProject = (projectId) =>
  useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId).then((r) => r.data),
    enabled: !!projectId,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => projectsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['projects']);
      toast.success('Project created!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create project'),
  });
};

export const useUpdateProject = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => projectsApi.update(projectId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['project', projectId]);
      qc.invalidateQueries(['projects']);
      toast.success('Project updated!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update project'),
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId) => projectsApi.delete(projectId),
    onSuccess: () => {
      qc.invalidateQueries(['projects']);
      toast.success('Project deleted');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete project'),
  });
};

// ── Members ───────────────────────────────────────────────────────────────────

export const useMembers = (projectId) =>
  useQuery({
    queryKey: ['members', projectId],
    queryFn: () => projectsApi.getMembers(projectId).then((r) => r.data),
    enabled: !!projectId,
  });

export const useAddMember = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => projectsApi.addMember(projectId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['members', projectId]);
      toast.success('Member added!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add member'),
  });
};

export const useRemoveMember = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => projectsApi.removeMember(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries(['members', projectId]);
      toast.success('Member removed');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to remove member'),
  });
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const useTasks = (projectId, filters = {}) =>
  useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: () => tasksApi.list(projectId, filters).then((r) => r.data),
    enabled: !!projectId,
  });

export const useCreateTask = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => tasksApi.create(projectId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['tasks', projectId]);
      qc.invalidateQueries(['dashboard']);
      toast.success('Task created!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create task'),
  });
};

export const useUpdateTask = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...data }) => tasksApi.update(projectId, taskId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['tasks', projectId]);
      qc.invalidateQueries(['my-tasks']);
      qc.invalidateQueries(['dashboard']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update task'),
  });
};

export const useDeleteTask = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => tasksApi.delete(projectId, taskId),
    onSuccess: () => {
      qc.invalidateQueries(['tasks', projectId]);
      qc.invalidateQueries(['dashboard']);
      toast.success('Task deleted');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete task'),
  });
};

// ── Comments ──────────────────────────────────────────────────────────────────

export const useComments = (projectId, taskId) =>
  useQuery({
    queryKey: ['comments', projectId, taskId],
    queryFn: () => tasksApi.getComments(projectId, taskId).then((r) => r.data),
    enabled: !!projectId && !!taskId,
  });

export const useAddComment = (projectId, taskId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => tasksApi.addComment(projectId, taskId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['comments', projectId, taskId]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add comment'),
  });
};
