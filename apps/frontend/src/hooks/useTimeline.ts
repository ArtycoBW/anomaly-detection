import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useTimeline() {
  return useQuery({
    queryKey: ['timeline'],
    queryFn: () => api.anomalies.getTimeline(),
  });
}
