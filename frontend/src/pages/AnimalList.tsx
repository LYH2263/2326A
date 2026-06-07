import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Space, Tag, Input, Select, Modal, Form,
  InputNumber, DatePicker, message, Popconfirm, Descriptions, Typography, Tooltip,
  Tabs, Timeline, Divider, Alert, AutoComplete,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, ReloadOutlined, SwapOutlined, MergeCellsOutlined,
  FileZipOutlined, FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { animalApi, animalArchiveApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const statusOptions = [
  { value: 'healthy', label: '健康', color: 'success' },
  { value: 'sick', label: '患病', color: 'error' },
  { value: 'in_experiment', label: '实验中', color: 'processing' },
  { value: 'deceased', label: '已死亡', color: 'default' },
  { value: 'quarantine', label: '隔离中', color: 'warning' },
];

const genderOptions = [
  { value: 'male', label: '雄性' },
  { value: 'female', label: '雌性' },
  { value: 'unknown', label: '未知' },
];

const operationTypeMap: Record<string, { label: string; color: string }> = {
  move_in: { label: '移入', color: 'success' },
  move_out: { label: '移出', color: 'default' },
  cage_split: { label: '分笼', color: 'processing' },
  cage_merge: { label: '合笼', color: 'warning' },
};

const NODE_WIDTH = 140;
const NODE_HEIGHT = 60;
const H_GAP = 40;
const V_GAP = 60;

const getNodeColor = (gender: string, isCurrent: boolean, loopDetected: boolean) => {
  if (loopDetected) return { fill: '#fff7e6', stroke: '#faad14', textColor: '#fa8c16' };
  if (isCurrent) return { fill: '#e6f7ff', stroke: '#faad14', textColor: '#1890ff', dash: true };
  if (gender === 'male') return { fill: '#e6f7ff', stroke: '#1890ff', textColor: '#1890ff' };
  if (gender === 'female') return { fill: '#fff0f6', stroke: '#eb2f96', textColor: '#eb2f96' };
  return { fill: '#fafafa', stroke: '#d9d9d9', textColor: '#666' };
};

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    healthy: '#52c41a',
    sick: '#ff4d4f',
    in_experiment: '#1890ff',
    deceased: '#8c8c8c',
    quarantine: '#faad14',
  };
  return map[status] || '#d9d9d9';
};

interface PedigreeNode {
  id: number;
  name: string;
  species: string;
  gender: string;
  status: string;
  breed?: string;
  cageNumber?: string;
  father?: PedigreeNode;
  mother?: PedigreeNode;
  children?: PedigreeNode[];
  generation?: number;
  parentType?: 'father' | 'mother' | 'child';
  loopDetected?: boolean;
}

interface PedigreeChartProps {
  data: any;
  onNodeClick?: (node: any) => void;
  currentAnimalId: number;
}

const PedigreeTreeNode: React.FC<{
  node: PedigreeNode;
  x: number;
  y: number;
  onClick?: (node: any) => void;
  currentId: number;
  parentType?: 'father' | 'mother';
  isLeft?: boolean;
}> = ({ node, x, y, onClick, currentId, parentType, isLeft = true }) => {
  const colors = getNodeColor(node.gender, currentId === node.id, !!node.loopDetected);
  const statusColor = getStatusColor(node.status);
  const genderLabel = node.gender === 'male' ? '♂' : node.gender === 'female' ? '♀' : '?';

  return (
    <g
      transform={`translate(${x - NODE_WIDTH / 2}, ${y - NODE_HEIGHT / 2})`}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick?.(node)}
    >
      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={8}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={currentId === node.id ? 3 : 1.5}
        strokeDasharray={colors.dash ? '6 3' : undefined}
      />
      <text x={NODE_WIDTH / 2} y={22} textAnchor="middle" fontSize="13" fontWeight={600} fill={colors.textColor}>
        {node.name}
        <tspan fontSize="11" fill="#999" style={{ marginLeft: 4 }}> {genderLabel}</tspan>
      </text>
      <text x={NODE_WIDTH / 2} y={40} textAnchor="middle" fontSize="11" fill="#666">
        {node.species}
      </text>
      <circle cx={NODE_WIDTH - 12} cy={12} r={5} fill={statusColor} />
      {node.loopDetected && (
        <text x={NODE_WIDTH / 2} y={54} textAnchor="middle" fontSize="10" fill="#faad14">
          ⚠ 循环引用
        </text>
      )}
    </g>
  );
};

const PedigreeTreeChart: React.FC<PedigreeChartProps> = ({ data, onNodeClick, currentAnimalId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const calculateAncestorLayout = (node: PedigreeNode, depth: number, maxDepth: number): { nodes: any[]; links: any[]; width: number } => {
    const nodes: any[] = [];
    const links: any[] = [];

    if (!node || depth > maxDepth) return { nodes, links, width: NODE_WIDTH };

    const currentY = (maxDepth - depth) * (NODE_HEIGHT + V_GAP) + NODE_HEIGHT / 2;

    if (!node.father && !node.mother) {
      nodes.push({
        ...node,
        x: NODE_WIDTH / 2,
        y: currentY,
      });
      return { nodes, links, width: NODE_WIDTH };
    }

    const leftResult = node.father && !node.father.loopDetected
      ? calculateAncestorLayout(node.father, depth + 1, maxDepth)
      : { nodes: [], links: [], width: node.father ? NODE_WIDTH : 0 };
    const rightResult = node.mother && !node.mother.loopDetected
      ? calculateAncestorLayout(node.mother, depth + 1, maxDepth)
      : { nodes: [], links: [], width: node.mother ? NODE_WIDTH : 0 };

    const totalWidth = Math.max(
      NODE_WIDTH,
      leftResult.width + H_GAP + rightResult.width
    );

    const leftOffset = (totalWidth - leftResult.width - H_GAP - rightResult.width) / 2;

    const centerX = totalWidth / 2;
    const fatherX = leftOffset + leftResult.width / 2;
    const motherX = leftOffset + leftResult.width + H_GAP + rightResult.width / 2;

    nodes.push({
      ...node,
      x: centerX,
      y: currentY,
    });

    for (const n of leftResult.nodes) {
      nodes.push({ ...n, x: n.x + leftOffset });
    }
    for (const n of rightResult.nodes) {
      nodes.push({ ...n, x: n.x + leftOffset + leftResult.width + H_GAP });
    }

    if (node.father) {
      const fatherNode = leftResult.nodes.length > 0
        ? leftResult.nodes[leftResult.nodes.length - 1]
        : { x: fatherX, y: currentY + NODE_HEIGHT + V_GAP };
      links.push({
        fromX: centerX,
        fromY: currentY - NODE_HEIGHT / 2,
        toX: fatherNode.x || fatherX,
        toY: currentY + V_GAP - NODE_HEIGHT / 2,
        type: 'father',
      });
    }

    if (node.mother) {
      const motherNode = rightResult.nodes.length > 0
        ? rightResult.nodes[rightResult.nodes.length - 1]
        : { x: motherX, y: currentY + NODE_HEIGHT + V_GAP };
      links.push({
        fromX: centerX,
        fromY: currentY - NODE_HEIGHT / 2,
        toX: motherNode.x || motherX,
        toY: currentY + V_GAP - NODE_HEIGHT / 2,
        type: 'mother',
      });
    }

    links.push(...leftResult.links.map(l => ({ ...l, fromX: l.fromX + leftOffset, toX: l.toX + leftOffset })));
    links.push(...rightResult.links.map(l => ({
      ...l,
      fromX: l.fromX + leftOffset + leftResult.width + H_GAP,
      toX: l.toX + leftOffset + leftResult.width + H_GAP,
    })));

    return { nodes, links, width: totalWidth };
  };

  const calculateDescendantLayout = (node: PedigreeNode, depth: number, maxDepth: number): { nodes: any[]; links: any[]; width: number } => {
    const nodes: any[] = [];
    const links: any[] = [];

    if (!node || depth > maxDepth) return { nodes, links, width: NODE_WIDTH };

    const currentY = depth * (NODE_HEIGHT + V_GAP) + NODE_HEIGHT / 2;
    const children = node.children || [];

    if (children.length === 0) {
      nodes.push({ ...node, x: NODE_WIDTH / 2, y: currentY });
      return { nodes, links, width: NODE_WIDTH };
    }

    const childResults = children.map(child => calculateDescendantLayout(child, depth + 1, maxDepth));
    const totalChildrenWidth = childResults.reduce((sum, r, i) => sum + r.width + (i > 0 ? H_GAP : 0), 0);
    const totalWidth = Math.max(NODE_WIDTH, totalChildrenWidth);

    const childrenStartX = (totalWidth - totalChildrenWidth) / 2;
    const centerX = totalWidth / 2;

    nodes.push({ ...node, x: centerX, y: currentY });

    let currentX = childrenStartX;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const result = childResults[i];

      for (const n of result.nodes) {
        nodes.push({ ...n, x: n.x + currentX });
      }

      const childCenterX = currentX + result.width / 2;
      links.push({
        fromX: centerX,
        fromY: currentY + NODE_HEIGHT / 2,
        toX: childCenterX,
        toY: currentY + V_GAP + NODE_HEIGHT / 2,
        type: child.parentType || 'child',
      });

      for (const l of result.links) {
        links.push({ ...l, fromX: l.fromX + currentX, toX: l.toX + currentX });
      }

      currentX += result.width + H_GAP;
    }

    return { nodes, links, width: totalWidth };
  };

  const { ancestors, descendants, generations } = data;

  const ancestorLayout = ancestors
    ? calculateAncestorLayout(ancestors, 0, generations)
    : { nodes: [], links: [], width: 0 };

  const rootNode = descendants && descendants.length > 0
    ? { ...ancestors, children: descendants }
    : ancestors;

  const descendantLayout = descendants && descendants.length > 0
    ? calculateDescendantLayout({ ...ancestors, children: descendants } as PedigreeNode, 0, generations)
    : { nodes: [], links: [], width: 0 };

  const allNodes = [
    ...ancestorLayout.nodes,
    ...descendantLayout.nodes.filter((n: any) => n.id !== ancestors?.id),
  ];

  const allLinks = [
    ...ancestorLayout.links,
    ...descendantLayout.links,
  ];

  const svgWidth = Math.max(ancestorLayout.width, descendantLayout.width, 400) + 80;
  const ancestorHeight = generations * (NODE_HEIGHT + V_GAP) + NODE_HEIGHT;
  const svgHeight = ancestorHeight + generations * (NODE_HEIGHT + V_GAP) + 100;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.max(0.3, Math.min(3, s * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', gap: 8 }}>
        <Button size="small" onClick={() => setScale(s => Math.min(3, s * 1.2))}>+</Button>
        <Button size="small" onClick={() => setScale(s => Math.max(0.3, s * 0.8))}>-</Button>
        <Button size="small" onClick={resetView}>重置</Button>
      </div>
      <div
        style={{
          width: '100%',
          height: 500,
          overflow: 'hidden',
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          background: '#fafafa',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <g transform="translate(40, 20)">
            {allLinks.map((link: any, i: number) => {
              const color = link.type === 'father' ? '#1890ff' : '#eb2f96';
              const midY = (link.fromY + link.toY) / 2;
              return (
                <g key={i}>
                  <path
                    d={`M ${link.fromX} ${link.fromY} C ${link.fromX} ${midY}, ${link.toX} ${midY}, ${link.toX} ${link.toY}`}
                    stroke={color}
                    strokeWidth={2}
                    fill="none"
                    strokeOpacity={0.6}
                  />
                </g>
              );
            })}
            {allNodes.map((node: any) => (
              <PedigreeTreeNode
                key={node.id}
                node={node}
                x={node.x}
                y={node.y}
                onClick={onNodeClick}
                currentId={currentAnimalId}
              />
            ))}
          </g>
        </svg>
      </div>
      <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: '#999' }}>
        滚轮缩放 · 拖拽平移 · 共 {allNodes.length} 个节点 · {allLinks.length} 条连线
      </div>
    </div>
  );
};

const PedigreeForceChart: React.FC<PedigreeChartProps> = ({ data, onNodeClick, currentAnimalId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);

  const width = 700;
  const height = 500;

  useEffect(() => {
    const nodeMap = new Map<number, any>();
    const linkList: any[] = [];

    const collectFromAncestors = (node: PedigreeNode | undefined) => {
      if (!node) return;
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, { ...node });
      }
      if (node.father) {
        linkList.push({ source: node.id, target: node.father.id, type: 'father' });
        if (!node.father.loopDetected) {
          collectFromAncestors(node.father);
        }
      }
      if (node.mother) {
        linkList.push({ source: node.id, target: node.mother.id, type: 'mother' });
        if (!node.mother.loopDetected) {
          collectFromAncestors(node.mother);
        }
      }
    };

    const collectFromDescendants = (node: PedigreeNode | undefined) => {
      if (!node || !node.children) return;
      for (const child of node.children) {
        if (!nodeMap.has(child.id)) {
          nodeMap.set(child.id, { ...child });
        }
        linkList.push({ source: node.id, target: child.id, type: child.parentType || 'child' });
        if (!child.loopDetected) {
          collectFromDescendants(child);
        }
      }
    };

    if (data.ancestors) {
      collectFromAncestors(data.ancestors);
    }
    if (data.descendants && data.ancestors) {
      collectFromDescendants({ ...data.ancestors, children: data.descendants } as PedigreeNode);
    }

    const centerX = width / 2;
    const centerY = height / 2;

    const nodeArray = Array.from(nodeMap.values()).map((n, i) => ({
      ...n,
      x: centerX + (Math.random() - 0.5) * 200,
      y: centerY + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
    }));

    setNodes(nodeArray);
    setLinks(linkList);
  }, [data]);

  useEffect(() => {
    if (nodes.length === 0 || !isSimulating) return;

    let animationId: number;
    let iterations = 0;
    const maxIterations = 300;

    const simulate = () => {
      const nodeList = [...nodes];
      const k = Math.sqrt((width * height) / nodeList.length) * 0.8;

      for (let i = 0; i < nodeList.length; i++) {
        for (let j = i + 1; j < nodeList.length; j++) {
          const dx = nodeList[j].x - nodeList[i].x;
          const dy = nodeList[j].y - nodeList[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (k * k) / dist;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodeList[i].vx -= fx;
          nodeList[i].vy -= fy;
          nodeList[j].vx += fx;
          nodeList[j].vy += fy;
        }
      }

      for (const link of links) {
        const source = nodeList.find(n => n.id === link.source);
        const target = nodeList.find(n => n.id === link.target);
        if (!source || !target) continue;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 120) * 0.05;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }

      const centerX = width / 2;
      const centerY = height / 2;
      for (const node of nodeList) {
        node.vx += (centerX - node.x) * 0.005;
        node.vy += (centerY - node.y) * 0.005;
      }

      for (const node of nodeList) {
        node.vx *= 0.9;
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(50, Math.min(width - 50, node.x));
        node.y = Math.max(50, Math.min(height - 50, node.y));
      }

      setNodes(nodeList);
      iterations++;

      if (iterations < maxIterations) {
        animationId = requestAnimationFrame(simulate);
      } else {
        setIsSimulating(false);
      }
    };

    animationId = requestAnimationFrame(simulate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [nodes.length, links, isSimulating]);

  const restartSimulation = () => {
    setIsSimulating(true);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <Button size="small" onClick={restartSimulation} disabled={isSimulating}>
          {isSimulating ? '模拟中...' : '重新模拟'}
        </Button>
      </div>
      <div
        style={{
          width: '100%',
          height: 500,
          overflow: 'hidden',
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          background: '#fafafa',
        }}
      >
        <svg ref={svgRef} width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
          {links.map((link: any, i: number) => {
            const source = nodes.find(n => n.id === link.source);
            const target = nodes.find(n => n.id === link.target);
            if (!source || !target) return null;
            const color = link.type === 'father' ? '#1890ff' : '#eb2f96';
            return (
              <line
                key={i}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={color}
                strokeWidth={2}
                strokeOpacity={0.5}
              />
            );
          })}
          {nodes.map((node: any) => {
            const colors = getNodeColor(node.gender, currentAnimalId === node.id, !!node.loopDetected);
            const statusColor = getStatusColor(node.status);
            const genderLabel = node.gender === 'male' ? '♂' : node.gender === 'female' ? '♀' : '?';
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onNodeClick?.(node)}
              >
                <rect
                  x={-NODE_WIDTH / 2}
                  y={-NODE_HEIGHT / 2}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={8}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={currentAnimalId === node.id ? 3 : 1.5}
                  strokeDasharray={colors.dash ? '6 3' : undefined}
                />
                <text x={0} y={-8} textAnchor="middle" fontSize="13" fontWeight={600} fill={colors.textColor}>
                  {node.name}
                  <tspan fontSize="11" fill="#999"> {genderLabel}</tspan>
                </text>
                <text x={0} y={12} textAnchor="middle" fontSize="11" fill="#666">
                  {node.species}
                </text>
                <circle cx={NODE_WIDTH / 2 - 12} cy={-NODE_HEIGHT / 2 + 12} r={5} fill={statusColor} />
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: '#999' }}>
        力导向布局 · 共 {nodes.length} 个节点 · {links.length} 条连线
      </div>
    </div>
  );
};

const AnimalList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [speciesFilter, setSpeciesFilter] = useState<string | undefined>();
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [cageList, setCageList] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<any>(null);
  const [detailAnimal, setDetailAnimal] = useState<any>(null);
  const [form] = Form.useForm();

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [splitAnimals, setSplitAnimals] = useState<any[]>([]);
  const [splitTargetCage, setSplitTargetCage] = useState('');
  const [splitReason, setSplitReason] = useState('');
  const [splitLoading, setSplitLoading] = useState(false);

  const [mergeModalVisible, setMergeModalVisible] = useState(false);
  const [mergeTargetCage, setMergeTargetCage] = useState('');
  const [mergeReason, setMergeReason] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeCageGroups, setMergeCageGroups] = useState<Record<string, any[]>>({});

  const [transferLogs, setTransferLogs] = useState<any[]>([]);
  const [detailTabKey, setDetailTabKey] = useState('basic');

  const [statusFlowRules, setStatusFlowRules] = useState<any[]>([]);
  const [statusChangeLogs, setStatusChangeLogs] = useState<any[]>([]);
  const [changeReason, setChangeReason] = useState('');
  const [statusChanged, setStatusChanged] = useState(false);

  const [pedigreeData, setPedigreeData] = useState<any>(null);
  const [pedigreeLoading, setPedigreeLoading] = useState(false);
  const [pedigreeGenerations, setPedigreeGenerations] = useState(3);
  const [pedigreeViewMode, setPedigreeViewMode] = useState<'tree' | 'force'>('tree');
  const [selectedPedigreeNode, setSelectedPedigreeNode] = useState<any>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasOpenedDetailRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await animalApi.getList({
        page, pageSize, keyword: keyword || undefined,
        status: statusFilter, species: speciesFilter,
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, statusFilter, speciesFilter]);

  const fetchSpecies = async () => {
    try {
      const res: any = await animalApi.getSpecies();
      setSpeciesList(Array.isArray(res) ? res : []);
    } catch {
      // handled
    }
  };

  const fetchCageList = async () => {
    try {
      const res: any = await animalApi.getList({ pageSize: 1000 });
      const cages = [...new Set((res?.list || []).map((a: any) => a.cageNumber).filter(Boolean))] as string[];
      setCageList(cages.sort());
    } catch {
      // handled
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchSpecies(); fetchCageList(); fetchStatusFlowRules(); }, []);

  useEffect(() => {
    const animalId = searchParams.get('animalId');
    if (animalId && !hasOpenedDetailRef.current) {
      hasOpenedDetailRef.current = true;
      const id = parseInt(animalId, 10);
      if (!isNaN(id)) {
        handleDetail(id);
      }
    }
  }, [searchParams]);

  const handleDetailClose = () => {
    setDetailVisible(false);
    if (searchParams.has('animalId')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('animalId');
      setSearchParams(newParams);
    }
  };

  const handleAdd = () => {
    setEditingAnimal(null);
    form.resetFields();
    form.setFieldsValue({ gender: 'unknown', status: 'healthy' });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingAnimal(record);
    form.setFieldsValue({
      ...record,
      birthDate: record.birthDate ? dayjs(record.birthDate) : null,
    });
    setChangeReason('');
    setStatusChanged(false);
    setModalVisible(true);
  };

  const handleDetail = async (id: number) => {
    try {
      const res: any = await animalApi.getDetail(id);
      setDetailAnimal(res);
      setDetailTabKey('basic');
      setTransferLogs([]);
      setStatusChangeLogs([]);
      setPedigreeData(null);
      setSelectedPedigreeNode(null);
      setDetailVisible(true);
      fetchTransferLogs(id);
      fetchStatusChangeLogs(id);
      fetchPedigree(id, pedigreeGenerations);
    } catch {
      // handled
    }
  };

  const fetchTransferLogs = async (animalId: number) => {
    try {
      const res: any = await animalApi.getAnimalTransferLogs(animalId);
      setTransferLogs(Array.isArray(res) ? res : []);
    } catch {
      // handled
    }
  };

  const fetchStatusFlowRules = async () => {
    try {
      const res: any = await animalApi.getStatusFlowRules();
      setStatusFlowRules(Array.isArray(res) ? res : []);
    } catch {
      // handled
    }
  };

  const fetchStatusChangeLogs = async (animalId: number) => {
    try {
      const res: any = await animalApi.getStatusChangeLogs(animalId);
      setStatusChangeLogs(Array.isArray(res) ? res : []);
    } catch {
      // handled
    }
  };

  const fetchPedigree = async (animalId: number, generations: number = 3) => {
    try {
      setPedigreeLoading(true);
      const res: any = await animalApi.getFullPedigree(animalId, generations);
      setPedigreeData(res);
    } catch {
      // handled
    } finally {
      setPedigreeLoading(false);
    }
  };

  const getAllowedNextStatuses = (currentStatus: string): string[] => {
    return statusFlowRules
      .filter((edge: any) => edge.from === currentStatus)
      .map((edge: any) => edge.to);
  };

  const handleDelete = async (id: number) => {
    try {
      await animalApi.delete(id);
      message.success('删除成功');
      fetchData();
      fetchCageList();
    } catch {
      // handled
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: any = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : undefined,
      };

      if (editingAnimal) {
        if (values.status && values.status !== editingAnimal.status) {
          if (!changeReason.trim()) {
            message.warning('请填写状态变更原因');
            return;
          }
          payload.statusChangeReason = changeReason;
        }
        await animalApi.update(editingAnimal.id, payload);
        message.success('更新成功');
      } else {
        await animalApi.create(payload);
        message.success('添加成功');
      }
      setModalVisible(false);
      fetchData();
      fetchSpecies();
      fetchCageList();
    } catch {
      // validation or api error
    }
  };

  const handleRowSelectionChange = (keys: React.Key[], rows: any[]) => {
    setSelectedRowKeys(keys as number[]);
    setSelectedRows(rows);
  };

  const handleOpenSplit = () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择动物');
      return;
    }
    const cages = [...new Set(selectedRows.map(r => r.cageNumber).filter(Boolean))];
    if (cages.length > 1) {
      message.warning('分笼操作请选择同一笼位的动物');
      return;
    }
    setSplitAnimals([...selectedRows]);
    setSplitTargetCage('');
    setSplitReason('');
    setSplitModalVisible(true);
  };

  const handleSplitRemove = (id: number) => {
    setSplitAnimals(prev => prev.filter(a => a.id !== id));
  };

  const handleSplitSubmit = async () => {
    if (splitAnimals.length === 0) {
      message.warning('请至少保留一只动物');
      return;
    }
    if (!splitTargetCage.trim()) {
      message.warning('请输入目标笼号');
      return;
    }
    try {
      setSplitLoading(true);
      const res: any = await animalApi.cageSplit({
        animalIds: splitAnimals.map(a => a.id),
        targetCage: splitTargetCage.trim(),
        reason: splitReason || undefined,
      });
      let msg = `成功将 ${splitAnimals.length} 只动物分笼到 ${splitTargetCage}`;
      if (res?.sourceCageEmpty) {
        msg += `（原笼位 ${res.sourceCage} 已为空）`;
      }
      message.success(msg);
      setSplitModalVisible(false);
      setSelectedRowKeys([]);
      setSelectedRows([]);
      fetchData();
      fetchCageList();
    } catch {
      // handled
    } finally {
      setSplitLoading(false);
    }
  };

  const handleOpenMerge = () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择动物');
      return;
    }
    const groups: Record<string, any[]> = {};
    for (const animal of selectedRows) {
      const cage = animal.cageNumber || '未分笼';
      if (!groups[cage]) groups[cage] = [];
      groups[cage].push(animal);
    }
    setMergeCageGroups(groups);
    setMergeTargetCage('');
    setMergeReason('');
    setMergeModalVisible(true);
  };

  const handleMergeSubmit = async () => {
    if (!mergeTargetCage.trim()) {
      message.warning('请输入目标笼号');
      return;
    }
    const speciesSet = new Set(selectedRows.map(r => r.species));
    if (speciesSet.size > 1) {
      Modal.confirm({
        title: '不同物种合笼警告',
        content: `选中的动物包含不同物种：${Array.from(speciesSet).join('、')}，确定要合并到同一笼位吗？`,
        okText: '确认合笼',
        cancelText: '取消',
        onOk: async () => {
          await doMerge(true);
        },
      });
    } else {
      await doMerge(false);
    }
  };

  const doMerge = async (confirmSpeciesMixed: boolean) => {
    try {
      setMergeLoading(true);
      const res: any = await animalApi.cageMerge({
        animalIds: selectedRows.map(r => r.id),
        targetCage: mergeTargetCage.trim(),
        reason: mergeReason || undefined,
        confirmSpeciesMixed,
      });
      if (res?.success) {
        let msg = `成功将 ${res.count} 只动物合笼到 ${mergeTargetCage}`;
        if (res?.emptyCages?.length > 0) {
          msg += `（空笼：${res.emptyCages.join('、')}）`;
        }
        message.success(msg);
        setMergeModalVisible(false);
        setSelectedRowKeys([]);
        setSelectedRows([]);
        fetchData();
        fetchCageList();
      }
    } catch {
      // handled
    } finally {
      setMergeLoading(false);
    }
  };

  const handleBatchExportZip = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择动物');
      return;
    }
    try {
      const blob = await animalArchiveApi.batchExportZip(selectedRowKeys);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = dayjs().format('YYYYMMDD_HHmmss');
      a.download = `动物档案批量导出_${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success('批量导出成功');
    } catch {
      message.error('导出失败，请稍后重试');
    }
  };

  const columns = [
    {
      title: '编号',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      fixed: 'left' as const,
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    { title: '物种', dataIndex: 'species', key: 'species', width: 80 },
    { title: '品系', dataIndex: 'breed', key: 'breed', ellipsis: true },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 70,
      render: (g: string) => genderOptions.find(o => o.value === g)?.label || g,
    },
    {
      title: '体重(g)',
      dataIndex: 'weight',
      key: 'weight',
      width: 90,
      render: (w: number) => w ? `${w}g` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const opt = statusOptions.find(o => o.value === status);
        return <Tag color={opt?.color}>{opt?.label || status}</Tag>;
      },
    },
    {
      title: '笼号',
      dataIndex: 'cageNumber',
      key: 'cageNumber',
      width: 90,
      render: (c: string) => c ? <Tag color="blue">{c}</Tag> : '-',
    },
    {
      title: '出生日期',
      dataIndex: 'birthDate',
      key: 'birthDate',
      width: 120,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record.id)} />
          </Tooltip>
          <Tooltip title="查看档案">
            <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => navigate(`/animals/${record.id}/archive`)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="确定删除该动物记录吗？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: handleRowSelectionChange,
  };

  const detailTabs = [
    {
      key: 'basic',
      label: '基本信息',
      children: detailAnimal && (
        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginTop: 16 }}>
          <Descriptions.Item label="编号">{detailAnimal.name}</Descriptions.Item>
          <Descriptions.Item label="物种">{detailAnimal.species}</Descriptions.Item>
          <Descriptions.Item label="品系">{detailAnimal.breed || '-'}</Descriptions.Item>
          <Descriptions.Item label="性别">{genderOptions.find(o => o.value === detailAnimal.gender)?.label}</Descriptions.Item>
          <Descriptions.Item label="体重">{detailAnimal.weight ? `${detailAnimal.weight}g` : '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusOptions.find(o => o.value === detailAnimal.status)?.color}>
              {statusOptions.find(o => o.value === detailAnimal.status)?.label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="笼号">{detailAnimal.cageNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="RFID">{detailAnimal.rfidTag || '-'}</Descriptions.Item>
          <Descriptions.Item label="出生日期">{detailAnimal.birthDate ? dayjs(detailAnimal.birthDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
          <Descriptions.Item label="来源">{detailAnimal.source || '-'}</Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>{detailAnimal.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(detailAnimal.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{dayjs(detailAnimal.updatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'cage-timeline',
      label: '笼位轨迹',
      children: (
        <div style={{ marginTop: 16 }}>
          {transferLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              暂无笼位变更记录
            </div>
          ) : (
            <Timeline
              mode="left"
              items={transferLogs.map((log: any) => {
                const opInfo = operationTypeMap[log.operationType] || { label: log.operationType, color: 'default' };
                return {
                  color: opInfo.color,
                  label: dayjs(log.operatedAt).format('YYYY-MM-DD HH:mm'),
                  children: (
                    <div>
                      <Space size={8}>
                        <Tag color={opInfo.color}>{opInfo.label}</Tag>
                        <Text strong>
                          {log.fromCage || '空'} → {log.toCage || '空'}
                        </Text>
                      </Space>
                      <div style={{ marginTop: 4, color: '#666', fontSize: 13 }}>
                        {log.reason && <span>原因：{log.reason}</span>}
                      </div>
                      <div style={{ marginTop: 2, color: '#999', fontSize: 12 }}>
                        操作人：{log.operator || '系统'}
                      </div>
                    </div>
                  ),
                };
              })}
            />
          )}
        </div>
      ),
    },
    {
      key: 'lifecycle',
      label: '生命周期',
      children: detailAnimal && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 12 }}>状态流转图</Title>
            <div style={{ background: '#fafafa', borderRadius: 8, padding: 20, overflow: 'auto' }}>
              <svg width="600" height="280" viewBox="0 0 600 280" style={{ display: 'block', margin: '0 auto' }}>
                {statusFlowRules.map((edge: any, i: number) => {
                  const positions: Record<string, { x: number; y: number }> = {
                    quarantine: { x: 100, y: 40 },
                    healthy: { x: 300, y: 40 },
                    in_experiment: { x: 500, y: 40 },
                    sick: { x: 200, y: 160 },
                    deceased: { x: 400, y: 220 },
                  };
                  const from = positions[edge.from];
                  const to = positions[edge.to];
                  if (!from || !to) return null;
                  const isReachable = edge.from === detailAnimal.status;
                  const dx = to.x - from.x;
                  const dy = to.y - from.y;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  if (len === 0) return null;
                  const nx = dx / len;
                  const ny = dy / len;
                  const startX = from.x + nx * 45;
                  const startY = from.y + ny * 22;
                  const endX = to.x - nx * 45;
                  const endY = to.y - ny * 22;
                  return (
                    <g key={i}>
                      <defs>
                        <marker id={`arrow-${i}`} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0 L0,6 L9,3 z" fill={isReachable ? '#52c41a' : '#bfbfbf'} />
                        </marker>
                      </defs>
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={isReachable ? '#52c41a' : '#bfbfbf'}
                        strokeWidth={isReachable ? 2 : 1.5}
                        markerEnd={`url(#arrow-${i})`}
                      />
                      {edge.label && (
                        <text
                          x={(startX + endX) / 2}
                          y={(startY + endY) / 2 - 4}
                          textAnchor="middle"
                          fontSize="11"
                          fill={isReachable ? '#52c41a' : '#999'}
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
                {[
                  { key: 'quarantine', label: '隔离中', x: 100, y: 40 },
                  { key: 'healthy', label: '健康', x: 300, y: 40 },
                  { key: 'in_experiment', label: '实验中', x: 500, y: 40 },
                  { key: 'sick', label: '患病', x: 200, y: 160 },
                  { key: 'deceased', label: '已死亡', x: 400, y: 220 },
                ].map((node) => {
                  const isCurrent = node.key === detailAnimal.status;
                  const allowedNext = getAllowedNextStatuses(detailAnimal.status);
                  const isReachable = allowedNext.includes(node.key);
                  let fillColor = '#fff';
                  let strokeColor = '#d9d9d9';
                  let textColor = '#666';
                  if (isCurrent) {
                    fillColor = '#e6f7ff';
                    strokeColor = '#1890ff';
                    textColor = '#1890ff';
                  } else if (isReachable) {
                    fillColor = '#f6ffed';
                    strokeColor = '#52c41a';
                    textColor = '#52c41a';
                  }
                  return (
                    <g key={node.key}>
                      <rect
                        x={node.x - 45}
                        y={node.y - 22}
                        width={90}
                        height={44}
                        rx={6}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isCurrent ? 2 : 1.5}
                      />
                      <text
                        x={node.x}
                        y={node.y + 5}
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight={isCurrent ? 600 : 400}
                        fill={textColor}
                      >
                        {node.label}
                        {isCurrent && ' (当前)'}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: '#888' }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#e6f7ff', border: '2px solid #1890ff', borderRadius: 2, marginRight: 4 }}></span>当前状态</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f6ffed', border: '1.5px solid #52c41a', borderRadius: 2, marginRight: 4 }}></span>可达状态</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#fff', border: '1.5px solid #d9d9d9', borderRadius: 2, marginRight: 4 }}></span>其他状态</span>
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <div>
            <Title level={5} style={{ marginBottom: 12 }}>状态变更历史</Title>
            {statusChangeLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无状态变更记录
              </div>
            ) : (
              <Timeline
                mode="left"
                items={statusChangeLogs.map((log: any) => {
                  const fromOpt = statusOptions.find(o => o.value === log.fromStatus);
                  const toOpt = statusOptions.find(o => o.value === log.toStatus);
                  return {
                    color: toOpt?.color || 'default',
                    label: dayjs(log.changedAt).format('YYYY-MM-DD HH:mm'),
                    children: (
                      <div>
                        <Space size={8} wrap>
                          <Tag color={fromOpt?.color}>{fromOpt?.label || log.fromStatus}</Tag>
                          <span style={{ color: '#999' }}>→</span>
                          <Tag color={toOpt?.color}>{toOpt?.label || log.toStatus}</Tag>
                        </Space>
                        <div style={{ marginTop: 6, color: '#666', fontSize: 13 }}>
                          {log.reason && <span>变更原因：{log.reason}</span>}
                        </div>
                        <div style={{ marginTop: 2, color: '#999', fontSize: 12 }}>
                          操作人：{log.operator || '系统'}
                          {log.experimentId && <span style={{ marginLeft: 12 }}>关联实验：#${log.experimentId}</span>}
                        </div>
                      </div>
                    ),
                  };
                })}
              />
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'pedigree',
      label: '谱系图',
      children: detailAnimal && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#666' }}>代数：</span>
              <Select
                value={pedigreeGenerations}
                onChange={(v) => {
                  setPedigreeGenerations(v);
                  if (detailAnimal) {
                    fetchPedigree(detailAnimal.id, v);
                  }
                }}
                style={{ width: 100 }}
                size="small"
              >
                <Option value={1}>1代</Option>
                <Option value={2}>2代</Option>
                <Option value={3}>3代</Option>
                <Option value={4}>4代</Option>
                <Option value={5}>5代</Option>
              </Select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#666' }}>视图：</span>
              <Select
                value={pedigreeViewMode}
                onChange={setPedigreeViewMode}
                style={{ width: 120 }}
                size="small"
              >
                <Option value="tree">树形图</Option>
                <Option value="force">力导向图</Option>
              </Select>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#888' }}>
              <span>
                <span style={{ display: 'inline-block', width: 12, height: 2, background: '#1890ff', marginRight: 4, verticalAlign: 'middle' }}></span>
                父系
              </span>
              <span>
                <span style={{ display: 'inline-block', width: 12, height: 2, background: '#eb2f96', marginRight: 4, verticalAlign: 'middle' }}></span>
                母系
              </span>
              <span>
                <span style={{ display: 'inline-block', width: 10, height: 10, border: '2px dashed #faad14', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }}></span>
                当前动物
              </span>
            </div>
          </div>

          {pedigreeLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
              加载谱系数据中...
            </div>
          ) : pedigreeData ? (
            pedigreeViewMode === 'tree' ? (
              <PedigreeTreeChart
                data={pedigreeData}
                onNodeClick={(node) => setSelectedPedigreeNode(node)}
                currentAnimalId={detailAnimal.id}
              />
            ) : (
              <PedigreeForceChart
                data={pedigreeData}
                onNodeClick={(node) => setSelectedPedigreeNode(node)}
                currentAnimalId={detailAnimal.id}
              />
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
              暂无谱系数据
            </div>
          )}

          {selectedPedigreeNode && (
            <Card
              size="small"
              style={{ marginTop: 16 }}
              title={<span style={{ fontWeight: 600 }}>选中节点详情</span>}
              extra={<Button size="small" type="link" onClick={() => setSelectedPedigreeNode(null)}>关闭</Button>}
            >
              <Descriptions column={3} size="small">
                <Descriptions.Item label="编号">{selectedPedigreeNode.name}</Descriptions.Item>
                <Descriptions.Item label="物种">{selectedPedigreeNode.species}</Descriptions.Item>
                <Descriptions.Item label="性别">
                  {genderOptions.find((o: any) => o.value === selectedPedigreeNode.gender)?.label}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusOptions.find((o: any) => o.value === selectedPedigreeNode.status)?.color}>
                    {statusOptions.find((o: any) => o.value === selectedPedigreeNode.status)?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="品系">{selectedPedigreeNode.breed || '-'}</Descriptions.Item>
                <Descriptions.Item label="笼号">{selectedPedigreeNode.cageNumber || '-'}</Descriptions.Item>
              </Descriptions>
              {selectedPedigreeNode.loopDetected && (
                <Alert
                  type="warning"
                  showIcon
                  message="循环引用检测"
                  description="该节点在谱系中存在循环引用，已停止递归展开以避免无限循环。"
                  style={{ marginTop: 8 }}
                />
              )}
            </Card>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={<span style={{ fontWeight: 600 }}>动物信息管理</span>}
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <>
                <Button icon={<SwapOutlined />} onClick={handleOpenSplit}>
                  分笼 ({selectedRowKeys.length})
                </Button>
                <Button type="primary" icon={<MergeCellsOutlined />} onClick={handleOpenMerge}>
                  合笼 ({selectedRowKeys.length})
                </Button>
                <Button icon={<FileZipOutlined />} onClick={handleBatchExportZip}>
                  导出档案 ({selectedRowKeys.length})
                </Button>
                <Divider type="vertical" />
              </>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加动物
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索动物编号"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => { setPage(1); fetchData(); }}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="物种筛选"
            allowClear
            style={{ width: 140 }}
            value={speciesFilter}
            onChange={(v) => { setSpeciesFilter(v); setPage(1); }}
          >
            {speciesList.map(s => <Option key={s} value={s}>{s}</Option>)}
          </Select>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
          >
            {statusOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setStatusFilter(undefined); setSpeciesFilter(undefined); setPage(1); }}>
            重置
          </Button>
        </div>

        <Table
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          rowSelection={rowSelection}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title={editingAnimal ? '编辑动物信息' : '添加动物'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="name" label="动物编号" rules={[{ required: true, message: '请输入动物编号' }]}>
              <Input placeholder="如 M-001" />
            </Form.Item>
            <Form.Item name="species" label="物种" rules={[{ required: true, message: '请输入物种' }]}>
              <Input placeholder="如 小鼠" />
            </Form.Item>
            <Form.Item name="breed" label="品系/品种">
              <Input placeholder="如 C57BL/6" />
            </Form.Item>
            <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
              <Select>
                {genderOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="birthDate" label="出生日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="weight" label="体重(g)">
              <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
            </Form.Item>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true }]}
            >
              <Select
                onChange={(value) => {
                  if (editingAnimal && value !== editingAnimal.status) {
                    setStatusChanged(true);
                  } else {
                    setStatusChanged(false);
                    setChangeReason('');
                  }
                }}
              >
                {editingAnimal
                  ? (() => {
                      const allowed = getAllowedNextStatuses(editingAnimal.status);
                      const options = statusOptions.filter(
                        o => o.value === editingAnimal.status || allowed.includes(o.value)
                      );
                      return options.map(o => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                          {o.value === editingAnimal.status ? ' (当前)' : ''}
                        </Option>
                      ));
                    })()
                  : statusOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)
                }
              </Select>
            </Form.Item>
            {editingAnimal && statusChanged && (
              <Form.Item
                label="变更原因"
                required
                style={{ gridColumn: '1 / -1' }}
              >
                <TextArea
                  rows={2}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="请填写状态变更的原因"
                />
              </Form.Item>
            )}
            <Form.Item name="cageNumber" label="笼号">
              <Input placeholder="如 A-101" />
            </Form.Item>
            <Form.Item name="rfidTag" label="RFID标签">
              <Input placeholder="RFID标签号" />
            </Form.Item>
            <Form.Item name="source" label="来源">
              <Input placeholder="动物来源机构" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="备注">
            <TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>动物详细信息</span>
            {detailAnimal && (
              <Button
                size="small"
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => {
                  handleDetailClose();
                  navigate(`/animals/${detailAnimal.id}/archive`);
                }}
              >
                查看完整档案
              </Button>
            )}
          </div>
        }
        open={detailVisible}
        onCancel={handleDetailClose}
        footer={null}
        width={750}
        destroyOnClose
      >
        <Tabs
          activeKey={detailTabKey}
          onChange={setDetailTabKey}
          items={detailTabs}
        />
      </Modal>

      <Modal
        title="分笼操作"
        open={splitModalVisible}
        onOk={handleSplitSubmit}
        onCancel={() => setSplitModalVisible(false)}
        width={720}
        okText="确认分笼"
        cancelText="取消"
        confirmLoading={splitLoading}
        destroyOnClose
      >
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <div style={{ flex: 1, border: '1px solid #e8e8e8', borderRadius: 8, padding: 12, maxHeight: 360, overflow: 'auto' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>已选动物（{splitAnimals.length}只）</div>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>点击 × 可取消选择</div>
            <Space size={[8, 8]} wrap>
              {splitAnimals.map(a => (
                <Tag
                  key={a.id}
                  color="blue"
                  closable
                  onClose={(e) => { e.preventDefault(); handleSplitRemove(a.id); }}
                  style={{ padding: '4px 8px' }}
                >
                  {a.name} ({a.species})
                </Tag>
              ))}
            </Space>
          </div>
          <div style={{ width: 260, border: '1px solid #e8e8e8', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>目标笼号</div>
            <AutoComplete
              placeholder="输入或选择笼号"
              value={splitTargetCage}
              onChange={setSplitTargetCage}
              style={{ width: '100%' }}
              options={cageList.map(c => ({ value: c }))}
              allowClear
            />
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>操作原因</div>
              <TextArea
                rows={4}
                value={splitReason}
                onChange={(e) => setSplitReason(e.target.value)}
                placeholder="请输入分笼原因（可选）"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title="合笼操作"
        open={mergeModalVisible}
        onOk={handleMergeSubmit}
        onCancel={() => setMergeModalVisible(false)}
        width={720}
        okText="确认合笼"
        cancelText="取消"
        confirmLoading={mergeLoading}
        destroyOnClose
      >
        <div style={{ marginTop: 16 }}>
          <Alert
            message={`选中 ${selectedRows.length} 只动物，来自 ${Object.keys(mergeCageGroups).length} 个笼位`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, maxHeight: 300, overflow: 'auto' }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>按笼位分组</div>
              {Object.entries(mergeCageGroups).map(([cage, animals]) => (
                <div key={cage} style={{ marginBottom: 12, padding: 10, background: '#fafafa', borderRadius: 6 }}>
                  <div style={{ fontWeight: 500, marginBottom: 6 }}>
                    <Tag color="blue">{cage}</Tag>
                    <span style={{ color: '#888', fontSize: 12 }}>共 {animals.length} 只</span>
                  </div>
                  <Space size={[6, 6]} wrap>
                    {animals.map(a => (
                      <Tag key={a.id}>{a.name}</Tag>
                    ))}
                  </Space>
                </div>
              ))}
            </div>

            <div style={{ width: 260 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>目标笼号</div>
            <AutoComplete
              placeholder="输入或选择笼号"
              value={mergeTargetCage}
              onChange={setMergeTargetCage}
              style={{ width: '100%' }}
              options={cageList.map(c => ({ value: c }))}
              allowClear
            />
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>操作原因</div>
                <TextArea
                  rows={4}
                  value={mergeReason}
                  onChange={(e) => setMergeReason(e.target.value)}
                  placeholder="请输入合笼原因（可选）"
                />
              </div>
              <div style={{ marginTop: 12, color: '#faad14', fontSize: 12 }}>
                提示：不同物种合笼将弹出二次确认
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AnimalList;
