import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deepSeekApi, DeepSeekGenerateRequest } from '@/lib/deepseek-api';

export function useDeepSeekHealth() {
  return useQuery({
    queryKey: ['/api/deepseek/health'],
    queryFn: () => deepSeekApi.health(),
    refetchInterval: 30000, // Check health every 30 seconds
    retry: 3,
  });
}

export function useDeepSeekModels() {
  return useQuery({
    queryKey: ['/api/deepseek/models'],
    queryFn: () => deepSeekApi.getModels(),
    refetchOnWindowFocus: false,
  });
}

export function useDeepSeekModel(name: string) {
  return useQuery({
    queryKey: ['/api/deepseek/models', name],
    queryFn: () => deepSeekApi.getModel(name),
    enabled: !!name,
  });
}

export function useDeepSeekGenerate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: DeepSeekGenerateRequest) => deepSeekApi.generate(request),
    onSuccess: () => {
      // Optionally invalidate any related queries
      queryClient.invalidateQueries({ queryKey: ['/api/deepseek/models'] });
    },
  });
}

export function useDeepSeekQuickTest() {
  return useMutation({
    mutationFn: () => deepSeekApi.quickTest(),
  });
}