const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  regions: {
    getAll: () => fetchApi<any[]>('/regions'),
    getOne: (id: string) => fetchApi<any>(`/regions/${id}`),
    getIndicators: (id: string) => fetchApi<any>(`/regions/${id}/indicators`),
    getAnomalies: (id: string, year?: number) =>
      fetchApi<any>(`/regions/${id}/anomalies${year ? `?year=${year}` : ''}`),
  },
  anomalies: {
    getAll: (year = 2023) => fetchApi<any>(`/anomalies?year=${year}`),
    getHeatmap: (year = 2023) => fetchApi<any>(`/anomalies/heatmap?year=${year}`),
    getVenn: (year = 2023) => fetchApi<any>(`/anomalies/venn?year=${year}`),
    getProximity: (year = 2023) => fetchApi<any>(`/anomalies/proximity?year=${year}`),
    getTimeline: () => fetchApi<any>('/anomalies/timeline'),
  },
  ml: {
    run: (year = 2023) => fetchApi<any>(`/ml/run?year=${year}`, { method: 'POST' }),
    status: () => fetchApi<any>('/ml/status'),
  },
  report: {
    generate: (year = 2023) =>
      fetchApi<any>(`/report/generate?year=${year}`, { method: 'POST' }),
    getLatest: (year = 2023) => fetchApi<any>(`/report/latest?year=${year}`),
    streamUrl: (year = 2023) => `${API_BASE}/api/report/stream?year=${year}`,
  },
};
