import {
  MOCK_HEATMAP,
  MOCK_PROXIMITY,
  MOCK_VENN,
  MOCK_TIMELINE,
  MOCK_ANOMALIES,
  MOCK_REPORT_CONTENT,
} from './mockData';

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

/** Try API first, fallback to mock data */
async function fetchWithFallback<T>(path: string, fallback: T): Promise<T> {
  try {
    const result = await fetchApi<T>(path);
    // If the result looks empty (e.g. all-zero heatmap), use mock
    if (isEmptyResult(result)) return fallback;
    return result;
  } catch {
    return fallback;
  }
}

function isEmptyResult(data: unknown): boolean {
  if (!data) return true;
  // Check heatmap with all-zero matrix
  if (typeof data === 'object' && data !== null && 'matrix' in data) {
    const d = data as { matrix?: number[][] };
    if (d.matrix?.every((row) => row.every((v) => v === 0))) return true;
  }
  // Check empty array
  if (Array.isArray(data) && data.length === 0) return true;
  return false;
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
    getAll: (year = 2023) =>
      fetchWithFallback(`/anomalies?year=${year}`, MOCK_ANOMALIES),
    getHeatmap: (year = 2023) =>
      fetchWithFallback(`/anomalies/heatmap?year=${year}`, MOCK_HEATMAP),
    getVenn: (year = 2023) =>
      fetchWithFallback(`/anomalies/venn?year=${year}`, MOCK_VENN),
    getProximity: (year = 2023) =>
      fetchWithFallback(`/anomalies/proximity?year=${year}`, MOCK_PROXIMITY),
    getTimeline: () =>
      fetchWithFallback('/anomalies/timeline', MOCK_TIMELINE),
  },
  ml: {
    run: (year = 2023) => fetchApi<any>(`/ml/run?year=${year}`, { method: 'POST' }),
    status: () => fetchApi<any>('/ml/status'),
  },
  report: {
    generate: (year = 2023) =>
      fetchApi<any>(`/report/generate?year=${year}`, { method: 'POST' }),
    getLatest: (year = 2023) =>
      fetchWithFallback(`/report/latest?year=${year}`, { content: MOCK_REPORT_CONTENT }),
    streamUrl: (year = 2023) => `${API_BASE}/api/report/stream?year=${year}`,
  },
};
