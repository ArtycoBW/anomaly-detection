import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => api.regions.getAll(),
  });
}
