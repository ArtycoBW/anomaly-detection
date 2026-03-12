import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useHeatmap(year = 2023) {
  return useQuery({
    queryKey: ['heatmap', year],
    queryFn: () => api.anomalies.getHeatmap(year),
  });
}
