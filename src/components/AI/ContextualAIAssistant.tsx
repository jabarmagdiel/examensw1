import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  UserPlus, 
  Link2, 
  Database, 
  CheckCircle2, 
  Download, 
  ArrowRight, 
  Lightbulb, 
  HelpCircle, 
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  Layers,
  Code2,
  Check,
  Shield,
  Zap,
  LayoutDashboard,
  Smartphone
} from 'lucide-react';
import { ActiveModule } from '../Navigation/ModuleSidebar';
import { DiagramModel, Entity, Relationship, SystemRole, SystemUser } from '../../types/case';
import { processNaturalLanguagePrompt } from '../../services/aiAssistant';

interface ContextualAIAssistantProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  activeModule: ActiveModule;
  onNavigate: (mod: ActiveModule) => void;
  model: DiagramModel;
  users: SystemUser[];
  onOpenCreateUserModal?: () => void;
  onQuickCreateUser?: (name: string, email: string, role: SystemRole) => void;
  onAddEntity?: () => void;
  onOpenNormalizer?: () => void;
  onOpenSpringBoot?: () => void;
  onOpenExcelExport?: () => void;
  onApplyModelChanges?: (entities: Entity[], relationships: Relationship[], summary: string) => void;
}

interface AssistantMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  actionButton?: {
    label: string;
    icon?: any;
    onClick: () => void;
  };
}

export const ContextualAIAssistant: React.FC<ContextualAIAssistantProps> = ({
  isOpen,
  onToggleOpen,
  activeModule,
  onNavigate,
  model,
  users,
  onOpenCreateUserModal,
  onQuickCreateUser,
  onAddEntity,
  onOpenNormalizer,
  onOpenSpringBoot,
  onOpenExcelExport,
  onApplyModelChanges
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [highlightGuide, setHighlightGuide] = useState<string | null>(null);

  // Información contextual basada en dónde está el usuario
  const contextMeta = {
    dashboard: {
      name: 'Panel de Control (Dashboard Ejecutivo)',
      icon: LayoutDashboard,
      color: '#818cf8',
      greeting: `Detecto que estás en el Dashboard Ejecutivo PUDS. Aquí tienes la visión panorámica de tus proyectos, calidad de diagramas (${model.entities.length} entidades), matriz CRUD por rol y generación de seeders SQL.`,
      quickPrompts: [
        { label: '🎨 Abrir Taller de Diseño CASE', action: 'open_canvas' },
        { label: '👥 Gestionar Equipo PUDS', action: 'open_users' },
        { label: '📋 ¿Cómo funciona la Matriz CRUD?', action: 'explain_crud' },
        { label: '⚡ ¿Cómo usar los Seeders SQL?', action: 'explain_seeders' }
      ]
    },
    users: {
      name: 'Gestión de Usuarios & Roles PUDS',
      icon: UserPlus,
      color: '#f59e0b',
      greeting: `Detecto que estás en el Módulo de Usuarios. Tienes ${users.length} miembros registrados. Puedo ayudarte a dar de alta programadores, diseñadores o explicarte los roles PUDS.`,
      quickPrompts: [
        { label: '+ Crear Programador', action: 'create_programmer' },
        { label: '+ Crear Diseñador BD', action: 'create_designer' },
        { label: '¿Qué hace cada Rol PUDS?', action: 'explain_roles' },
        { label: '¿Cómo asignar proyectos?', action: 'explain_assign' }
      ]
    },
    canvas: {
      name: 'Taller de Diseño & Modelado CASE',
      icon: Layers,
      color: '#818cf8',
      greeting: `Detecto que estás en el Taller de Diseño para "${model.name}". Tienes ${model.entities.length} entidades y ${model.relationships.length} relaciones. Puedo guiarte para enlazar Foreign Keys o agregar tablas.`,
      quickPrompts: [
        { label: '🔗 ¿Cómo conectar tablas con FK?', action: 'guide_fk' },
        { label: '+ Agregar Nueva Entidad', action: 'add_entity' },
        { label: '📐 Normalizar Diagrama (1FN-BCNF)', action: 'open_normalizer' },
        { label: '⚡ Generar Spring Boot 3', action: 'open_spring' }
      ]
    },
    projects: {
      name: 'Cartera de Proyectos de Software',
      icon: Database,
      color: '#38bdf8',
      greeting: `Detecto que estás en la Cartera de Proyectos. Aquí gestionas los clientes y fases de entrega. ¿Deseas abrir el Taller de Diseño de un proyecto?`,
      quickPrompts: [
        { label: '🎨 Abrir Taller de Diseño', action: 'open_canvas' },
        { label: '¿Cómo organizar carpetas?', action: 'explain_folders' }
      ]
    },
    reports: {
      name: 'Auditoría & Reportes de Calidad PUDS',
      icon: Shield,
      color: '#10b981',
      greeting: `Detecto que estás en el Módulo de Reportes. Puedo ayudarte a auditar las Formas Normales de tus tablas o preparar los entregables.`,
      quickPrompts: [
        { label: '¿Cómo certifico BCNF?', action: 'explain_bcnf' },
        { label: 'Imprimir Informe Oficial', action: 'guide_print' }
      ]
    },
    mapping: {
      name: 'Mapeo de Tablas & Diccionario Excel',
      icon: FileSpreadsheet,
      color: '#0284c7',
      greeting: `Detecto que estás en el Módulo de Mapeo. Aquí se visualiza la correspondencia entre tus tablas SQL y clases Java JPA. Puedes descargarlo en Excel.`,
      quickPrompts: [
        { label: '📥 Descargar en Excel (.xlsx)', action: 'download_excel' },
        { label: '¿Cómo se mapean los tipos SQL/Java?', action: 'explain_types' }
      ]
    },
    mobile: {
      name: 'App Móvil APK & Relleno por Voz',
      icon: Smartphone,
      color: '#10b981',
      greeting: `Detecto que estás en el Módulo de la App Móvil Android (APK). Puedes probar la IA local de reconocimiento de voz para poblar entidades de tu backend en modo Offline/Online y descargar el APK compilado.`,
      quickPrompts: [
        { label: '📥 Descargar APK Móvil (.apk)', action: 'download_apk' },
        { label: '📶 ¿Cómo funciona el modo Offline?', action: 'explain_offline' },
        { label: '⚡ ¿Cómo sincronizar con Spring Boot?', action: 'explain_mobile_sync' }
      ]
    }
  }[activeModule] || {
    name: 'Asistente Virtual CASE',
    icon: Bot,
    color: '#a855f7',
    greeting: '¡Hola! Soy tu asistente virtual inteligente. Dime en qué te puedo ayudar.',
    quickPrompts: []
  };

  // Actualizar mensaje de bienvenida cuando cambia de módulo
  useEffect(() => {
    const welcomeMsg: AssistantMessage = {
      id: `ctx_${Date.now()}`,
      sender: 'ai',
      text: contextMeta.greeting,
      timestamp: 'Ahora'
    };
    setMessages([welcomeMsg]);
  }, [activeModule]);

  // Manejador de acciones rápidas
  const handleQuickAction = (actionKey: string) => {
    if (actionKey === 'create_programmer') {
      if (onQuickCreateUser) {
        onQuickCreateUser('Ing. Andrés Silva', `andres.dev_${Date.now().toString().slice(-4)}@case-enterprise.com`, 'Implementador');
        addMessage('ai', '✓ He registrado inmediatamente al desarrollador "Ing. Andrés Silva" con rol Implementador y acceso a tus proyectos.');
      } else if (onOpenCreateUserModal) {
        onOpenCreateUserModal();
        addMessage('ai', 'He abierto el formulario para registrar un nuevo usuario.');
      }
    } else if (actionKey === 'create_designer') {
      if (onQuickCreateUser) {
        onQuickCreateUser('Lic. Claudia Morales', `claudia.db_${Date.now().toString().slice(-4)}@case-enterprise.com`, 'Diseñador');
        addMessage('ai', '✓ He registrado inmediatamente a "Lic. Claudia Morales" con rol Diseñador para modelado lógico y UML.');
      }
    } else if (actionKey === 'explain_roles') {
      addMessage('ai', `En la metodología PUDS se definen 4 roles empresariales:
• 🟦 **Analista**: Modela requisitos del negocio y dependencias funcionales (DFs).
• 🟪 **Diseñador**: Diseña el modelo relacional físico, diagramas de clases UML y aplica normalización (1FN a BCNF).
• 🟩 **Implementador**: Genera el backend Spring Boot 3 con JPA/Hibernate y endpoints REST.
• 🟧 **Administrador**: Control integral de la empresa, creación de personal y asignación de proyectos.`);
    } else if (actionKey === 'explain_assign') {
      addMessage('ai', 'Para asignar proyectos a un miembro del equipo: Haz clic en el icono ✏️ (editar) en la fila del usuario, marca las casillas de los proyectos a los que tendrá acceso y presiona "Guardar Cambios".');
    } else if (actionKey === 'guide_fk') {
      addMessage('ai', `📌 **Guía para conectar tablas y crear Claves Foráneas (FK):**
1. En la tarjeta de la tabla origen (ej: Cliente), haz clic en el icono de **cadena 🔗** ubicado en la esquina superior derecha.
2. Verás el mensaje verde en la parte superior: *"Origen seleccionado... Haz clic en la entidad destino"*.
3. Haz clic sobre la tabla que recibirá la clave foránea (ej: Mascota o CitaMedica).
4. Se abrirá el modal: selecciona la cardinalidad (ej: **1:N**), escribe el verbo (ej: **"posee"**) y confirma.
5. ¡Listo! El enlace se dibujará y el atributo con la insignia azul **[FK]** se insertará automáticamente.`);
    } else if (actionKey === 'add_entity') {
      if (onAddEntity) {
        onAddEntity();
        addMessage('ai', '✓ He añadido una nueva clase al lienzo. Haz clic sobre ella para editar sus atributos y clave primaria.');
      }
    } else if (actionKey === 'open_normalizer') {
      if (onOpenNormalizer) {
        onOpenNormalizer();
        addMessage('ai', 'He abierto el módulo de Normalización formal (1FN-BCNF).');
      }
    } else if (actionKey === 'open_spring') {
      if (onOpenSpringBoot) {
        onOpenSpringBoot();
        addMessage('ai', 'He abierto el Visor de Código Backend Spring Boot 3.');
      }
    } else if (actionKey === 'open_canvas') {
      onNavigate('canvas');
      addMessage('ai', 'Te he llevado al Taller de Diseño CASE.');
    } else if (actionKey === 'download_excel') {
      if (onOpenExcelExport) {
        onOpenExcelExport();
        addMessage('ai', '✓ He disparado la descarga del libro Microsoft Excel (.xlsx) con las 3 hojas de mapeo.');
      } else {
        onNavigate('mapping');
        addMessage('ai', 'Te he redirigido al Módulo de Mapeo. Presiona el botón verde "Descargar en Excel (.xlsx)" para obtener el archivo.');
      }
    } else if (actionKey === 'explain_bcnf') {
      addMessage('ai', 'La Forma Normal de Boyce-Codd (BCNF) exige que para toda Dependencia Funcional X → Y, X debe ser una superclave. Esto garantiza cero redundancias y evita anomalías de actualización y borrado.');
    } else if (actionKey === 'explain_types') {
      addMessage('ai', `Correspondencia estándar SQL ➔ Java JPA:
• BIGINT ➔ Long (Claves primarias y foráneas)
• VARCHAR(n) ➔ String
• DECIMAL / NUMERIC ➔ Double / BigDecimal
• DATE ➔ LocalDate
• TIMESTAMP ➔ LocalDateTime
• BOOLEAN ➔ Boolean`);
    } else if (actionKey === 'explain_folders') {
      addMessage('ai', 'Las carpetas empresariales permiten agrupar los proyectos de software por sector de mercado (ej: Sector Salud, Sector Retail, Sector Financiero). Presiona el icono 📁+ para crear una nueva carpeta.');
    } else if (actionKey === 'open_users') {
      onNavigate('users');
      addMessage('ai', 'Te he redirigido al Módulo de Gestión de Usuarios y Roles PUDS.');
    } else if (actionKey === 'explain_crud') {
      addMessage('ai', 'La **Matriz CRUD por Rol PUDS** mapea explícitamente qué operaciones (Create, Read, Update, Delete) tiene permitidas cada rol sobre las tablas del modelo. Esto garantiza la seguridad y aislamiento de datos antes de generar el backend.');
    } else if (actionKey === 'explain_seeders') {
      addMessage('ai', 'El **Generador de Mock Data & Seeders SQL** analiza la estructura de tipos y claves foráneas de tu modelo para crear sentencias INSERT con datos verosímiles en español, listos para poblar PostgreSQL, MySQL o MariaDB.');
    } else if (actionKey === 'download_apk') {
      window.location.href = '/downloads/case-voice-mobile.apk';
      addMessage('ai', '✓ Se ha iniciado la descarga del archivo **case-voice-mobile.apk** (49.3 MB) compilado para Android.');
    } else if (actionKey === 'explain_offline') {
      addMessage('ai', 'El **Modo Offline** utiliza el reconocimiento de voz local y el motor NLP determinista en el propio dispositivo Android. Los registros se encolan en almacenamiento seguro local (`localStorage`/`IndexedDB`) sin requerir internet.');
    } else if (actionKey === 'explain_mobile_sync') {
      addMessage('ai', 'Al recuperar conexión a internet, la opción **"Sincronizar en Ráfaga"** envía todos los registros acumulados en lote mediante peticiones REST `POST /api/v1/{tabla}` directamente al backend Spring Boot 3.');
    } else if (actionKey === 'guide_print') {
      window.print();
      addMessage('ai', 'Se ha abierto el cuadro de impresión para exportar a PDF o impresora física.');
    }
  };

  const addMessage = (sender: 'ai' | 'user', text: string) => {
    const newMsg: AssistantMessage = {
      id: `msg_${Date.now()}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    addMessage('user', text);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();

      // Detección contextual por lenguaje natural:
      if (lower.includes('usuario') || lower.includes('crear usuario') || lower.includes('programador') || lower.includes('personal')) {
        if (activeModule !== 'users') {
          addMessage('ai', 'Te recomiendo ir al módulo de Usuarios para gestionarlos. ¿Quieres que te lleve allí ahora?');
          onNavigate('users');
        } else {
          if (lower.includes('crea') || lower.includes('nuevo')) {
            if (onQuickCreateUser) {
              onQuickCreateUser('Ing. Desarrollador Nuevo', `dev_${Date.now().toString().slice(-4)}@empresa.com`, 'Implementador');
              addMessage('ai', '✓ He registrado un nuevo usuario Implementador. Puedes editarlo o asignarle proyectos desde la tabla.');
            } else if (onOpenCreateUserModal) {
              onOpenCreateUserModal();
              addMessage('ai', 'He abierto el formulario para que completes los datos del usuario.');
            }
          } else {
            addMessage('ai', 'Para registrar un usuario en esta pantalla: Haz clic en el botón amarillo "+ Registrar Nuevo Usuario" en la parte superior derecha, o usa una de las plantillas rápidas de un clic.');
          }
        }
      } else if (lower.includes('relacion') || lower.includes('conectar') || lower.includes('fk') || lower.includes('foranea') || lower.includes('cadena')) {
        if (activeModule !== 'canvas') {
          onNavigate('canvas');
          addMessage('ai', 'Te he llevado al Taller de Diseño. Para enlazar tablas: Haz clic en el icono 🔗 en la tarjeta origen, y luego haz clic en la tarjeta destino.');
        } else {
          addMessage('ai', `👉 **Cómo enlazar tablas en el lienzo:**
1. Haz clic en el icono 🔗 (cadena) en la esquina superior de la tabla origen.
2. Luego haz clic sobre la tabla destino.
3. Elige la cardinalidad (1:1 o 1:N) y el verbo.
4. El sistema insertará automáticamente el campo con la etiqueta azul [FK].`);
        }
      } else if (lower.includes('excel') || lower.includes('descargar') || lower.includes('mapeo')) {
        onNavigate('mapping');
        addMessage('ai', 'Te he redirigido al Módulo de Mapeo. Aquí puedes revisar todas las tablas y hacer clic en "Descargar en Excel (.xlsx)" para obtener el reporte formal.');
      } else if (lower.includes('reporte') || lower.includes('auditoria') || lower.includes('calidad')) {
        onNavigate('reports');
        addMessage('ai', 'Te he llevado al Módulo de Reportes & Calidad PUDS.');
      } else if (lower.includes('agregar entidad') || lower.includes('crear tabla') || lower.includes('nueva clase')) {
        if (activeModule !== 'canvas') onNavigate('canvas');
        if (onAddEntity) {
          onAddEntity();
          addMessage('ai', '✓ He creado una nueva entidad en el diagrama. Puedes cambiarle el nombre y añadirle atributos haciendo clic sobre ella.');
        }
      } else {
        // Procesar requerimiento técnico o duda general
        const aiResult = processNaturalLanguagePrompt(text, model);
        addMessage('ai', aiResult.summary || `Estoy aquí para ayudarte en ${contextMeta.name}. Puedes consultarme sobre roles PUDS, cómo conectar tablas, normalización o exportación a Excel.`);
      }

      setIsTyping(false);
    }, 600);
  };

  const ContextIcon = contextMeta.icon;

  return (
    <>
      {/* TRIGGER FLOTANTE: Burbuja del Asistente Virtual */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 24,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        {/* Píldora de Detección Automática de Contexto */}
        {!isOpen && (
          <div
            onClick={onToggleOpen}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${contextMeta.color}88`,
              borderRadius: 20,
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: contextMeta.color, display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
              📍 {contextMeta.name}
            </span>
            <span style={{ fontSize: 10, color: contextMeta.color, background: `${contextMeta.color}22`, padding: '1px 6px', borderRadius: 8 }}>
              Asistente Activo
            </span>
          </div>
        )}

        {/* Botón Principal del Asistente */}
        <button
          onClick={onToggleOpen}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: isOpen ? '#1e293b' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: `2px solid ${isOpen ? 'var(--border-subtle)' : '#a5b4fc'}`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(90deg)' : 'scale(1)'
          }}
          title={isOpen ? 'Cerrar Asistente' : 'Abrir Asistente Virtual Inteligente'}
        >
          {isOpen ? <X size={20} /> : <Bot size={22} />}
        </button>
      </div>

      {/* PANEL LATERAL DEL ASISTENTE VIRTUAL */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 78,
          right: 24,
          width: 380,
          maxHeight: 'calc(100vh - 120px)',
          height: 560,
          background: 'rgba(10, 15, 29, 0.96)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header del Asistente con Detección Automática */}
          <div style={{
            padding: '14px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                width: 34,
                height: 34,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)'
              }}>
                <Bot size={18} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: '#fff' }}>
                  Asistente Virtual IA
                </h3>
                <div style={{ fontSize: 10, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                  Detecta tu ubicación en tiempo real
                </div>
              </div>
            </div>

            <button className="btn-icon" onClick={onToggleOpen} style={{ width: 28, height: 28 }}>
              <X size={15} />
            </button>
          </div>

          {/* Tarjeta de Contexto Detectado */}
          <div style={{
            padding: '10px 14px',
            background: `${contextMeta.color}15`,
            borderBottom: `1px solid ${contextMeta.color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ContextIcon size={15} color={contextMeta.color} />
              <div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  UBICACIÓN DETECTADA AUTOMÁTICAMENTE:
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>
                  {contextMeta.name}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 9, background: contextMeta.color, color: '#000', padding: '2px 6px', borderRadius: 6, fontWeight: 800 }}>
              EN VIVO
            </span>
          </div>

          {/* Sugerencias Rápidas de 1 Clic */}
          <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 6, overflowX: 'auto' }}>
            {contextMeta.quickPrompts.map(qp => (
              <button
                key={qp.label}
                onClick={() => handleQuickAction(qp.action)}
                style={{
                  fontSize: 10,
                  padding: '4px 10px',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${contextMeta.color}44`,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${contextMeta.color}33`}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                <span>{qp.label}</span>
              </button>
            ))}
          </div>

          {/* Lista de Mensajes del Chat */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                <div style={{
                  background: msg.sender === 'user' ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.06)',
                  padding: '9px 12px',
                  borderRadius: 12,
                  fontSize: 11,
                  lineHeight: 1.5,
                  border: msg.sender === 'ai' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                  color: '#fff',
                  whiteSpace: 'pre-line'
                }}>
                  {msg.text}
                </div>

                {msg.actionButton && (
                  <button
                    className="btn-primary"
                    style={{ fontSize: 10, padding: '4px 10px', alignSelf: 'flex-start', marginTop: 4 }}
                    onClick={msg.actionButton.onClick}
                  >
                    {msg.actionButton.label}
                  </button>
                )}

                <span style={{ fontSize: 9, color: 'var(--text-muted)', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.timestamp}
                </span>
              </div>
            ))}
            {isTyping && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={12} color="#a855f7" /> El Asistente está escribiendo...
              </div>
            )}
          </div>

          {/* Formulario de Entrada */}
          <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, background: 'rgba(0,0,0,0.3)' }}>
            <input
              type="text"
              placeholder={`Pregunta sobre ${contextMeta.name.split(' ')[0]} o pide ayuda...`}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '7px 10px',
                color: '#fff',
                fontSize: 11
              }}
            />
            <button
              className="btn-primary"
              onClick={handleSendMessage}
              style={{ width: 34, height: 34, padding: 0, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
