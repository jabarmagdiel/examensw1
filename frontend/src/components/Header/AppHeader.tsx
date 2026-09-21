import React from 'react';
import { 
  Database, 
  Sparkles, 
  Mic, 
  Camera, 
  Download, 
  Play, 
  Users,
  CheckCircle2,
  FolderSync,
  User,
  LogIn,
  LogOut,
  LayoutDashboard,
  ArrowLeft,
  FolderGit2,
  BarChart3,
  Layers,
  Smartphone
} from 'lucide-react';
import { UserPresence } from '../../types/case';
import { ActiveModule } from '../Navigation/ModuleSidebar';

interface AppHeaderProps {
  currentView: 'conceptual' | 'logical' | 'physical' | 'uml';
  setCurrentView: (view: 'conceptual' | 'logical' | 'physical' | 'uml') => void;
  activeModule: ActiveModule;
  onSelectModule: (mod: ActiveModule) => void;
  activeProjectName: string;
  onOpenNormalizer: () => void;
  onOpenAIChat: () => void;
  onOpenVoiceAssistant: () => void;
  onOpenPhotoScanner: () => void;
  onOpenArchitectModal: () => void;
  onOpenCodeGenerator: () => void;
  onOpenLiveFrontend: () => void;
  onOpenMultiSessionDemo: () => void;
  onOpenLoginModal: () => void;
  onOpenDatabaseManager?: () => void;
  onLogout?: () => void;
  collaborators: UserPresence[];
  currentUser: UserPresence;
  offlineVoiceQueueCount: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  setCurrentView,
  activeModule,
  onSelectModule,
  activeProjectName,
  onOpenNormalizer,
  onOpenAIChat,
  onOpenVoiceAssistant,
  onOpenPhotoScanner,
  onOpenArchitectModal,
  onOpenCodeGenerator,
  onOpenLiveFrontend,
  onOpenMultiSessionDemo,
  onOpenLoginModal,
  onOpenDatabaseManager,
  onLogout,
  currentUser,
  offlineVoiceQueueCount
}) => {
  const isDesignStudio = activeModule === 'canvas';

  return (
    <header className="glass-panel" style={{
      height: 'var(--header-height)',
      margin: '12px 16px',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      zIndex: 100
    }}>
      {/* Brand & Project Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          background: 'var(--grad-primary)',
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow-indigo)'
        }}>
          <Database size={20} color="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#fff' }}>
              CASE Enterprise Studio
            </h1>
            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-text)' }}>
              Metodología PUDS
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            Plataforma de Ingeniería & Gestión para Empresas de Desarrollo de Software
          </p>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* MODO: TALLER DE DISEÑO (Vistas del DER y UML) vs MODO GESTIÓN */}
        {isDesignStudio ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn-secondary"
              style={{ fontSize: 11, padding: '4px 10px', gap: 5, color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.4)' }}
              onClick={() => onSelectModule('projects')}
              title="Volver a la Gestión de Proyectos"
            >
              <ArrowLeft size={13} />
              <span>Gestión de Empresa</span>
            </button>

            <div style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: 3,
              borderRadius: 'var(--radius-sm)',
              gap: 2
            }}>
              {[
                { id: 'conceptual', label: 'DER Conceptual' },
                { id: 'logical', label: 'DER Lógico' },
                { id: 'physical', label: 'DER Físico' },
                { id: 'uml', label: 'Clases UML' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: currentView === tab.id ? 'var(--accent-primary)' : 'transparent',
                    color: currentView === tab.id ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Proyecto Activo:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>{activeProjectName}</span>
            </div>

            <button
              className="btn-primary"
              style={{
                fontSize: 11,
                padding: '6px 14px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: 'var(--shadow-glow-indigo)'
              }}
              onClick={() => onSelectModule('canvas')}
              title={`Abrir el Taller de Diseño para ${activeProjectName}`}
            >
              <LayoutDashboard size={14} />
              <span>Abrir Taller de Diseño</span>
            </button>
          </div>
        )}
      </div>

      {/* Herramientas de Ingeniería y Colaboración */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Normalización */}
        <button
          className="btn-secondary"
          onClick={onOpenNormalizer}
          title="Normalización (1FN-BCNF) y Dependencias Funcionales"
          style={{ fontSize: 11, borderColor: 'rgba(16, 185, 129, 0.3)' }}
        >
          <CheckCircle2 size={14} color="#10b981" />
          <span>Normalización</span>
        </button>

        {/* Enterprise Architect */}
        <button
          className="btn-secondary"
          onClick={onOpenArchitectModal}
          title="Importar / Exportar a Enterprise Architect (XMI)"
          style={{ fontSize: 11, borderColor: 'rgba(6, 182, 212, 0.3)' }}
        >
          <FolderSync size={14} color="#06b6d4" />
          <span>Enterprise Architect</span>
        </button>

        {/* Spring Boot */}
        <button
          className="btn-primary"
          onClick={onOpenCodeGenerator}
          title="Generar proyecto backend Spring Boot 3 completo"
          style={{ fontSize: 11 }}
        >
          <Download size={14} />
          <span>Spring Boot</span>
        </button>

        {/* Probar API */}
        <button
          className="btn-secondary"
          onClick={onOpenLiveFrontend}
          title="Cliente interactivo para probar endpoints CRUD"
          style={{ fontSize: 11, borderColor: 'rgba(99, 102, 241, 0.4)' }}
        >
          <Play size={14} color="#818cf8" />
          <span>Probar API</span>
        </button>

        {/* Base de Datos & Supabase CRUD */}
        {onOpenDatabaseManager && (
          <button
            className="btn-secondary"
            onClick={onOpenDatabaseManager}
            title="Gestor CRUD de Base de Datos y Conexión Supabase PostgreSQL"
            style={{ 
              fontSize: 11, 
              borderColor: 'rgba(56, 189, 248, 0.5)', 
              background: 'rgba(14, 165, 233, 0.15)',
              color: '#38bdf8',
              fontWeight: 600
            }}
          >
            <Database size={14} color="#38bdf8" />
            <span>BD & Supabase CRUD</span>
          </button>
        )}

        {/* 3 Sesiones */}
        <button
          className="btn-secondary"
          onClick={onOpenMultiSessionDemo}
          title="Demostrar 3 sesiones colaborativas simultáneas (Analista, Diseñador, Implementador)"
          style={{ fontSize: 11, background: 'rgba(99, 102, 241, 0.15)', borderColor: 'var(--accent-primary)' }}
        >
          <Users size={14} color="#a5b4fc" />
          <span>3 Sesiones</span>
        </button>

        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* Herramientas IA: Chat & Foto & Voz */}
        <button
          className="btn-icon"
          onClick={onOpenAIChat}
          title="Chat Asistente IA"
        >
          <Sparkles size={15} color="#c084fc" />
        </button>

        <button
          className="btn-icon"
          onClick={onOpenPhotoScanner}
          title="Escanear Foto de Diagrama"
        >
          <Camera size={15} />
        </button>

        <button
          className="btn-icon"
          onClick={onOpenVoiceAssistant}
          title="Asistente de Voz Móvil (Soporte Offline)"
          style={{ position: 'relative' }}
        >
          <Mic size={15} color={offlineVoiceQueueCount > 0 ? '#f59e0b' : 'currentColor'} />
          {offlineVoiceQueueCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#f59e0b',
              color: '#000',
              fontSize: 9,
              fontWeight: 800,
              width: 15,
              height: 15,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {offlineVoiceQueueCount}
            </span>
          )}
        </button>

        {/* Separator */}
        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* Perfil de Usuario Activo / Inicio de Sesión */}
        <button
          onClick={onOpenLoginModal}
          title="Cambiar usuario o rol de PUDS"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${currentUser.color}66`,
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: currentUser.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800
          }}>
            {currentUser.name.charAt(0)}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: 9, color: currentUser.color, lineHeight: 1.1 }}>
              {currentUser.role}
            </div>
          </div>
          <LogIn size={12} color="var(--text-muted)" style={{ marginLeft: 2 }} />
        </button>

        {/* Botón Cerrar Sesión */}
        {onLogout && (
          <button
            className="btn-icon"
            onClick={onLogout}
            title="Cerrar Sesión / Salir al Login"
            style={{ width: 32, height: 32, color: '#f87171' }}
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </header>
  );
};
