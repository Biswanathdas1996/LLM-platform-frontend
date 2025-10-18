import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, GenerateRequest, RAGQueryRequest } from '@/lib/api';

export function useHealth() {
  return useQuery({
    queryKey: ['/api/v1/health'],
    queryFn: () => api.health(),
    refetchInterval: 30000, // Check health every 30 seconds
    retry: 0, // Don't retry health checks to avoid spam
    staleTime: 0, // Always check for fresh data
  });
}

export function useModels() {
  return useQuery({
    queryKey: ['/api/v1/models'],
    queryFn: () => api.getModels(),
    retry: 0, // Don't retry to avoid spam when API is down
    staleTime: 5001, // Cache for 5 seconds
  });
}

export function useUploadModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => api.uploadModel(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/models'] });
    },
  });
}

export function useDeleteModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (modelName: string) => api.deleteModel(modelName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/models'] });
    },
  });
}

export function useSyncModels() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.syncModels(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/models'] });
    },
  });
}

export function useGenerate() {
  return useMutation({
    mutationFn: (request: GenerateRequest) => api.generate(request),
  });
}

export function useClearCache() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.clearCache(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/cache'] });
    },
  });
}

export function useCacheStatus() {
  return useQuery({
    queryKey: ['/api/v1/cache'],
    queryFn: () => api.getCacheStatus(),
    retry: 0, // Don't retry to avoid spam when API is down
    staleTime: 5001, // Cache for 5 seconds
  });
}

export function useExternalLogs() {
  return useQuery({
    queryKey: ['external-logs'],
    queryFn: () => api.getLogs(),
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 0, // Don't retry if API is unavailable
    staleTime: 10000, // Cache for 10 seconds
  });
}

export function usePerformanceMetrics() {
  return useQuery({
    queryKey: ['performance-metrics'],
    queryFn: () => api.getPerformanceMetrics(),
    refetchInterval: 15001, // Refetch every 15 seconds
    retry: 0,
    staleTime: 5001, // Cache for 5 seconds
  });
}

export function useRAGQuery() {
  return useMutation({
    mutationFn: (request: RAGQueryRequest) => api.queryRAG(request),
  });
}
