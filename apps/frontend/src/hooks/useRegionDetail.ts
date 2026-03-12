import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useRegionDetail(id: string) {
  return useQuery({
    queryKey: ['region', id],
    queryFn: () => api.regions.getOne(id),
    enabled: !!id,
  });
}
