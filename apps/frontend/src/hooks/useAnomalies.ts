import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAnomalies(year = 2023) {
  return useQuery({
    queryKey: ['anomalies', year],
    queryFn: () => api.anomalies.getAll(year),
  });
}
