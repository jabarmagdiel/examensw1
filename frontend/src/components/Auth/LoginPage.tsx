import React, { useState } from 'react';
import { 
  Database, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  LogIn, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  UserPlus, 
  Users,
  Code2,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { SystemRole, SystemUser, UserPresence } from '../../types/case';

interface LoginPageProps {
  users: SystemUser[];
  onLoginSuccess: (user: SystemUser) => void;
  onRegisterUser: (newUser: Omit<SystemUser, 'id' | 'createdAt'>) => void;
}

const ROLE_COLORS: Record<SystemRole, string> = {
  Analista: '#3b82f6',
  Diseñador: '#a855f7',
  Implementador: '#10b981',
  Administrador: '#f59e0b'
};

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLoginSuccess,
  onRegisterUser
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('migue.analista@case-enterprise.com');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Registro State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<SystemRole>('Implementador');

  // Login normal
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const userFound = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (userFound) {
      if (userFound.status === 'Inactivo') {
        setErrorMsg('Esta cuenta se encuentra inactiva. Contacte al Administrador.');
        return;
      }
      onLoginSuccess(userFound);
    } else {
      // Si ingresa con cualquier credencial válida de demo, creamos o asociamos
      const fallbackUser: SystemUser = {
        id: `usr_${Date.now()}`,
        name: email.split('@')[0].replace('.', ' '),
        email: email,
        role: 'Implementador',
        color: '#10b981',
        status: 'Activo',
        assignedProjects: ['proj_veterinaria_1'],
        createdAt: Date.now(),
        lastLogin: Date.now()
      };
      onLoginSuccess(fallbackUser);
    }
  };

  // Registro Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    const newUser: Omit<SystemUser, 'id' | 'createdAt'> = {
      name: regName.trim(),
      email: regEmail.trim(),
      role: regRole,
      color: ROLE_COLORS[regRole],
      status: 'Activo',
      assignedProjects: ['proj_veterinaria_1', 'proj_farmacia_1', 'proj_ecommerce_1'],
      lastLogin: Date.now()
    };

    onRegisterUser(newUser);
    const createdUser: SystemUser = {
      ...newUser,
      id: `usr_${Date.now()}`,
      createdAt: Date.now()
    };
    onLoginSuccess(createdUser);
  };

  // Acceso Rápido con 1 Clic
  const handleQuickLogin = (targetUser: SystemUser) => {
    setEmail(targetUser.email);
    setPassword('••••••••');
    onLoginSuccess(targetUser);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#070b14',
      backgroundImage: `
        radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 85% 80%, rgba(16, 185, 129, 0.12) 0%, transparent 40%),
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Elementos Decorativos de Fondo */}
      <div style={{
        position: 'absolute',
        top: -120,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 600,
        height: 300,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.1) 100%)',
        filter: 'blur(90px)',
        pointerEvents: 'none'
      }} />

      {/* Contenedor Principal en Dos Columnas */}
      <div style={{
        width: '100%',
        maxWidth: 960,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.15)',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        overflow: 'hidden',
        zIndex: 10
      }}>
        {/* Columna Izquierda: Información Empresarial & Perfiles Demo */}
        <div style={{
          padding: 40,
          background: 'rgba(0, 0, 0, 0.3)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Logo y Nombre de la Empresa */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                width: 44,
                height: 44,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
              }}>
                <Database size={24} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.02em' }}>
                  CASE Enterprise Studio
                </h1>
                <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600 }}>
                  Metodología PUDS • Software Empresarial
                </span>
              </div>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>
              Plataforma de Modelado, Calidad & Generación Backend
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
              Entorno integral para empresas de desarrollo: modelado relacional DER, normalización (1FN-BCNF), código Spring Boot 3 y gobierno de roles PUDS.
            </p>

            {/* Accesos Rápidos Demo (1 Clic) */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                ACCESO RÁPIDO POR ROL INSTITUCIONAL:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {users.slice(0, 4).map(u => {
                  const roleColor = ROLE_COLORS[u.role] || '#fff';
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleQuickLogin(u)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = `${roleColor}15`;
                        e.currentTarget.style.borderColor = roleColor;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: roleColor,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 11
                        }}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{u.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                      <span className="badge" style={{ background: `${roleColor}22`, color: roleColor, fontSize: 10, border: `1px solid ${roleColor}44` }}>
                        ● {u.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>Sistema Seguro con Autenticación de Roles PUDS</span>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Login / Registro */}
        <div style={{ padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Selector de Pestaña: Iniciar Sesión / Registrarse */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: 4,
            borderRadius: 12,
            marginBottom: 24,
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => { setIsRegisterMode(false); setErrorMsg(null); }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: !isRegisterMode ? 700 : 500,
                background: !isRegisterMode ? 'var(--accent-primary)' : 'transparent',
                color: !isRegisterMode ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setIsRegisterMode(true); setErrorMsg(null); }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isRegisterMode ? 700 : 500,
                background: isRegisterMode ? 'var(--accent-primary)' : 'transparent',
                color: isRegisterMode ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Mensaje de Error */}
          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12,
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16
            }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isRegisterMode ? (
            /* FORMULARIO INICIAR SESIÓN */
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Correo Institucional o Usuario:
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    placeholder="usuario@case-enterprise.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      padding: '10px 14px 10px 38px',
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Contraseña:
                  </label>
                  <span style={{ fontSize: 11, color: '#818cf8', cursor: 'pointer' }}>
                    ¿Olvidaste tu contraseña?
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      padding: '10px 38px 10px 38px',
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <span>Recordar credenciales</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: '12px',
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 8,
                  boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)'
                }}
              >
                <LogIn size={18} />
                <span>Ingresar al Sistema CASE</span>
              </button>
            </form>
          ) : (
            /* FORMULARIO CREAR CUENTA */
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  placeholder="ej: Ing. Mario Gómez"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  required
                  style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Correo Institucional:
                </label>
                <input
                  type="email"
                  placeholder="mario.dev@case-enterprise.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required
                  style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Rol de Desarrollo PUDS:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {(['Analista', 'Diseñador', 'Implementador', 'Administrador'] as SystemRole[]).map(r => (
                    <div
                      key={r}
                      onClick={() => setRegRole(r)}
                      style={{
                        padding: '8px',
                        borderRadius: 8,
                        background: regRole === r ? `${ROLE_COLORS[r]}22` : 'rgba(0,0,0,0.3)',
                        border: `1.5px solid ${regRole === r ? ROLE_COLORS[r] : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 700,
                        color: regRole === r ? ROLE_COLORS[r] : '#fff',
                        textAlign: 'center'
                      }}
                    >
                      {r}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Contraseña:
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required
                  style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12 }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: '11px',
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 6,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}
              >
                <UserPlus size={16} />
                <span>Registrar y Acceder</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
