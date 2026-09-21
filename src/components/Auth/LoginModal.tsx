import React, { useState } from 'react';
import { User, Shield, CheckCircle2, Lock, LogIn, Sparkles } from 'lucide-react';
import { UserPresence } from '../../types/case';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserPresence;
  onLogin: (user: UserPresence) => void;
}

const AVAILABLE_ROLES: { name: string; role: 'Analista' | 'Diseñador' | 'Implementador'; color: string; desc: string; permissions: string[] }[] = [
  {
    name: 'Migue',
    role: 'Analista',
    color: '#3b82f6',
    desc: 'Responsable de requisitos, modelado conceptual del dominio y especificación de Dependencias Funcionales.',
    permissions: ['Modelado Conceptual', 'Definición de DFs', 'Chat IA Requisitos']
  },
  {
    name: 'Sofía',
    role: 'Diseñador',
    color: '#a855f7',
    desc: 'Responsable de la arquitectura lógica/física, diagramas de clases UML y proceso formal de normalización.',
    permissions: ['DER Lógico y Físico', 'Clases UML', 'Normalización 1FN-BCNF', 'Exportar Enterprise Architect']
  },
  {
    name: 'Alex',
    role: 'Implementador',
    color: '#10b981',
    desc: 'Responsable de la generación del código backend Spring Boot y ejecución de pruebas con el cliente frontend.',
    permissions: ['Generador Spring Boot', 'Cliente Pruebas CRUD', 'Exportar Postman']
  }
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin
}) => {
  if (!isOpen) return null;

  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number>(
    AVAILABLE_ROLES.findIndex(r => r.role === currentUser.role) || 0
  );
  const [customName, setCustomName] = useState(currentUser.name);

  const handleSelect = (index: number) => {
    setSelectedRoleIndex(index);
    setCustomName(AVAILABLE_ROLES[index].name);
  };

  const handleConfirmLogin = () => {
    const selected = AVAILABLE_ROLES[selectedRoleIndex];
    onLogin({
      id: `user_${selected.role.toLowerCase()}`,
      name: customName || selected.name,
      role: selected.role,
      color: selected.color,
      status: 'online',
      lastActive: Date.now()
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: 20
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: 640,
        padding: 28,
        borderRadius: 20,
        boxShadow: 'var(--shadow-lg), var(--shadow-glow-indigo)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--grad-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10
          }}>
            <LogIn size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
            Iniciar Sesión — CASE-AI Studio
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Selecciona tu perfil de trabajo según la metodología PUDS (Los Tres Amigos)
          </p>
        </div>

        {/* Roles List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {AVAILABLE_ROLES.map((item, idx) => {
            const isSelected = selectedRoleIndex === idx;
            return (
              <div
                key={item.role}
                onClick={() => handleSelect(idx)}
                style={{
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                  border: `2px solid ${isSelected ? item.color : 'var(--border-subtle)'}`,
                  borderRadius: 12,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: item.color,
                    boxShadow: `0 0 10px ${item.color}`
                  }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.role}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({item.name})</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <CheckCircle2 size={18} color={item.color} />
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Name */}
        <div style={{ marginBottom: 24, background: 'rgba(0, 0, 0, 0.3)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Nombre para la sesión colaborativa:
          </label>
          <input
            type="text"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            style={{
              width: '100%',
              background: '#0a0f1d',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: '8px 12px',
              color: '#fff',
              fontSize: 13
            }}
          />
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            style={{ flex: 1, padding: '10px 0', fontSize: 13 }}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="btn-primary"
            style={{ flex: 2, padding: '10px 0', fontSize: 13 }}
            onClick={handleConfirmLogin}
          >
            <LogIn size={16} />
            <span>Ingresar al Sistema como {AVAILABLE_ROLES[selectedRoleIndex].role}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
