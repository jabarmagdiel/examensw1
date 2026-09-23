export type DataType = 
  | 'INTEGER' 
  | 'BIGINT' 
  | 'VARCHAR' 
  | 'TEXT' 
  | 'BOOLEAN' 
  | 'DATE' 
  | 'TIMESTAMP' 
  | 'DECIMAL' 
  | 'FLOAT';

export interface Attribute {
  id: string;
  name: string;
  type: DataType;
  length?: number;
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
  isNullable: boolean;
  isUnique?: boolean;
  fkReference?: {
    entityId: string;
    attributeId: string;
  };
}

export interface EntityMethod {
  id: string;
  name: string;
  returnType: string;
  visibility: 'public' | 'private' | 'protected';
  parameters?: string[];
}

export interface Entity {
  id: string;
  name: string;
  tableName?: string;
  x: number;
  y: number;
  color?: string;
  attributes: Attribute[];
  methods?: EntityMethod[];
}

export type Cardinality = '1:1' | '1:N' | 'N:M';

export type RelationshipType = 
  | 'association' 
  | 'aggregation' 
  | 'composition' 
  | 'inheritance' 
  | 'dependency' 
  | 'realization';

export interface Relationship {
  id: string;
  name: string;
  sourceEntityId: string;
  targetEntityId: string;
  cardinality: Cardinality;
  type?: RelationshipType;
  sourceRole?: string;
  targetRole?: string;
  isIdentifying?: boolean;
  foreignKeyAttributeName?: string;
}

export interface FunctionalDependency {
  id: string;
  determinant: string[]; // Atributos a la izquierda (X)
  dependent: string[];   // Atributos a la derecha (Y)
}

export interface NormalizationViolation {
  normalForm: '1FN' | '2FN' | '3FN' | 'BCNF';
  entityName: string;
  violationDescription: string;
  violatingFD?: FunctionalDependency;
  recommendation: string;
  proposedDecomposition?: {
    newEntities: {
      name: string;
      attributes: string[];
      primaryKey: string[];
    }[];
  };
}

export interface NormalizationReport {
  candidateKeys: string[][];
  primaryKey: string[];
  is1FN: boolean;
  is2FN: boolean;
  is3FN: boolean;
  isBCNF: boolean;
  violations: NormalizationViolation[];
  explanations: string[];
}

export type SystemRole = 'Analista' | 'Diseñador' | 'Implementador' | 'Administrador';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  color: string;
  status: 'Activo' | 'Inactivo';
  assignedProjects: string[];
  createdAt: number;
  lastLogin?: number;
}

export interface UserPresence {
  id: string;
  name: string;
  role: SystemRole;
  color: string;
  cursor?: { x: number; y: number };
  selectedEntityId?: string | null;
  lastActive: number;
  status: 'online' | 'offline' | 'syncing';
}

export interface DiagramModel {
  id: string;
  name: string;
  description?: string;
  folderId?: string;
  client?: string;
  status?: 'Diseño' | 'Normalización' | 'Implementación' | 'Producción';
  entities: Entity[];
  relationships: Relationship[];
  functionalDependencies: FunctionalDependency[];
  updatedAt: number;
  version: number;
}

export interface ProjectFolder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: number;
}

export interface VoiceCommandQueueItem {
  id: string;
  transcript: string;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
  resultSummary?: string;
}
