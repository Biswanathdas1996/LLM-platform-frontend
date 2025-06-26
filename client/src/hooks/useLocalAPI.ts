import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, GenerateRequest } from '@/lib/api';

export function useHealth() {
  return useQuery({
    queryKey: ['/api/v1/health'],
    queryFn: () => api.health(),
    refetchInterval: 30000, // Check health every 30 seconds
  });
}

export function useModels() {
  return useQuery({
    queryKey: ['/api/v1/models'],
    queryFn: () => api.getModels(),
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
  });
}
