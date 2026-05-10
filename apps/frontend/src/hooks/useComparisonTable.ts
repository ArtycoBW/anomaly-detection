import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useComparisonTable(year = 2023) {
  return useQuery({
    queryKey: ['comparison-table', year],
    queryFn: () => api.anomalies.getComparisonTable(year),
  });
}
