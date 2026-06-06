export interface StatusFlowEdge {
  from: string;
  to: string;
  label?: string;
}

export const ANIMAL_STATUSES = [
  'healthy',
  'sick',
  'in_experiment',
  'deceased',
  'quarantine',
] as const;

export type AnimalStatus = typeof ANIMAL_STATUSES[number];

export const STATUS_LABELS: Record<AnimalStatus, string> = {
  healthy: '健康',
  sick: '患病',
  in_experiment: '实验中',
  deceased: '已死亡',
  quarantine: '隔离中',
};

export const STATUS_COLORS: Record<AnimalStatus, string> = {
  healthy: 'success',
  sick: 'error',
  in_experiment: 'processing',
  deceased: 'default',
  quarantine: 'warning',
};

export const STATUS_FLOW_EDGES: StatusFlowEdge[] = [
  { from: 'quarantine', to: 'healthy', label: '检疫通过' },
  { from: 'quarantine', to: 'sick', label: '检疫发现患病' },
  { from: 'healthy', to: 'sick', label: '生病' },
  { from: 'healthy', to: 'in_experiment', label: '进入实验' },
  { from: 'healthy', to: 'quarantine', label: '需隔离观察' },
  { from: 'healthy', to: 'deceased', label: '意外死亡' },
  { from: 'sick', to: 'healthy', label: '康复' },
  { from: 'sick', to: 'deceased', label: '病死' },
  { from: 'in_experiment', to: 'healthy', label: '实验结束' },
  { from: 'in_experiment', to: 'sick', label: '实验中生病' },
  { from: 'in_experiment', to: 'deceased', label: '实验中死亡' },
];

export function getAllowedNextStatuses(currentStatus: string): string[] {
  return STATUS_FLOW_EDGES
    .filter((edge) => edge.from === currentStatus)
    .map((edge) => edge.to);
}

export function isStatusTransitionAllowed(fromStatus: string, toStatus: string): boolean {
  if (fromStatus === toStatus) return true;
  return STATUS_FLOW_EDGES.some(
    (edge) => edge.from === fromStatus && edge.to === toStatus,
  );
}

export function getStatusFlowEdges(): StatusFlowEdge[] {
  return STATUS_FLOW_EDGES;
}
