import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useIndicatorTable(year = 2023) {
  return useQuery({
    queryKey: ['indicator-table', year],
    queryFn: () => api.anomalies.getIndicatorTable(year),
  });
}
