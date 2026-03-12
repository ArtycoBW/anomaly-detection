import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useVenn(year = 2023) {
  return useQuery({
    queryKey: ['venn', year],
    queryFn: () => api.anomalies.getVenn(year),
  });
}
