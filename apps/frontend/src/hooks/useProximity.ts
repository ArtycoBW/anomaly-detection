import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useProximity(year = 2023) {
  return useQuery({
    queryKey: ['proximity', year],
    queryFn: () => api.anomalies.getProximity(year),
  });
}
