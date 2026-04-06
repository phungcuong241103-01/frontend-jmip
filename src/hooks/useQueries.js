import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getStats,
  getFilters,
  getJobs,
  getLocations,
  getLevels,
  getSkills,
  getRoles,
  getCompanies,
  getAnalyticsOverview,
  getAnalyticsSkills,
  getAnalyticsSalary,
  getAnalyticsTrend,
  getAnalyticsSalaryByRole,
  getAnalyticsLevels,
  getAnalyticsRoles,
  chatWithAI,
  predictSalary,
  getLearningAdvice,
} from '../services/api';

// ─── Stale time constants ───────────────────────────────────────────────────
const STALE_STATIC = 10 * 60 * 1000;   // 10 min — metadata ít thay đổi
const STALE_ANALYTICS = 5 * 60 * 1000;  // 5 min  — analytics data
const STALE_JOBS = 2 * 60 * 1000;       // 2 min  — jobs list

// ─── Static metadata queries ────────────────────────────────────────────────

export const useStats = () =>
  useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    staleTime: STALE_ANALYTICS,
  });

export const useFilters = () =>
  useQuery({
    queryKey: ['filters'],
    queryFn: getFilters,
    staleTime: STALE_STATIC,
  });

export const useLocations = () =>
  useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
    staleTime: STALE_STATIC,
  });

export const useLevels = () =>
  useQuery({
    queryKey: ['levels'],
    queryFn: getLevels,
    staleTime: STALE_STATIC,
  });

export const useSkills = () =>
  useQuery({
    queryKey: ['skills'],
    queryFn: getSkills,
    staleTime: STALE_STATIC,
  });

export const useRoles = () =>
  useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    staleTime: STALE_STATIC,
  });

export const useCompanies = () =>
  useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
    staleTime: STALE_STATIC,
  });

// ─── Jobs query (filter-dependent) ─────────────────────────────────────────

export const useJobs = (params, options = {}) =>
  useQuery({
    queryKey: ['jobs', params],
    queryFn: () => getJobs(params),
    staleTime: STALE_JOBS,
    placeholderData: (previousData) => previousData, // keep previous data during pagination
    ...options,
  });

// ─── Analytics queries ──────────────────────────────────────────────────────

export const useAnalyticsOverview = () =>
  useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: getAnalyticsOverview,
    staleTime: STALE_ANALYTICS,
  });

export const useAnalyticsSkills = () =>
  useQuery({
    queryKey: ['analytics', 'skills'],
    queryFn: getAnalyticsSkills,
    staleTime: STALE_ANALYTICS,
  });

export const useAnalyticsSalary = () =>
  useQuery({
    queryKey: ['analytics', 'salary'],
    queryFn: getAnalyticsSalary,
    staleTime: STALE_ANALYTICS,
  });

export const useAnalyticsTrend = () =>
  useQuery({
    queryKey: ['analytics', 'trend'],
    queryFn: getAnalyticsTrend,
    staleTime: STALE_ANALYTICS,
  });

export const useAnalyticsSalaryByRole = () =>
  useQuery({
    queryKey: ['analytics', 'salaryByRole'],
    queryFn: getAnalyticsSalaryByRole,
    staleTime: STALE_ANALYTICS,
  });

export const useAnalyticsLevels = () =>
  useQuery({
    queryKey: ['analytics', 'levels'],
    queryFn: getAnalyticsLevels,
    staleTime: STALE_ANALYTICS,
  });

export const useAnalyticsRoles = () =>
  useQuery({
    queryKey: ['analytics', 'roles'],
    queryFn: getAnalyticsRoles,
    staleTime: STALE_ANALYTICS,
  });

// ─── Mutations (no caching) ────────────────────────────────────────────────

export const useChatWithAI = () =>
  useMutation({
    mutationFn: (message) => chatWithAI(message),
  });

export const usePredictSalary = () =>
  useMutation({
    mutationFn: (data) => predictSalary(data),
  });

export const useLearningAdvice = () =>
  useMutation({
    mutationFn: (data) => getLearningAdvice(data),
  });
