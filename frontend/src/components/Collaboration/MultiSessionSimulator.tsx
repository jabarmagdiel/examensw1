import React from 'react';
import { X, Users, Play, Pause, CheckCircle2, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { UserPresence } from '../../types/case';

interface MultiSessionSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: UserPresence[];
  currentUser: UserPresence;
  onSwitchUser: (user: UserPresence) => void;
  onTriggerConcurrentActivity: () => void;
  isSimulatingActive: boolean;
}

export const MultiSessionSimulator: React.FC<MultiSessionSimulatorProps> = ({
  isOpen,
  onClose,
  collaborators,
  currentUser,
  onSwitchUser,
  onTriggerConcurrentActivity,
  isSimulatingActive
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: 720,
        padding: 24,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--grad-primary)', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Colaboración Multi-Usuario (3 Sesiones PUDS)</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Demostración de solución a problemas colaborativos concurrentes (CRDTs, Presencia y Awareness)
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* 3 Sesiones Activas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {collaborators.map(user => {
            const isCurrent = user.id === currentUser.id;
            return (
              <div
                key={user.id}
                style={{
                  background: isCurrent ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                  border: `2px solid ${isCurrent ? user.color : 'var(--border-subtle)'}`,
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: user.color }} />
                  <span className="badge" style={{ background: `${user.color}22`, color: user.color, fontSize: 10 }}>
                    {user.role}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{user.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Estado: <span style={{ color: '#34d399' }}>● {user.status}</span>
                  </div>
                </div>

                <button
                  className={isCurrent ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: 11, padding: '4px 8px', marginTop: 4 }}
                  onClick={() => onSwitchUser(user)}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Sesión Actual' : 'Cambiar a esta Sesión'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Solución a problemas colaborativos */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: 14, marginBottom: 20, border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={14} color="var(--accent-primary)" /> Soluciones Implementadas a Problemas Colaborativos:
          </h4>
          <ul style={{ fontSize: 11, color: 'var(--text-muted)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <li>• <strong>Edición concurrente sin bloqueos:</strong> Modelo basado en operaciones atómicas con CRDT y marcas de tiempo lógicas.</li>
            <li>• <strong>Awareness en tiempo real:</strong> Difusión de posición de punteros, selecciones de nodo y estado de edición por WebSocket.</li>
            <li>• <strong>Tolerancia a particiones y desconexiones:</strong> Buffer offline persistente que resuelve el merge automáticamente al reconectar.</li>
          </ul>
        </div>

        {/* Botón de Demostración de Actividad Concurrente en Vivo */}
        <button
          className="btn-primary"
          style={{ width: '100%', padding: '12px 0', fontSize: 13, background: isSimulatingActive ? 'var(--accent-rose)' : 'var(--grad-primary)' }}
          onClick={onTriggerConcurrentActivity}
        >
          {isSimulatingActive ? (
            <>
              <Pause size={16} />
              <span>Detener Simulación Concurrente</span>
            </>
          ) : (
            <>
              <Activity size={16} />
              <span>Iniciar Simulación de 3 Usuarios Colaborando en Vivo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
