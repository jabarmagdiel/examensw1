import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppHeader } from './components/Header/AppHeader';
import { DiagramCanvas } from './components/Canvas/DiagramCanvas';
import { NormalizationModal } from './components/Normalization/NormalizationModal';
import { AIChatDrawer } from './components/AI/AIChatDrawer';
import { ContextualAIAssistant } from './components/AI/ContextualAIAssistant';
import { VoiceAssistantModal } from './components/AI/VoiceAssistantModal';
import { DiagramPhotoScanner } from './components/AI/DiagramPhotoScanner';
import { ArchitectModal } from './components/ExportImport/ArchitectModal';
import { CodeExportModal } from './components/ExportImport/CodeExportModal';
import { BackendCodeViewerModal } from './components/BackendViewer/BackendCodeViewerModal';
import { LiveTestClientModal } from './components/LiveFrontend/LiveTestClientModal';
import { MultiSessionSimulator } from './components/Collaboration/MultiSessionSimulator';
import { EditEntityModal } from './components/Canvas/EditEntityModal';
import { LoginModal } from './components/Auth/LoginModal';
import { LoginPage } from './components/Auth/LoginPage';
import { ModuleSidebar, ActiveModule } from './components/Navigation/ModuleSidebar';
import { ProjectManagerView } from './components/Projects/ProjectManagerView';
import { UserManagerView } from './components/Users/UserManagerView';
import { ReportsView } from './components/Reports/ReportsView';
import { MappingView } from './components/Mapping/MappingView';
import { DashboardView } from './components/Dashboard/DashboardView';
import { MobileAppView } from './components/Mobile/MobileAppView';
import { DatabaseManagerModal } from './components/Database/DatabaseManagerModal';
import { DiagramModel, Entity, FunctionalDependency, ProjectFolder, Relationship, SystemRole, SystemUser, UserPresence } from './types/case';
import { processNaturalLanguagePrompt, getOfflineVoiceQueue } from './services/aiAssistant';

// Proyectos iniciales de la empresa de software
const DOMAIN_VETERINARIA = processNaturalLanguagePrompt('veterinaria');
const DOMAIN_FARMACIA = processNaturalLanguagePrompt('farmacia');
const DOMAIN_ECOMMERCE = processNaturalLanguagePrompt('tienda');

const INITIAL_FOLDERS: ProjectFolder[] = [
  { id: 'f_1', name: 'Sector Salud & Veterinarias', color: '#3b82f6', createdAt: Date.now() },
  { id: 'f_2', name: 'Sector Farmacéutico & Retail', color: '#10b981', createdAt: Date.now() },
  { id: 'f_3', name: 'Sector Financiero & ERP', color: '#a855f7', createdAt: Date.now() }
];

const INITIAL_PROJECTS: DiagramModel[] = [
  {
    id: 'proj_veterinaria_1',
    name: 'Sistema de Gestión Veterinaria',
    client: 'Clínica Veterinaria San Roque',
    folderId: 'f_1',
    status: 'Diseño',
    entities: DOMAIN_VETERINARIA.entities,
    relationships: DOMAIN_VETERINARIA.relationships,
    functionalDependencies: DOMAIN_VETERINARIA.functionalDependencies,
    updatedAt: Date.now(),
    version: 1
  },
  {
    id: 'proj_farmacia_1',
    name: 'Sistema de Farmacia & Lotes',
    client: 'Farmacias del Sur S.A.',
    folderId: 'f_2',
    status: 'Normalización',
    entities: DOMAIN_FARMACIA.entities,
    relationships: DOMAIN_FARMACIA.relationships,
    functionalDependencies: DOMAIN_FARMACIA.functionalDependencies,
    updatedAt: Date.now() - 3600000,
    version: 1
  },
  {
    id: 'proj_ecommerce_1',
    name: 'Plataforma E-Commerce Multitienda',
    client: 'Retail Express Corp',
    folderId: 'f_2',
    status: 'Implementación',
    entities: DOMAIN_ECOMMERCE.entities,
    relationships: DOMAIN_ECOMMERCE.relationships,
    functionalDependencies: DOMAIN_ECOMMERCE.functionalDependencies,
    updatedAt: Date.now() - 7200000,
    version: 2
  }
];

const INITIAL_COLLABORATORS: UserPresence[] = [
  {
    id: 'user_analista',
    name: 'Migue',
    role: 'Analista',
    color: '#3b82f6',
    lastActive: Date.now(),
    status: 'online'
  }
];

const INITIAL_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'user_analista',
    name: 'Migue',
    email: 'migue.analista@case-enterprise.com',
    role: 'Analista',
    color: '#3b82f6',
    status: 'Activo',
    assignedProjects: ['proj_veterinaria_1', 'proj_farmacia_1', 'proj_ecommerce_1'],
    createdAt: Date.now() - 86400000 * 5,
    lastLogin: Date.now()
  },
  {
    id: 'user_disenador',
    name: 'Sofía',
    email: 'sofia.disenadora@case-enterprise.com',
    role: 'Diseñador',
    color: '#a855f7',
    status: 'Activo',
    assignedProjects: ['proj_veterinaria_1', 'proj_farmacia_1'],
    createdAt: Date.now() - 86400000 * 4,
    lastLogin: Date.now() - 3600000
  },
  {
    id: 'user_implementador',
    name: 'Alex',
    email: 'alex.dev@case-enterprise.com',
    role: 'Implementador',
    color: '#10b981',
    status: 'Activo',
    assignedProjects: ['proj_veterinaria_1', 'proj_ecommerce_1'],
    createdAt: Date.now() - 86400000 * 3,
    lastLogin: Date.now() - 7200000
  },
  {
    id: 'user_admin',
    name: 'Administrador Sistema',
    email: 'admin@case-enterprise.com',
    role: 'Administrador',
    color: '#f59e0b',
    status: 'Activo',
    assignedProjects: ['proj_veterinaria_1', 'proj_farmacia_1', 'proj_ecommerce_1'],
    createdAt: Date.now() - 86400000 * 10,
    lastLogin: Date.now() - 1800000
  }
];

export default function App() {
  // Proyectos y Carpetas Empresariales con Persistencia LocalStorage
  const [folders, setFolders] = useState<ProjectFolder[]>(() => {
    try {
      const saved = localStorage.getItem('case_ai_folders');
      return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
    } catch {
      return INITIAL_FOLDERS;
    }
  });

  const [projects, setProjects] = useState<DiagramModel[]>(() => {
    try {
      const saved = localStorage.getItem('case_ai_projects');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('case_ai_active_project_id');
      return saved || 'proj_veterinaria_1';
    } catch {
      return 'proj_veterinaria_1';
    }
  });

  // Gestión de Usuarios Empresariales con Persistencia LocalStorage
  const [users, setUsers] = useState<SystemUser[]>(() => {
    try {
      const saved = localStorage.getItem('case_ai_users');
      return saved ? JSON.parse(saved) : INITIAL_SYSTEM_USERS;
    } catch {
      return INITIAL_SYSTEM_USERS;
    }
  });

  // Módulo Activo: Por defecto Panel de Control (Dashboard) para mostrar el resumen ejecutivo
  const [activeModule, setActiveModule] = useState<ActiveModule>(() => {
    try {
      const saved = localStorage.getItem('case_ai_active_module');
      if (saved && ['dashboard', 'projects', 'users', 'reports', 'mapping', 'canvas'].includes(saved)) {
        return saved as ActiveModule;
      }
      return 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  // Guardar cambios en LocalStorage automáticamente
  useEffect(() => {
    try {
      localStorage.setItem('case_ai_folders', JSON.stringify(folders));
    } catch (e) {}
  }, [folders]);

  useEffect(() => {
    try {
      localStorage.setItem('case_ai_projects', JSON.stringify(projects));
    } catch (e) {}
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('case_ai_users', JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('case_ai_active_project_id', activeProjectId);
    } catch (e) {}
  }, [activeProjectId]);

  useEffect(() => {
    try {
      localStorage.setItem('case_ai_active_module', activeModule);
    } catch (e) {}
  }, [activeModule]);

  // Vistas del Canvas
  const [currentView, setCurrentView] = useState<'conceptual' | 'logical' | 'physical' | 'uml'>('conceptual');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

  // Colaboradores y Presencia
  const [collaborators, setCollaborators] = useState<UserPresence[]>(INITIAL_COLLABORATORS);
  const [currentUser, setCurrentUser] = useState<UserPresence>(INITIAL_COLLABORATORS[0]);
  const [isSimulatingActive, setIsSimulatingActive] = useState(false);
  const simulationIntervalRef = useRef<any>(null);

  // Modales
  const [isNormalizerOpen, setIsNormalizerOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isPhotoScannerOpen, setIsPhotoScannerOpen] = useState(false);
  const [isArchitectModalOpen, setIsArchitectModalOpen] = useState(false);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState(false);
  const [isLiveFrontendOpen, setIsLiveFrontendOpen] = useState(false);
  const [isMultiSessionOpen, setIsMultiSessionOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isDatabaseManagerOpen, setIsDatabaseManagerOpen] = useState(false);

  // Contador de comandos offline en cola
  const [offlineVoiceQueueCount, setOfflineVoiceQueueCount] = useState<number>(getOfflineVoiceQueue().length);

  // Proyecto activo actual
  const currentModel = projects.find(p => p.id === activeProjectId) || projects[0] || INITIAL_PROJECTS[0];

  // Cargar estado inicial del Workspace compartido desde la API
  useEffect(() => {
    const API_BASE = (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port !== '3001') ? 'http://localhost:3001' : '';
    fetch(`${API_BASE}/api/workspace`)
      .then(r => r.json())
      .then(data => {
        if (data.folders && data.folders.length > 0) {
          setFolders(data.folders);
        }
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
        }
      })
      .catch(() => {});
  }, []);

  // Socket.io Connection
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    try {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 
        (window.location.hostname === 'localhost' && window.location.port !== '3001' ? 'http://localhost:3001' : '/');
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('workspace_get');
        if (currentModel) {
          socket.emit('join_project', { roomId: currentModel.id, user: currentUser });
        }
      });

      // Sincronización completa de carpetas y proyectos
      socket.on('workspace_sync', ({ folders: remoteFolders, projects: remoteProjects }: any) => {
        if (remoteFolders && remoteFolders.length > 0) {
          setFolders(remoteFolders);
        }
        if (remoteProjects && remoteProjects.length > 0) {
          setProjects(remoteProjects);
        }
      });

      // Eventos de Carpetas en tiempo real entre colaboradores
      socket.on('folder_created', (newFolder: ProjectFolder) => {
        if (newFolder) {
          setFolders(prev => prev.some(f => f.id === newFolder.id) ? prev : [...prev, newFolder]);
        }
      });

      socket.on('folder_deleted', (folderId: string) => {
        if (folderId) {
          setFolders(prev => prev.filter(f => f.id !== folderId));
        }
      });

      // Eventos de Proyectos en tiempo real entre colaboradores
      socket.on('project_created', (newProj: DiagramModel) => {
        if (newProj) {
          setProjects(prev => prev.some(p => p.id === newProj.id) ? prev : [...prev, newProj]);
        }
      });

      socket.on('project_updated', (updatedProj: DiagramModel) => {
        if (updatedProj) {
          setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
        }
      });

      socket.on('project_deleted', (deletedId: string) => {
        if (deletedId) {
          setProjects(prev => prev.filter(p => p.id !== deletedId));
        }
      });

      socket.on('users_updated', (updatedUsers: UserPresence[]) => {
        if (Array.isArray(updatedUsers)) {
          setCollaborators(updatedUsers);
        }
      });

      socket.on('user_cursor', ({ userId, cursor }: any) => {
        setCollaborators(prev => prev.map(u => u.id === userId ? { ...u, cursor } : u));
      });

      socket.on('model_updated', ({ model: remoteModel }: any) => {
        if (remoteModel) {
          setProjects(prev => prev.map(p => p.id === remoteModel.id ? remoteModel : p));
        }
      });

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.warn('Servidor Socket no disponible, operando en modo local reactivo.');
    }
  }, []);

  // Actualizar sala activa del socket al cambiar de proyecto
  useEffect(() => {
    if (socketRef.current?.connected && currentModel) {
      socketRef.current.emit('join_project', { roomId: currentModel.id, user: currentUser });
    }
  }, [activeProjectId, currentUser]);

  // Actualizar el modelo activo en la lista de proyectos y emitir por websocket
  const broadcastModelChange = (updatedModel: DiagramModel, changeType: string) => {
    setProjects(prev => prev.map(p => p.id === updatedModel.id ? updatedModel : p));
    if (socketRef.current?.connected) {
      socketRef.current.emit('model_change', {
        roomId: updatedModel.id,
        model: updatedModel,
        changeType,
        sourceUserId: currentUser.id
      });
      socketRef.current.emit('project_update', updatedModel);
    }
  };

  // Movimiento de cursor propio
  const handleCursorMove = (x: number, y: number) => {
    if (socketRef.current?.connected && currentModel) {
      socketRef.current.emit('cursor_move', {
        roomId: currentModel.id,
        cursor: { x, y },
        selectedEntityId
      });
    }
  };

  // Simulación concurrente en vivo
  const handleToggleConcurrentActivity = () => {
    if (isSimulatingActive) {
      clearInterval(simulationIntervalRef.current);
      setIsSimulatingActive(false);
    } else {
      setIsSimulatingActive(true);
      simulationIntervalRef.current = setInterval(() => {
        setCollaborators(prev => prev.map(user => {
          if (user.id === currentUser.id) return user;
          const currentX = user.cursor?.x || 200;
          const currentY = user.cursor?.y || 200;
          const deltaX = (Math.random() - 0.5) * 60;
          const deltaY = (Math.random() - 0.5) * 40;
          return {
            ...user,
            cursor: {
              x: Math.max(100, Math.min(900, currentX + deltaX)),
              y: Math.max(80, Math.min(600, currentY + deltaY))
            },
            lastActive: Date.now()
          };
        }));
      }, 600);
    }
  };

  // Manejo de Proyectos y Carpetas con difusión en vivo
  const handleCreateFolder = (name: string, color: string = '#3b82f6') => {
    const newFolder: ProjectFolder = {
      id: `f_${Date.now()}`,
      name,
      color,
      createdAt: Date.now()
    };
    setFolders(prev => [...prev, newFolder]);
    if (socketRef.current?.connected) {
      socketRef.current.emit('folder_create', newFolder);
    }
  };

  const handleCreateProject = (
    folderId: string,
    name: string,
    client: string,
    template: 'veterinaria' | 'farmacia' | 'ecommerce' | 'blank'
  ) => {
    let domainData: { entities: Entity[]; relationships: Relationship[]; functionalDependencies: FunctionalDependency[] } = {
      entities: [],
      relationships: [],
      functionalDependencies: []
    };
    if (template === 'veterinaria') domainData = DOMAIN_VETERINARIA;
    else if (template === 'farmacia') domainData = DOMAIN_FARMACIA;
    else if (template === 'ecommerce') domainData = DOMAIN_ECOMMERCE;

    const newProject: DiagramModel = {
      id: `proj_${Date.now()}`,
      name,
      client,
      folderId,
      status: 'Diseño',
      entities: domainData.entities as any,
      relationships: domainData.relationships as any,
      functionalDependencies: domainData.functionalDependencies as any,
      updatedAt: Date.now(),
      version: 1
    };

    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setActiveModule('canvas');
    if (socketRef.current?.connected) {
      socketRef.current.emit('project_create', newProject);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (activeProjectId === projectId) {
      const remaining = projects.filter(p => p.id !== projectId);
      if (remaining.length > 0) setActiveProjectId(remaining[0].id);
    }
    if (socketRef.current?.connected) {
      socketRef.current.emit('project_delete', projectId);
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setProjects(prev => prev.map(p => p.folderId === folderId ? { ...p, folderId: 'f_1' } : p));
    if (socketRef.current?.connected) {
      socketRef.current.emit('folder_delete', folderId);
    }
  };

  // Modificador de entidad por arrastre
  const handleUpdateEntityPosition = (entityId: string, x: number, y: number) => {
    const updatedEntities = currentModel.entities.map(e => e.id === entityId ? { ...e, x, y } : e);
    broadcastModelChange({ ...currentModel, entities: updatedEntities, updatedAt: Date.now() }, 'move_entity');
  };

  const handleAddEntity = () => {
    const entityIndex = currentModel.entities.length + 1;
    const newName = `NuevaEntidad_${entityIndex}`;
    const newEntity: Entity = {
      id: `ent_${Date.now()}`,
      name: newName,
      tableName: newName.toLowerCase() + 's',
      x: 120 + (currentModel.entities.length % 3) * 280,
      y: 120 + Math.floor(currentModel.entities.length / 3) * 220,
      attributes: [
        { id: `a_${Date.now()}_1`, name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
        { id: `a_${Date.now()}_2`, name: 'nombre', type: 'VARCHAR', length: 100, isPrimaryKey: false, isNullable: false }
      ]
    };

    broadcastModelChange({
      ...currentModel,
      entities: [...currentModel.entities, newEntity],
      updatedAt: Date.now()
    }, 'add_entity');
    setSelectedEntityId(newEntity.id);
  };

  const handleSaveRelationshipWithFK = (relData: {
    id?: string;
    sourceEntityId: string;
    targetEntityId: string;
    cardinality: any;
    name: string;
    foreignKeyName: string;
    createForeignKeyAttribute: boolean;
  }) => {
    let updatedRelationships = [...currentModel.relationships];
    let updatedEntities = currentModel.entities.map(e => ({
      ...e,
      attributes: [...e.attributes]
    }));

    if (relData.id) {
      updatedRelationships = updatedRelationships.map(r => r.id === relData.id ? {
        ...r,
        name: relData.name,
        cardinality: relData.cardinality,
        foreignKeyAttributeName: relData.foreignKeyName
      } : r);
    } else {
      const newRel: Relationship = {
        id: `rel_${Date.now()}`,
        name: relData.name,
        sourceEntityId: relData.sourceEntityId,
        targetEntityId: relData.targetEntityId,
        cardinality: relData.cardinality,
        foreignKeyAttributeName: relData.foreignKeyName
      };
      updatedRelationships.push(newRel);
    }

    if (relData.createForeignKeyAttribute && relData.cardinality !== 'N:M') {
      const target = updatedEntities.find(e => e.id === relData.targetEntityId);
      if (target) {
        const hasAttr = target.attributes.some(a => a.name.toLowerCase() === relData.foreignKeyName.toLowerCase());
        if (!hasAttr) {
          target.attributes.push({
            id: `fk_${Date.now()}`,
            name: relData.foreignKeyName,
            type: 'BIGINT',
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false
          });
        } else {
          target.attributes = target.attributes.map(a => 
            a.name.toLowerCase() === relData.foreignKeyName.toLowerCase() 
              ? { ...a, isForeignKey: true } 
              : a
          );
        }
      }
    }

    broadcastModelChange({
      ...currentModel,
      relationships: updatedRelationships,
      entities: updatedEntities,
      updatedAt: Date.now()
    }, 'save_relationship_fk');
  };

  const handleDeleteRelationship = (relId: string) => {
    const updatedRelationships = currentModel.relationships.filter(r => r.id !== relId);
    broadcastModelChange({
      ...currentModel,
      relationships: updatedRelationships,
      updatedAt: Date.now()
    }, 'delete_relationship');
  };

  const handleSaveEntity = (updatedEntity: Entity) => {
    const updatedEntities = currentModel.entities.map(e => e.id === updatedEntity.id ? updatedEntity : e);
    broadcastModelChange({
      ...currentModel,
      entities: updatedEntities,
      updatedAt: Date.now()
    }, 'edit_entity');
  };

  const handleDeleteEntity = (entityId: string) => {
    const updatedEntities = currentModel.entities.filter(e => e.id !== entityId);
    const updatedRels = currentModel.relationships.filter(r => r.sourceEntityId !== entityId && r.targetEntityId !== entityId);
    broadcastModelChange({
      ...currentModel,
      entities: updatedEntities,
      relationships: updatedRels,
      updatedAt: Date.now()
    }, 'delete_entity');
  };

  const handleApplyDecomposition = (originalEntityId: string, newEntities: Entity[]) => {
    const remainingEntities = currentModel.entities.filter(e => e.id !== originalEntityId);
    broadcastModelChange({
      ...currentModel,
      entities: [...remainingEntities, ...newEntities],
      updatedAt: Date.now()
    }, 'normalize_decomposition');
  };

  const handleApplyAIChanges = (newEntities: Entity[], newRelationships: Relationship[], summary: string) => {
    broadcastModelChange({
      ...currentModel,
      entities: newEntities,
      relationships: newRelationships,
      updatedAt: Date.now()
    }, 'ai_model_generation');
  };

  const handleImportArchitectModel = (newModel: DiagramModel, message: string) => {
    broadcastModelChange(newModel, 'import_architect');
  };

  // Manejadores de Gestión de Usuarios y Roles PUDS
  const handleCreateUser = (newUserData: Omit<SystemUser, 'id' | 'createdAt'>) => {
    const newUser: SystemUser = {
      ...newUserData,
      id: `usr_${Date.now()}`,
      createdAt: Date.now(),
      lastLogin: Date.now()
    };
    setUsers(prev => [newUser, ...prev]);

    setCollaborators(prev => {
      if (prev.some(c => c.id === newUser.id)) return prev;
      return [...prev, {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        color: newUser.color,
        status: 'online',
        lastActive: Date.now(),
        cursor: { x: 320, y: 280 }
      }];
    });
  };

  const handleUpdateUser = (userId: string, updatedData: Partial<SystemUser>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedData } : u));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({
        ...prev,
        name: updatedData.name ?? prev.name,
        role: updatedData.role ?? prev.role,
        color: updatedData.color ?? prev.color
      }));
    }
    setCollaborators(prev => prev.map(c => c.id === userId ? {
      ...c,
      name: updatedData.name ?? c.name,
      role: updatedData.role ?? c.role,
      color: updatedData.color ?? c.color
    } : c));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setCollaborators(prev => prev.filter(c => c.id !== userId));
  };

  const handleSwitchSessionUser = (user: SystemUser) => {
    const presence: UserPresence = {
      id: user.id,
      name: user.name,
      role: user.role,
      color: user.color,
      status: 'online',
      lastActive: Date.now(),
      cursor: { x: 350, y: 250 }
    };
    setCurrentUser(presence);
    setCollaborators(prev => {
      const exists = prev.some(c => c.id === user.id);
      if (exists) {
        return prev.map(c => c.id === user.id ? presence : c);
      }
      return [...prev, presence];
    });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, lastLogin: Date.now() } : u));
  };

  // Estado de Autenticación Empresarial
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('case_ai_authenticated');
      return savedAuth === 'true';
    } catch {
      return false;
    }
  });

  const handleLoginSuccess = (user: SystemUser) => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem('case_ai_authenticated', 'true');
    } catch {}
    handleSwitchSessionUser(user);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('case_ai_authenticated');
    } catch {}
  };

  if (!isAuthenticated) {
    return (
      <LoginPage
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onRegisterUser={handleCreateUser}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Header */}
      <AppHeader
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        activeProjectName={currentModel.name}
        onOpenNormalizer={() => setIsNormalizerOpen(true)}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
        onOpenPhotoScanner={() => setIsPhotoScannerOpen(true)}
        onOpenArchitectModal={() => setIsArchitectModalOpen(true)}
        onOpenCodeGenerator={() => setIsCodeExportOpen(true)}
        onOpenLiveFrontend={() => setIsLiveFrontendOpen(true)}
        onOpenMultiSessionDemo={() => setIsMultiSessionOpen(true)}
        onOpenLoginModal={() => setIsLoginOpen(true)}
        onOpenDatabaseManager={() => setIsDatabaseManagerOpen(true)}
        onLogout={handleLogout}
        collaborators={collaborators}
        currentUser={currentUser}
        offlineVoiceQueueCount={offlineVoiceQueueCount}
      />

      {/* Main Layout con Sidebar Modular */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar de Módulos Reestructurado */}
        <ModuleSidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          activeProjectName={currentModel.name}
          onOpenNormalizer={() => setIsNormalizerOpen(true)}
          onOpenArchitect={() => setIsArchitectModalOpen(true)}
          onOpenDatabaseManager={() => setIsDatabaseManagerOpen(true)}
          onOpenSpringBoot={() => setIsCodeExportOpen(true)}
          onOpenTestClient={() => setIsLiveFrontendOpen(true)}
          onOpenCollab={() => setIsMultiSessionOpen(true)}
          onLogout={handleLogout}
        />

        {/* Contenido Principal según Módulo de Gestión o Taller de Diseño */}
        {activeModule === 'dashboard' ? (
          <DashboardView
            projects={projects}
            users={users}
            activeProjectId={activeProjectId}
            onSelectProject={(id) => setActiveProjectId(id)}
            onNavigate={setActiveModule}
            onOpenDesignStudio={(id) => {
              setActiveProjectId(id);
              setActiveModule('canvas');
            }}
            onOpenSpringBoot={() => setIsCodeExportOpen(true)}
            onOpenNormalizer={() => setIsNormalizerOpen(true)}
            onOpenCreateUser={() => setActiveModule('users')}
            onOpenExcelExport={() => setActiveModule('mapping')}
          />
        ) : activeModule === 'projects' ? (
          <ProjectManagerView
            folders={folders}
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={(id) => {
              setActiveProjectId(id);
              setActiveModule('canvas');
            }}
            onCreateFolder={handleCreateFolder}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            onDeleteFolder={handleDeleteFolder}
          />
        ) : activeModule === 'users' ? (
          <UserManagerView
            users={users}
            projects={projects}
            currentUserId={currentUser.id}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onSwitchSessionUser={handleSwitchSessionUser}
          />
        ) : activeModule === 'reports' ? (
          <ReportsView
            projects={projects}
            users={users}
            activeProjectId={activeProjectId}
            onSelectProject={(id) => setActiveProjectId(id)}
            onOpenDesignStudio={(id) => {
              setActiveProjectId(id);
              setActiveModule('canvas');
            }}
          />
        ) : activeModule === 'mapping' ? (
          <MappingView
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={(id) => setActiveProjectId(id)}
            onOpenDesignStudio={(id) => {
              setActiveProjectId(id);
              setActiveModule('canvas');
            }}
          />
        ) : activeModule === 'mobile' ? (
          <MobileAppView
            model={currentModel}
            onNavigate={setActiveModule}
          />
        ) : (
          <DiagramCanvas
            model={currentModel}
            viewMode={currentView}
            selectedEntityId={selectedEntityId}
            onSelectEntity={setSelectedEntityId}
            onUpdateEntityPosition={handleUpdateEntityPosition}
            onEditEntity={ent => setEditingEntity(ent)}
            onDeleteEntity={handleDeleteEntity}
            onAddEntity={handleAddEntity}
            collaborators={collaborators.filter(c => c.id !== currentUser.id)}
            onCursorMove={handleCursorMove}
            onApplyVoiceResult={(updatedModel, summary) => broadcastModelChange(updatedModel, 'voice_command')}
            onSaveRelationshipWithFK={handleSaveRelationshipWithFK}
            onDeleteRelationship={handleDeleteRelationship}
          />
        )}
      </div>

      {/* Modales y Paneles Técnicos */}
      <NormalizationModal
        isOpen={isNormalizerOpen}
        onClose={() => setIsNormalizerOpen(false)}
        model={currentModel}
        onApplyDecomposition={handleApplyDecomposition}
        onSaveFDs={(fds) => broadcastModelChange({ ...currentModel, functionalDependencies: fds }, 'save_fds')}
      />

      {/* Asistente Virtual IA con Detección Automática de Ubicación */}
      <ContextualAIAssistant
        isOpen={isAIChatOpen}
        onToggleOpen={() => setIsAIChatOpen(prev => !prev)}
        activeModule={activeModule}
        onNavigate={setActiveModule}
        model={currentModel}
        users={users}
        onOpenCreateUserModal={() => {
          setActiveModule('users');
        }}
        onQuickCreateUser={(name, email, role) => {
          const roleColors: Record<SystemRole, string> = {
            Analista: '#3b82f6',
            Diseñador: '#a855f7',
            Implementador: '#10b981',
            Administrador: '#f59e0b'
          };
          handleCreateUser({
            name,
            email,
            role,
            color: roleColors[role] || '#10b981',
            status: 'Activo',
            assignedProjects: [activeProjectId]
          });
        }}
        onAddEntity={handleAddEntity}
        onOpenNormalizer={() => setIsNormalizerOpen(true)}
        onOpenSpringBoot={() => setIsCodeExportOpen(true)}
        onOpenExcelExport={() => setActiveModule('mapping')}
        onApplyModelChanges={handleApplyAIChanges}
      />

      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        model={currentModel}
        onApplyVoiceChanges={handleApplyAIChanges}
        onQueueChange={setOfflineVoiceQueueCount}
      />

      <DiagramPhotoScanner
        isOpen={isPhotoScannerOpen}
        onClose={() => setIsPhotoScannerOpen(false)}
        onApplyPhotoModel={handleApplyAIChanges}
      />

      <ArchitectModal
        isOpen={isArchitectModalOpen}
        onClose={() => setIsArchitectModalOpen(false)}
        model={currentModel}
        onImportModel={handleImportArchitectModel}
      />

      <BackendCodeViewerModal
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
        model={currentModel}
      />

      <LiveTestClientModal
        isOpen={isLiveFrontendOpen}
        onClose={() => setIsLiveFrontendOpen(false)}
        model={currentModel}
      />

      <MultiSessionSimulator
        isOpen={isMultiSessionOpen}
        onClose={() => setIsMultiSessionOpen(false)}
        collaborators={collaborators}
        currentUser={currentUser}
        onSwitchUser={setCurrentUser}
        onTriggerConcurrentActivity={handleToggleConcurrentActivity}
        isSimulatingActive={isSimulatingActive}
      />

      <EditEntityModal
        isOpen={editingEntity !== null}
        onClose={() => setEditingEntity(null)}
        entity={editingEntity}
        onSaveEntity={handleSaveEntity}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => {
          setCurrentUser(user);
          setCollaborators(prev => prev.map(c => c.role === user.role ? user : c));
        }}
      />

      <DatabaseManagerModal
        isOpen={isDatabaseManagerOpen}
        onClose={() => setIsDatabaseManagerOpen(false)}
        model={currentModel}
      />
    </div>
  );
}
