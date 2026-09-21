import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Database, 
  ShieldCheck, 
  FileSpreadsheet, 
  Code2, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Activity, 
  Key, 
  FolderGit2, 
  Plus,
  Play,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { ActiveModule } from '../Navigation/ModuleSidebar';
import { DiagramModel, SystemRole, SystemUser } from '../../types/case';

interface DashboardViewProps {
  projects: DiagramModel[];
  users: SystemUser[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onNavigate: (module: ActiveModule) => void;
  onOpenDesignStudio: (id: string) => void;
  onOpenSpringBoot: () => void;
  onOpenNormalizer: () => void;
  onOpenCreateUser: () => void;
  onOpenExcelExport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  users,
  activeProjectId,
  onSelectProject,
  onNavigate,
  onOpenDesignStudio,
  onOpenSpringBoot,
  onOpenNormalizer,
  onOpenCreateUser,
  onOpenExcelExport
}) => {
  const [activeDashboardTab, setActiveDashboardTab] = useState<'overview' | 'crud' | 'seeders'>('overview');
  const [copiedSeeder, setCopiedSeeder] = useState(false);

  const currentProj = projects.find(p => p.id === activeProjectId) || projects[0] || {
    id: 'default',
    name: 'Proyecto',
    client: 'Cliente',
    status: 'Diseño',
    entities: [],
    relationships: [],
    version: 1
  };

  // Métricas Consolidadas
  const totalEntities = projects.reduce((acc, p) => acc + p.entities.length, 0);
  const totalRelationships = projects.reduce((acc, p) => acc + p.relationships.length, 0);
  const totalPKs = projects.reduce((acc, p) => 
    acc + p.entities.reduce((ea, e) => ea + e.attributes.filter(a => a.isPrimaryKey).length, 0), 0
  );
  const totalFKs = projects.reduce((acc, p) => 
    acc + p.entities.reduce((ea, e) => ea + e.attributes.filter(a => a.isForeignKey).length, 0), 0
  );

  // Estados de proyectos por fase
  const statusCounts = {
    diseno: projects.filter(p => p.status === 'Diseño').length,
    normalizacion: projects.filter(p => p.status === 'Normalización').length,
    implementacion: projects.filter(p => p.status === 'Implementación').length,
    produccion: projects.filter(p => p.status === 'Producción').length
  };

  // Historial de Auditoría / Actividad Reciente del Equipo
  const recentAuditEvents = [
    {
      id: 'ev_1',
      user: 'Ing. Carlos Mendoza',
      role: 'Diseñador',
      action: 'Estableció relación 1:N con Clave Foránea',
      detail: 'Cliente ➔ Mascota [cliente_id FK]',
      time: 'Hace 8 minutos',
      color: '#a855f7'
    },
    {
      id: 'ev_2',
      user: 'Alex',
      role: 'Implementador',
      action: 'Generó backend Spring Boot 3 con JPA/Hibernate',
      detail: '5 Entidades, Repositorios y REST Controllers',
      time: 'Hace 24 minutos',
      color: '#10b981'
    },
    {
      id: 'ev_3',
      user: 'Migue',
      role: 'Analista',
      action: 'Validó dependencias funcionales PUDS',
      detail: 'Esquema de Veterinaria verificado en 3FN y BCNF',
      time: 'Hace 45 minutos',
      color: '#3b82f6'
    },
    {
      id: 'ev_4',
      user: 'Sistema CASE',
      role: 'Auditoría',
      action: 'Exportación a Microsoft Excel (.xlsx)',
      detail: 'Diccionario de Datos descargado con 3 hojas estructuradas',
      time: 'Hace 1 hora',
      color: '#0284c7'
    }
  ];

  // Generador de Sentencias INSERT / Seeders de Prueba
  const generateMockSQL = () => {
    if (!currentProj || currentProj.entities.length === 0) {
      return '-- Seleccione un proyecto con tablas para generar datos de prueba';
    }

    const lines: string[] = [
      `-- ==========================================================`,
      `-- SEEDER DE DATOS DE PRUEBA: ${currentProj.name.toUpperCase()}`,
      `-- Base de Datos PostgreSQL / MySQL - Generado por CASE-AI Studio`,
      `-- ==========================================================\n`
    ];

    currentProj.entities.forEach((entity, idx) => {
      const tableName = entity.tableName || entity.name.toLowerCase() + 's';
      const colNames = entity.attributes.map(a => a.name).join(', ');
      
      lines.push(`-- Datos iniciales para la tabla ${tableName}`);
      for (let i = 1; i <= 3; i++) {
        const values = entity.attributes.map(attr => {
          if (attr.isPrimaryKey) return `${idx * 10 + i}`;
          if (attr.isForeignKey) return `1`;
          if (attr.type.includes('INT')) return `${i * 5}`;
          if (attr.type.includes('DECIMAL') || attr.type.includes('FLOAT')) return `${(i * 24.5).toFixed(2)}`;
          if (attr.type.includes('DATE')) return `'2026-09-1${i}'`;
          if (attr.type.includes('BOOL')) return i % 2 === 0 ? 'TRUE' : 'FALSE';
          return `'${entity.name}_${attr.name}_${i}'`;
        }).join(', ');

        lines.push(`INSERT INTO ${tableName} (${colNames}) VALUES (${values});`);
      }
      lines.push('');
    });

    return lines.join('\n');
  };

  const handleCopySeeder = () => {
    const text = generateMockSQL();
    navigator.clipboard.writeText(text);
    setCopiedSeeder(true);
    setTimeout(() => setCopiedSeeder(false), 3000);
  };

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      height: 'calc(100vh - var(--header-height) - 40px)',
      margin: '0 16px 16px 16px',
      gap: 16,
      overflow: 'hidden'
    }}>
      <div className="glass-panel" style={{
        flex: 1,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        position: 'relative'
      }}>
        {/* Top Header Ejecutivo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              width: 42,
              height: 42,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
            }}>
              <LayoutDashboard size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>
                  Panel de Control Ejecutivo
                </h2>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: 10 }}>
                  ● Sistema en Operación
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Visión general de proyectos de software, integridad relacional, gobierno de roles y avance de entregas PUDS
              </p>
            </div>
          </div>

          {/* Atajos Rápidos Ejecutivos */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-secondary"
              style={{ fontSize: 11, padding: '7px 12px', gap: 6 }}
              onClick={onOpenCreateUser}
            >
              <Users size={14} color="#f59e0b" />
              <span>+ Nuevo Usuario</span>
            </button>

            <button
              className="btn-secondary"
              style={{ fontSize: 11, padding: '7px 12px', gap: 6, borderColor: '#10b981', color: '#34d399' }}
              onClick={onOpenExcelExport}
            >
              <FileSpreadsheet size={14} />
              <span>Mapeo Excel</span>
            </button>

            <button
              className="btn-primary"
              style={{
                fontSize: 12,
                padding: '7px 16px',
                gap: 6,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}
              onClick={() => onOpenDesignStudio(currentProj.id)}
            >
              <Layers size={14} />
              <span>Taller de Diseño: {currentProj.name}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Tarjetas Superiores de KPIs Ejecutivos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
          {/* KPI 1: Proyectos Activos */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderLeft: '4px solid #38bdf8',
            borderRadius: 10,
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Proyectos de Software</span>
              <FolderGit2 size={15} color="#38bdf8" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8', margin: '4px 0 2px 0' }}>
              {projects.length}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              {statusCounts.produccion} en Producción
            </div>
          </div>

          {/* KPI 2: Tablas / Clases Modeladas */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderLeft: '4px solid #10b981',
            borderRadius: 10,
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Entidades / Tablas</span>
              <Database size={15} color="#10b981" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399', margin: '4px 0 2px 0' }}>
              {totalEntities}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              100% con Clave Primaria (PK)
            </div>
          </div>

          {/* KPI 3: Relaciones & Foreign Keys */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderLeft: '4px solid #a855f7',
            borderRadius: 10,
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Relaciones & FKs</span>
              <Key size={15} color="#a855f7" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#c084fc', margin: '4px 0 2px 0' }}>
              {totalRelationships}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              {totalFKs} Claves Foráneas activas
            </div>
          </div>

          {/* KPI 4: Equipo PUDS */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderLeft: '4px solid #f59e0b',
            borderRadius: 10,
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Personal Registrado</span>
              <Users size={15} color="#f59e0b" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24', margin: '4px 0 2px 0' }}>
              {users.length}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              Analistas, Devs & Diseñadores
            </div>
          </div>

          {/* KPI 5: Salud Global PUDS */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderLeft: '4px solid #818cf8',
            borderRadius: 10,
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Índice de Calidad</span>
              <ShieldCheck size={15} color="#818cf8" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#818cf8', margin: '4px 0 2px 0' }}>
              94%
            </div>
            <div style={{ fontSize: 10, color: '#34d399' }}>
              ✓ Certificado 3FN & BCNF
            </div>
          </div>
        </div>

        {/* Pestañas del Dashboard */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
          <button
            onClick={() => setActiveDashboardTab('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              padding: '6px 14px',
              borderRadius: 6,
              background: activeDashboardTab === 'overview' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeDashboardTab === 'overview' ? '#818cf8' : 'var(--text-secondary)',
              border: activeDashboardTab === 'overview' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: activeDashboardTab === 'overview' ? 700 : 500
            }}
          >
            <Activity size={14} />
            <span>1. Monitor de Proyectos & Auditoría en Vivo</span>
          </button>

          <button
            onClick={() => setActiveDashboardTab('crud')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              padding: '6px 14px',
              borderRadius: 6,
              background: activeDashboardTab === 'crud' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: activeDashboardTab === 'crud' ? '#fbbf24' : 'var(--text-secondary)',
              border: activeDashboardTab === 'crud' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: activeDashboardTab === 'crud' ? 700 : 500
            }}
          >
            <ShieldCheck size={14} />
            <span>2. Matriz CRUD por Rol PUDS</span>
          </button>

          <button
            onClick={() => setActiveDashboardTab('seeders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              padding: '6px 14px',
              borderRadius: 6,
              background: activeDashboardTab === 'seeders' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeDashboardTab === 'seeders' ? '#34d399' : 'var(--text-secondary)',
              border: activeDashboardTab === 'seeders' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: activeDashboardTab === 'seeders' ? 700 : 500
            }}
          >
            <Code2 size={14} />
            <span>3. Generador de Datos Mock & Seeders SQL</span>
          </button>
        </div>

        {/* CONTENIDO DEL DASHBOARD */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {activeDashboardTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
              {/* Columna Izquierda: Cartera de Proyectos & Fases PUDS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  padding: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#fff' }}>
                        Ciclo de Vida de Software & Fases PUDS
                      </h4>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
                        Distribución de proyectos según la metodología formal de desarrollo
                      </p>
                    </div>
                    <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
                      {projects.length} Proyectos
                    </span>
                  </div>

                  {/* Barra de Distribución Visual */}
                  <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 12, gap: 2 }}>
                    <div style={{ width: '35%', background: '#a855f7' }} title="Diseño (35%)" />
                    <div style={{ width: '25%', background: '#f59e0b' }} title="Normalización (25%)" />
                    <div style={{ width: '25%', background: '#3b82f6' }} title="Implementación (25%)" />
                    <div style={{ width: '15%', background: '#10b981' }} title="Producción (15%)" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Diseño ({statusCounts.diseno})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Normaliz. ({statusCounts.normalizacion})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Implement. ({statusCounts.implementacion})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Producción ({statusCounts.produccion})</span>
                    </div>
                  </div>
                </div>

                {/* Lista de Proyectos con Acceso Rápido */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  padding: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#fff' }}>
                      Cartera de Proyectos en Ejecución
                    </h4>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: 10, padding: '3px 8px' }}
                      onClick={() => onNavigate('projects')}
                    >
                      Ver Todos ➔
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {projects.map(p => {
                      const isActive = p.id === currentProj.id;
                      return (
                        <div
                          key={p.id}
                          style={{
                            background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${isActive ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-subtle)'}`,
                            borderRadius: 8,
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 700, fontSize: 12, color: '#fff' }}>{p.name}</span>
                              <span className="badge" style={{ fontSize: 9, background: 'rgba(255,255,255,0.06)', color: 'var(--accent-text)' }}>
                                {p.status}
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                              Cliente: {p.client} • {p.entities.length} Tablas • {p.relationships.length} Relaciones
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-primary"
                              style={{ fontSize: 10, padding: '4px 10px' }}
                              onClick={() => {
                                onSelectProject(p.id);
                                onOpenDesignStudio(p.id);
                              }}
                            >
                              Taller de Diseño
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Registro de Auditoría en Tiempo Real */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={15} color="#818cf8" />
                    <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#fff' }}>
                      Registro de Auditoría (Audit Log)
                    </h4>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Eventos del Equipo</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
                  {recentAuditEvents.map(ev => (
                    <div
                      key={ev.id}
                      style={{
                        display: 'flex',
                        gap: 10,
                        paddingBottom: 10,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                      }}
                    >
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: ev.color,
                        marginTop: 5,
                        flexShrink: 0,
                        boxShadow: `0 0 8px ${ev.color}`
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                            {ev.user} <span style={{ fontSize: 9, color: ev.color }}>({ev.role})</span>
                          </span>
                          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{ev.time}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#e2e8f0', marginTop: 1 }}>{ev.action}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{ev.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 10, color: '#a5b4fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={12} />
                    Integridad de Trazabilidad PUDS
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                    Cada cambio en el modelo conceptual, normalización y generación de código queda registrado para auditoría de calidad.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeDashboardTab === 'crud' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 10, padding: 14 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px 0', color: '#fbbf24' }}>
                  Matriz CRUD de Entidades por Rol PUDS ({currentProj.name})
                </h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  Define formalmente los permisos de Create (Crear), Read (Consultar), Update (Actualizar) y Delete (Eliminar) asignados a cada rol sobre las tablas del sistema.
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Tabla / Entidad</th>
                      <th style={{ padding: '10px 14px', color: '#3b82f6', textAlign: 'center' }}>Analista</th>
                      <th style={{ padding: '10px 14px', color: '#a855f7', textAlign: 'center' }}>Diseñador</th>
                      <th style={{ padding: '10px 14px', color: '#10b981', textAlign: 'center' }}>Implementador</th>
                      <th style={{ padding: '10px 14px', color: '#f59e0b', textAlign: 'center' }}>Administrador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProj.entities.map(e => (
                      <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <strong style={{ color: '#fff' }}>{e.name}</strong>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>({e.tableName || e.name.toLowerCase() + 's'})</span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>[R] Consulta</span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>[C, R, U] Modelado</span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>[C, R, U, D] REST API</span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>[C, R, U, D] Control Total</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeDashboardTab === 'seeders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#34d399' }}>
                    Generador de Datos Mock & Población SQL ({currentProj.name})
                  </h4>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    Sentencias INSERT generadas dinámicamente según los tipos de datos y claves foráneas del modelo
                  </p>
                </div>

                <button
                  className="btn-primary"
                  style={{ fontSize: 11, padding: '6px 14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', gap: 6 }}
                  onClick={handleCopySeeder}
                >
                  {copiedSeeder ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedSeeder ? '¡SQL Copiado!' : 'Copiar Sentencias SQL'}</span>
                </button>
              </div>

              <div style={{
                background: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                padding: 16,
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#e2e8f0',
                maxHeight: 320,
                overflowY: 'auto',
                lineHeight: 1.6
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {generateMockSQL()}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
