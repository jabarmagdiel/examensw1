import React from 'react';
import { 
  FolderGit2, 
  Users, 
  BarChart3, 
  LayoutDashboard, 
  CheckCircle2, 
  FolderSync, 
  Download, 
  Play, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  Compass,
  Table2,
  Smartphone,
  Database,
  LogOut
} from 'lucide-react';

export type ActiveModule = 
  | 'dashboard'
  | 'projects' 
  | 'users' 
  | 'reports' 
  | 'mapping'
  | 'mobile'
  | 'canvas';

interface ModuleSidebarProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  activeProjectName: string;
  onOpenNormalizer: () => void;
  onOpenArchitect: () => void;
  onOpenSpringBoot: () => void;
  onOpenTestClient: () => void;
  onOpenCollab: () => void;
  onOpenDatabaseManager?: () => void;
  onLogout?: () => void;
}

export const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  activeModule,
  onSelectModule,
  activeProjectName,
  onOpenNormalizer,
  onOpenArchitect,
  onOpenSpringBoot,
  onOpenTestClient,
  onOpenCollab,
  onOpenDatabaseManager,
  onLogout
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Módulos Principales de Gestión de la Empresa de Software
  const enterpriseModules = [
    {
      id: 'dashboard' as ActiveModule,
      label: '1. Panel de Control (Dashboard)',
      icon: LayoutDashboard,
      color: '#818cf8',
      badge: 'Principal',
      desc: 'KPIs, ciclo de vida & auditoría'
    },
    {
      id: 'projects' as ActiveModule,
      label: '2. Cartera de Proyectos',
      icon: FolderGit2,
      color: '#38bdf8',
      desc: 'Proyectos, clientes y fases'
    },
    {
      id: 'users' as ActiveModule,
      label: '3. Usuarios & Roles',
      icon: Users,
      color: '#f59e0b',
      badge: 'Equipo',
      desc: 'Equipo, permisos y roles PUDS'
    },
    {
      id: 'reports' as ActiveModule,
      label: '4. Reportes & Calidad',
      icon: BarChart3,
      color: '#10b981',
      desc: 'Auditoría, KPIs y entregables'
    },
    {
      id: 'mapping' as ActiveModule,
      label: '5. Mapeo de Tablas & BD',
      icon: Table2,
      color: '#0284c7',
      badge: 'Excel',
      desc: 'Mapeo SQL/Java y descarga Excel'
    },
    {
      id: 'mobile' as ActiveModule,
      label: '6. App Móvil APK & Voz',
      icon: Smartphone,
      color: '#10b981',
      badge: 'APK Android',
      desc: 'IA Local por voz offline/online'
    }
  ];

  return (
    <aside className="glass-panel" style={{
      width: isCollapsed ? 64 : 260,
      margin: '0 0 16px 16px',
      padding: '16px 8px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      flexShrink: 0,
      height: 'calc(100vh - var(--header-height) - 40px)',
      position: 'relative',
      zIndex: 80,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Encabezado del Menú */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: '0 8px 12px 8px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 12
        }}>
          {!isCollapsed && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                SISTEMA EMPRESARIAL
              </div>
              <div style={{ fontSize: 11, color: '#fff', fontWeight: 700, marginTop: 1 }}>
                Gestión de Software
              </div>
            </div>
          )}
          <button
            className="btn-icon"
            style={{ width: 26, height: 26 }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expandir barra' : 'Colapsar barra'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* SECCIÓN 1: MÓDULOS DE GESTIÓN EMPRESARIAL */}
          <div>
            {!isCollapsed && (
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 6px 8px' }}>
                Módulos de Gestión
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {enterpriseModules.map(mod => {
                const Icon = mod.icon;
                const isActive = activeModule === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => onSelectModule(mod.id)}
                    title={mod.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.02)',
                      border: isActive ? `1.5px solid ${mod.color}` : '1px solid transparent',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      width: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{
                      color: mod.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={18} />
                    </div>

                    {!isCollapsed && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 600, color: isActive ? '#fff' : 'var(--text-primary)' }}>
                            {mod.label}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                            {mod.desc}
                          </div>
                        </div>
                        {mod.badge && (
                          <span style={{ fontSize: 9, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '1px 5px', borderRadius: 6, fontWeight: 700 }}>
                            {mod.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 2: ESPACIO DE INGENIERÍA & DISEÑO (APARTADO) */}
          <div style={{
            background: activeModule === 'canvas' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(0, 0, 0, 0.3)',
            border: activeModule === 'canvas' ? '1px solid #818cf8' : '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: isCollapsed ? '8px 4px' : '10px 8px'
          }}>
            {!isCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Espacio Técnico
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 4 }}>
                  Apartado
                </span>
              </div>
            )}

            {/* Botón Principal del Taller de Diseño */}
            <button
              onClick={() => onSelectModule('canvas')}
              title="Abrir Estudio de Diseño CASE"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 8,
                background: activeModule === 'canvas' ? 'var(--grad-primary)' : 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: '#fff',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                width: '100%',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: activeModule === 'canvas' ? 'var(--shadow-glow-indigo)' : 'none'
              }}
            >
              <LayoutDashboard size={18} color="#fff" />
              {!isCollapsed && (
                <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
                    Taller de Diseño CASE
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeProjectName}
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Footer PUDS */}
        {!isCollapsed && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 10,
            color: 'var(--text-muted)',
            marginTop: 10
          }}>
            <div style={{ color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
              Metodología PUDS Activa
            </div>
            <div style={{ fontSize: 9, marginTop: 2 }}>Requisitos • Diseño • Backend</div>
          </div>
        )}

        {/* Botón Salir / Cerrar Sesión */}
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              marginTop: 8,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              transition: 'all 0.15s ease'
            }}
            title="Cerrar Sesión"
          >
            <LogOut size={13} color="#fca5a5" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
