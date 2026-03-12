import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useReport(year = 2023) {
  return useQuery({
    queryKey: ['report', year],
    queryFn: () => api.report.getLatest(year),
    retry: false,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (year: number) => api.report.generate(year),
    onSuccess: (_, year) => {
      queryClient.invalidateQueries({ queryKey: ['report', year] });
    },
  });
}
