import React, { useState } from 'react';
import { 
  UserPlus, 
  Users, 
  Shield, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  LogIn, 
  Mail, 
  Briefcase, 
  Key, 
  Sparkles,
  Filter,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { DiagramModel, SystemRole, SystemUser } from '../../types/case';

interface UserManagerViewProps {
  users: SystemUser[];
  projects: DiagramModel[];
  currentUserId: string;
  onCreateUser: (newUser: Omit<SystemUser, 'id' | 'createdAt'>) => void;
  onUpdateUser: (userId: string, updatedData: Partial<SystemUser>) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchSessionUser: (user: SystemUser) => void;
}

const ROLE_COLORS: Record<SystemRole, string> = {
  Analista: '#3b82f6',
  Diseñador: '#a855f7',
  Implementador: '#10b981',
  Administrador: '#f59e0b'
};

const ROLE_DESCRIPTIONS: Record<SystemRole, string> = {
  Analista: 'Modelado conceptual, levantamiento de requisitos de negocio y definición de Dependencias Funcionales.',
  Diseñador: 'Modelado lógico/físico relacional, diagramas de clases UML y normalización formal (1FN-BCNF).',
  Implementador: 'Generación del código backend Spring Boot 3, interfaces REST y pruebas interactivas.',
  Administrador: 'Gestión integral de usuarios, asignación de proyectos y gobierno del sistema CASE.'
};

export const UserManagerView: React.FC<UserManagerViewProps> = ({
  users,
  projects,
  currentUserId,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchSessionUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Notificación Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<SystemRole>('Implementador');
  const [formColor, setFormColor] = useState(ROLE_COLORS['Implementador']);
  const [formStatus, setFormStatus] = useState<'Activo' | 'Inactivo'>('Activo');
  const [formAssignedProjects, setFormAssignedProjects] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleOpenCreate = (presetRole?: SystemRole) => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    const targetRole = presetRole || 'Implementador';
    setFormRole(targetRole);
    setFormColor(ROLE_COLORS[targetRole]);
    setFormStatus('Activo');
    setFormAssignedProjects(projects.map(p => p.id)); // por defecto todos los proyectos
    setIsModalOpen(true);
  };

  const handleQuickCreate = (name: string, email: string, role: SystemRole) => {
    onCreateUser({
      name,
      email,
      role,
      color: ROLE_COLORS[role],
      status: 'Activo',
      assignedProjects: projects.map(p => p.id)
    });
    showToast(`✓ Usuario "${name}" registrado exitosamente como ${role}.`);
  };

  const handleOpenEdit = (user: SystemUser) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormColor(user.color || ROLE_COLORS[user.role]);
    setFormStatus(user.status);
    setFormAssignedProjects(user.assignedProjects || []);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (editingUserId) {
      onUpdateUser(editingUserId, {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        color: formColor,
        status: formStatus,
        assignedProjects: formAssignedProjects
      });
      showToast(`✓ Usuario "${formName}" actualizado con éxito.`);
    } else {
      onCreateUser({
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        color: formColor,
        status: formStatus,
        assignedProjects: formAssignedProjects
      });
      showToast(`✓ Nuevo usuario "${formName}" creado exitosamente.`);
    }

    setIsModalOpen(false);
  };

  const handleToggleProjectAssignment = (projId: string) => {
    if (formAssignedProjects.includes(projId)) {
      setFormAssignedProjects(formAssignedProjects.filter(id => id !== projId));
    } else {
      setFormAssignedProjects([...formAssignedProjects, projId]);
    }
  };

  // Contadores de Roles
  const counts = {
    total: users.length,
    analistas: users.filter(u => u.role === 'Analista').length,
    disenadores: users.filter(u => u.role === 'Diseñador').length,
    implementadores: users.filter(u => u.role === 'Implementador').length,
    administradores: users.filter(u => u.role === 'Administrador').length
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
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div style={{
            position: 'absolute',
            top: 14,
            right: 24,
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
            zIndex: 100
          }}>
            <CheckCircle2 size={16} color="#fff" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header & Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              width: 40,
              height: 40,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
            }}>
              <Users size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>
                Módulo de Creación & Gestión de Usuarios
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Administración de ingenieros de software, diseñadores relacionales, analistas y roles PUDS
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-primary"
              style={{
                fontSize: 12,
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
              }}
              onClick={() => handleOpenCreate()}
            >
              <UserPlus size={16} />
              <span>+ Registrar Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas por Rol */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { role: 'Analistas', count: counts.analistas, color: ROLE_COLORS['Analista'], desc: 'Requisitos & DFs' },
            { role: 'Diseñadores', count: counts.disenadores, color: ROLE_COLORS['Diseñador'], desc: 'Lógico, UML & Normaliz.' },
            { role: 'Implementadores', count: counts.implementadores, color: ROLE_COLORS['Implementador'], desc: 'Backend Spring Boot' },
            { role: 'Administradores', count: counts.administradores, color: ROLE_COLORS['Administrador'], desc: 'Control Total & Proyectos' }
          ].map(m => (
            <div
              key={m.role}
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: `1px solid ${m.color}44`,
                borderLeft: `4px solid ${m.color}`,
                borderRadius: 10,
                padding: '10px 14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{m.role}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.count}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Barra de Filtros, Búsqueda y Creación Rápida */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 360 }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo electrónico..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 20,
                padding: '6px 12px 6px 32px',
                color: '#fff',
                fontSize: 12
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={12} /> Rol:
            </span>
            {['all', 'Analista', 'Diseñador', 'Implementador', 'Administrador'].map(r => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                style={{
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 14,
                  background: filterRole === r ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: filterRole === r ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                {r === 'all' ? 'Todos' : r}
              </button>
            ))}
          </div>

          {/* Botones de Alta Rápida de Ejemplo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Plantillas rápidas:</span>
            <button
              className="btn-secondary"
              style={{ fontSize: 10, padding: '3px 8px', borderColor: '#10b981', color: '#34d399' }}
              onClick={() => handleQuickCreate('Ing. Javier Ríos', `javier.dev_${Date.now().toString().slice(-4)}@empresa.com`, 'Implementador')}
              title="Registrar programador rápido"
            >
              <Zap size={11} /> + Programador
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: 10, padding: '3px 8px', borderColor: '#a855f7', color: '#c084fc' }}
              onClick={() => handleQuickCreate('Lic. Elena Duarte', `elena.db_${Date.now().toString().slice(-4)}@empresa.com`, 'Diseñador')}
              title="Registrar diseñador rápido"
            >
              <Zap size={11} /> + Diseñador
            </button>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', background: 'rgba(0, 0, 0, 0.2)' }}>
                <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Usuario</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Rol PUDS</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Proyectos Asignados</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No se encontraron usuarios con los criterios de búsqueda. Presiona <strong>"+ Registrar Nuevo Usuario"</strong> para crear uno.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isCurrent = user.id === currentUserId;
                  const roleColor = ROLE_COLORS[user.role] || '#fff';
                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: isCurrent ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                      }}
                    >
                      {/* Avatar y Nombre */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: user.color || roleColor,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 12,
                            boxShadow: `0 0 10px ${user.color || roleColor}44`
                          }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 700, color: '#fff' }}>{user.name}</span>
                              {isCurrent && (
                                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.3)', color: '#818cf8', fontSize: 9 }}>
                                  Tú (Sesión Activa)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Rol PUDS */}
                      <td style={{ padding: '12px 14px' }}>
                        <span className="badge" style={{
                          background: `${roleColor}22`,
                          color: roleColor,
                          border: `1px solid ${roleColor}55`,
                          fontSize: 11,
                          padding: '3px 8px'
                        }}>
                          ● {user.role}
                        </span>
                      </td>

                      {/* Proyectos Asignados */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 300 }}>
                          {user.assignedProjects && user.assignedProjects.length > 0 ? (
                            user.assignedProjects.map(pId => {
                              const proj = projects.find(p => p.id === pId);
                              return (
                                <span key={pId} style={{
                                  fontSize: 10,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid var(--border-subtle)',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  color: 'var(--text-secondary)'
                                }}>
                                  {proj ? proj.name : pId}
                                </span>
                              );
                            })
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ninguno</span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11,
                          fontWeight: 600,
                          color: user.status === 'Activo' ? '#34d399' : '#94a3b8'
                        }}>
                          {user.status === 'Activo' ? <CheckCircle2 size={13} color="#34d399" /> : <XCircle size={13} color="#94a3b8" />}
                          <span>{user.status}</span>
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {!isCurrent && (
                            <button
                              className="btn-secondary"
                              style={{ fontSize: 11, padding: '4px 8px', borderColor: roleColor }}
                              onClick={() => {
                                onSwitchSessionUser(user);
                                showToast(`Sesión cambiada a ${user.name} (${user.role})`);
                              }}
                              title="Iniciar sesión como este usuario"
                            >
                              <LogIn size={12} color={roleColor} />
                              <span>Usar Sesión</span>
                            </button>
                          )}

                          <button
                            className="btn-icon"
                            style={{ width: 28, height: 28 }}
                            onClick={() => handleOpenEdit(user)}
                            title="Editar usuario y permisos"
                          >
                            <Edit3 size={13} />
                          </button>

                          {user.id !== 'user_analista' && user.id !== 'user_disenador' && user.id !== 'user_implementador' && (
                            <button
                              className="btn-icon"
                              style={{ width: 28, height: 28 }}
                              onClick={() => {
                                onDeleteUser(user.id);
                                showToast(`Usuario "${user.name}" eliminado.`);
                              }}
                              title="Eliminar usuario"
                            >
                              <Trash2 size={13} color="#f43f5e" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Crear / Editar Usuario */}
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 20
          }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: 540, padding: 24, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fff' }}>
                  {editingUserId ? 'Editar Usuario & Permisos PUDS' : 'Registrar Nuevo Usuario del Equipo'}
                </h3>
                <button className="btn-icon" onClick={() => setIsModalOpen(false)}><XCircle size={16} /></button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Nombre y Correo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nombre Completo:</label>
                    <input
                      type="text"
                      placeholder="ej: Ing. Mario Gómez"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      required
                      autoFocus
                      style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Correo Electrónico:</label>
                    <input
                      type="email"
                      placeholder="mario.dev@case-enterprise.com"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      required
                      style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                    />
                  </div>
                </div>

                {/* Selección de Rol PUDS */}
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Rol Asignado en el Ciclo de Desarrollo PUDS:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {(['Analista', 'Diseñador', 'Implementador', 'Administrador'] as SystemRole[]).map(r => {
                      const isSel = formRole === r;
                      const color = ROLE_COLORS[r];
                      return (
                        <div
                          key={r}
                          onClick={() => { setFormRole(r); setFormColor(color); }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            background: isSel ? `${color}22` : 'rgba(0, 0, 0, 0.3)',
                            border: `1.5px solid ${isSel ? color : 'var(--border-subtle)'}`,
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: isSel ? color : '#fff' }}>{r}</span>
                            {isSel && <Check size={13} color={color} />}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                            {ROLE_DESCRIPTIONS[r]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Proyectos Asignados */}
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Proyectos con Acceso:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 110, overflowY: 'auto', background: 'rgba(0,0,0,0.25)', padding: 8, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                    {projects.map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formAssignedProjects.includes(p.id)}
                          onChange={() => handleToggleProjectAssignment(p.id)}
                        />
                        <span>{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Estado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Estado de Cuenta:</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="status"
                      checked={formStatus === 'Activo'}
                      onChange={() => setFormStatus('Activo')}
                    />
                    <span style={{ color: '#34d399' }}>Activo</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="status"
                      checked={formStatus === 'Inactivo'}
                      onChange={() => setFormStatus('Inactivo')}
                    />
                    <span style={{ color: '#94a3b8' }}>Inactivo</span>
                  </label>
                </div>

                {/* Botones */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, fontSize: 12, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    {editingUserId ? 'Guardar Cambios' : 'Registrar Usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
