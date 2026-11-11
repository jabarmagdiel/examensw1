import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Settings,
  Users,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Code2,
  Layers,
  UserCheck,
  Zap,
  Compass,
  Play,
  Maximize2,
  Minimize2,
  Trash2,
  Eye,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import {
  DiagramModel,
  Entity,
  GroupChatMessage,
  Relationship,
  SeniorAIConfig,
  SeniorAIMode,
  SeniorAIProvider,
  SystemUser,
  UserPresence
} from '../../types/case';
import {
  analyzeDiagramContext,
  checkLocalOllamaStatus,
  generateSeniorMentorReply,
  getInitialTeamChat
} from '../../services/seniorAiMentor';

interface SeniorTeamChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DiagramModel;
  currentUser: UserPresence;
  collaborators: UserPresence[];
  systemUsers: SystemUser[];
  selectedEntityId: string | null;
  messages: GroupChatMessage[];
  aiConfig: SeniorAIConfig;
  onSendMessage: (msg: GroupChatMessage) => void;
  onUpdateAIConfig: (cfg: SeniorAIConfig) => void;
  onClearChat: () => void;
  onSwitchUser: (user: SystemUser) => void;
  onApplyChanges: (entities: Entity[], relationships: Relationship[], summary: string) => void;
}

// Renderiza negritas (**texto**), cursivas (*texto*) y código en línea (`codigo`) de forma limpia
function renderInlineMarkdown(line: string): React.ReactNode[] {
  const tokens = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={idx} style={{ color: '#fff', fontWeight: 700 }}>
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: '#38bdf8',
            padding: '1px 5px',
            borderRadius: 4,
            fontSize: '0.92em',
            fontFamily: 'var(--font-mono, monospace)'
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={idx} style={{ color: '#cbd5e1', fontStyle: 'italic' }}>
          {token.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {lines.map((line, i) => {
        if (!line.trim()) {
          return <div key={i} style={{ height: 4 }} />;
        }
        return <div key={i}>{renderInlineMarkdown(line)}</div>;
      })}
    </div>
  );
}

export const SeniorTeamChatModal: React.FC<SeniorTeamChatModalProps> = ({
  isOpen,
  onClose,
  model,
  currentUser,
  collaborators,
  systemUsers,
  selectedEntityId,
  messages,
  aiConfig,
  onSendMessage,
  onUpdateAIConfig,
  onClearChat,
  onSwitchUser,
  onApplyChanges
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showContextInspector, setShowContextInspector] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [askSeniorDirectly, setAskSeniorDirectly] = useState(true);
  const [ollamaStatus, setOllamaStatus] = useState<{ online: boolean; models: string[] } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      checkLocalOllamaStatus(aiConfig.localEndpoint).then(setOllamaStatus);
    }
  }, [messages, isOpen, isAIThinking, showConfigPanel]);

  if (!isOpen) return null;

  const selectedEntity = model.entities.find(e => e.id === selectedEntityId) || null;
  const audit = analyzeDiagramContext(model);

  const handleAttachImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setAttachedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleChatPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const blob = items[i].getAsFile();
        if (blob) {
          handleAttachImageFile(blob);
          break;
        }
      }
    }
  };

  const triggerSeniorResponse = async (
    userPrompt: string,
    askingPerson: UserPresence,
    currentHistory: GroupChatMessage[],
    imageDataUrl?: string
  ) => {
    setIsAIThinking(true);
    try {
      const reply = await generateSeniorMentorReply({
        prompt: userPrompt,
        imageDataUrl,
        model,
        askingUser: askingPerson,
        collaborators,
        selectedEntityId,
        config: aiConfig,
        recentMessages: currentHistory
      });

      if (reply.autoApply && reply.proposedChange) {
        onApplyChanges(
          reply.proposedChange.entities,
          reply.proposedChange.relationships,
          reply.proposedChange.summary
        );
      }

      const aiMsg: GroupChatMessage = {
        id: `msg_ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        projectId: model.id,
        senderType: 'senior_ai',
        senderId: 'senior_ai_mentor',
        senderName: 'Arq. IA Senior (Mentor PUDS)',
        senderRole: 'Senior AI Mentor',
        senderColor: '#10b981',
        targetUserName: askingPerson.name,
        targetUserRole: askingPerson.role,
        text: reply.text,
        timestamp: Date.now(),
        aiMetadata: {
          mode: aiConfig.mode,
          providerUsed: reply.providerUsed,
          contextSummary: `${model.name} (${model.entities.length} tablas) • Selección: ${selectedEntity?.name || 'General'}`,
          addressedTo: askingPerson.name,
          addressedRole: askingPerson.role,
          hasSolution: Boolean(reply.proposedChange),
          solutionApplied: reply.autoApply,
          proposedChange: reply.proposedChange,
          codeSnippet: reply.codeSnippet
        }
      };

      onSendMessage(aiMsg);
    } catch (err: any) {
      const errorMsg: GroupChatMessage = {
        id: `msg_err_${Date.now()}`,
        projectId: model.id,
        senderType: 'senior_ai',
        senderId: 'senior_ai_mentor',
        senderName: 'Arq. IA Senior (Mentor PUDS)',
        senderRole: 'Senior AI Mentor',
        senderColor: '#f59e0b',
        targetUserName: askingPerson.name,
        targetUserRole: askingPerson.role,
        text: `⚠️ **No pude usar ese motor externo:** ${err?.message || 'Error de conexión con la API.'}\n\nPuedes pegar otra API Key (` + '`AIzaSy...`' + `) en **⚙️** o cambiar a **IA Local (Ollama / Motor PUDS)**.`,
        timestamp: Date.now(),
        aiMetadata: {
          mode: aiConfig.mode,
          providerUsed: 'Aviso de Motor IA',
          contextSummary: `${model.name}`,
          addressedTo: askingPerson.name,
          addressedRole: askingPerson.role
        }
      };
      onSendMessage(errorMsg);
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleSend = async (customText?: string, overrideUser?: UserPresence) => {
    const rawText = (customText ?? inputText).trim();
    const imgToSend = customText ? undefined : attachedImage || undefined;
    if ((!rawText && !imgToSend) || isAIThinking) return;

    const text = rawText || 'Analiza esta imagen del diagrama de clases UML y prepárala para exportarla al lienzo general.';
    const sender = overrideUser || currentUser;

    const userMsg: GroupChatMessage = {
      id: `msg_u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      projectId: model.id,
      senderType: 'user',
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      senderColor: sender.color,
      text,
      imageDataUrl: imgToSend,
      timestamp: Date.now()
    };

    onSendMessage(userMsg);
    if (!customText) {
      setInputText('');
      setAttachedImage(null);
    }

    const updatedHistory = [...messages, userMsg];
    const shouldAIRespond =
      Boolean(imgToSend) ||
      askSeniorDirectly ||
      aiConfig.autoIntervene ||
      text.toLowerCase().includes('@senior') ||
      text.toLowerCase().includes('ia') ||
      text.includes('?');

    if (shouldAIRespond) {
      await triggerSeniorResponse(text, sender, updatedHistory, imgToSend);
    }
  };

  // Simulación de preguntas en equipo por rol para demostrar en el examen cómo la IA distingue quién habla
  const handleSimulateTeamRoleQuestion = (role: 'Analista' | 'Diseñador' | 'Implementador') => {
    const targetSysUser = systemUsers.find(u => u.role === role) || systemUsers[0];
    const simulatedPresence: UserPresence = {
      id: targetSysUser.id,
      name: targetSysUser.name,
      role: targetSysUser.role,
      color: targetSysUser.color,
      status: 'online',
      lastActive: Date.now()
    };

    const roleQuestions: Record<'Analista' | 'Diseñador' | 'Implementador', string> = {
      Analista: `@Senior ¿Qué reglas de negocio o entidades de dominio nos faltan en "${model.name}" para cubrir todo el flujo del cliente?`,
      Diseñador: `@Senior ¿Cómo ves las cardinalidades, claves foráneas y la normalización BCNF de las ${model.entities.length} tablas actuales?`,
      Implementador: `@Senior ¿Cómo debo mapear las entidades JPA en Spring Boot 3 y optimizar los índices SQL para "${selectedEntity?.name || model.entities[0]?.name || 'el diagrama'}"?`
    };

    handleSend(roleQuestions[role], simulatedPresence);
  };

  const modeDescriptions: Record<SeniorAIMode, { label: string; badge: string; color: string; desc: string }> = {
    mentor: {
      label: 'Modo Mentor Guía',
      badge: 'Socrático',
      color: '#38bdf8',
      desc: 'Orienta y explica criterios de ingeniería según el rol sin regalar ni aplicar cambios automáticos.'
    },
    hybrid: {
      label: 'Modo Copiloto Senior',
      badge: 'Mentor + Solución',
      color: '#a855f7',
      desc: 'Explica el porqué técnico personalizado por rol y adjunta un botón con la solución lista para aplicar.'
    },
    solver: {
      label: 'Modo Solucionador Directo',
      badge: 'Auto-Aplicar',
      color: '#10b981',
      desc: 'Actúa como un desarrollador más aplicando la solución directamente sobre el lienzo en tiempo real.'
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: isExpanded ? 16 : 70,
        right: 16,
        bottom: 16,
        width: isExpanded ? 'min(960px, calc(100vw - 32px))' : 460,
        background: 'rgba(10, 15, 29, 0.97)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.75)',
        zIndex: 1050,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}
    >
      {/* HEADER PRINCIPAL: SALA GRUPAL + SENIOR AI MENTOR */}
      <div
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(99, 102, 241, 0.14) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
              flexShrink: 0
            }}
          >
            <Bot size={20} color="#fff" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Chat Grupal & IA Senior Mentor
              </h3>
              <span
                style={{
                  fontSize: 9,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '1px 6px',
                  borderRadius: 6,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                En Vivo
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ color: '#34d399', overflow: 'hidden', textOverflow: 'ellipsis' }}>● {model.name}</span>
              <span>•</span>
              <span style={{ flexShrink: 0 }}>{modeDescriptions[aiConfig.mode].label}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
          <button
            className="btn-icon"
            onClick={() => setShowContextInspector(prev => !prev)}
            title="Ver contexto en vivo que lee la IA"
            style={{
              width: 30,
              height: 30,
              background: showContextInspector ? 'rgba(56, 189, 248, 0.2)' : undefined,
              color: showContextInspector ? '#38bdf8' : undefined
            }}
          >
            <Eye size={14} />
          </button>
          <button
            className="btn-icon"
            onClick={() => setShowConfigPanel(prev => !prev)}
            title="Configurar Capacidad de la IA (Modo Mentor/Solucionador y Motor Gemini/Local)"
            style={{
              width: 30,
              height: 30,
              background: showConfigPanel ? 'rgba(168, 85, 247, 0.25)' : undefined,
              color: showConfigPanel ? '#c084fc' : undefined
            }}
          >
            <Settings size={14} />
          </button>
          <button
            className="btn-icon"
            onClick={() => setIsExpanded(prev => !prev)}
            title={isExpanded ? 'Contraer panel' : 'Expandir sala grupal'}
            style={{ width: 30, height: 30 }}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            className="btn-icon"
            onClick={onClearChat}
            title="Reiniciar historial del chat grupal"
            style={{ width: 30, height: 30, color: '#f87171' }}
          >
            <Trash2 size={14} />
          </button>
          <button className="btn-icon" onClick={onClose} style={{ width: 30, height: 30 }}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* BARRA RÁPIDA: IDENTIDAD DE QUIÉN PREGUNTA EN EL CHAT GRUPAL */}
      <div
        style={{
          padding: '8px 14px',
          background: 'rgba(0, 0, 0, 0.35)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={12} color="#a5b4fc" />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>
              ¿Quién pregunta en el Chat Grupal?
            </span>
          </div>
          <span style={{ fontSize: 9, color: '#34d399' }}>
            La IA adapta su respuesta al usuario y rol activo
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {systemUsers.map(u => {
            const isMe = u.id === currentUser.id;
            return (
              <button
                key={u.id}
                onClick={() => onSwitchUser(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 9px',
                  borderRadius: 20,
                  background: isMe ? `${u.color}28` : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${isMe ? u.color : 'rgba(255,255,255,0.08)'}`,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: isMe ? 800 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title={`Hablar en el chat grupal como ${u.name} (${u.role})`}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: u.color
                  }}
                />
                <span>{u.name}</span>
                <span
                  style={{
                    fontSize: 8,
                    padding: '1px 5px',
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.4)',
                    color: u.color,
                    fontWeight: 700
                  }}
                >
                  {u.role}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BARRA DE MODO DE INTERVENCIÓN (CONFIGURABLE AL VUELO) */}
      <div
        style={{
          padding: '8px 14px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6
        }}
      >
        {(['mentor', 'hybrid', 'solver'] as SeniorAIMode[]).map(m => {
          const info = modeDescriptions[m];
          const isSelected = aiConfig.mode === m;
          return (
            <button
              key={m}
              onClick={() => onUpdateAIConfig({ ...aiConfig, mode: m })}
              style={{
                padding: '6px 8px',
                borderRadius: 8,
                background: isSelected ? `${info.color}20` : 'rgba(0,0,0,0.25)',
                border: `1px solid ${isSelected ? info.color : 'var(--border-subtle)'}`,
                color: isSelected ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              title={info.desc}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: isSelected ? info.color : '#fff' }}>
                  {info.label}
                </span>
              </div>
              <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>
                {info.badge}
              </div>
            </button>
          );
        })}
      </div>

      {/* PANEL DESPLEGABLE: INSPECTOR DE CONTEXTO EN TIEMPO REAL */}
      {showContextInspector && (
        <div
          style={{
            padding: 12,
            background: 'rgba(14, 165, 233, 0.08)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            fontSize: 11,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ color: '#38bdf8', fontSize: 11 }}>
              🧠 Conciencia de Contexto en Tiempo Real del Senior AI:
            </strong>
            <span style={{ fontSize: 9, color: '#34d399' }}>Sincronizado con el Lienzo</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 10 }}>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: 8, borderRadius: 8 }}>
              <div style={{ color: 'var(--text-muted)' }}>Interlocutor Detectado:</div>
              <div style={{ fontWeight: 700, color: currentUser.color }}>
                {currentUser.name} • Rol: {currentUser.role}
              </div>
              <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>Entidad Seleccionada:</div>
              <div style={{ fontWeight: 700, color: '#fff' }}>
                {selectedEntity ? `${selectedEntity.name} (${selectedEntity.attributes.length} atrib.)` : 'Vista General del Proyecto'}
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: 8, borderRadius: 8 }}>
              <div style={{ color: 'var(--text-muted)' }}>Estado del Diagrama ({model.name}):</div>
              <div style={{ fontWeight: 700, color: '#34d399' }}>
                {model.entities.length} Tablas • {model.relationships.length} Relaciones • {model.functionalDependencies?.length || 0} DFs
              </div>
              <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>Auditoría Activa:</div>
              <div style={{ fontWeight: 700, color: audit.findings.length > 0 ? '#fbbf24' : '#34d399' }}>
                {audit.findings.length} sugerencia(s) arquitectónicas detectadas
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL DESPLEGABLE: CONFIGURACIÓN DEL MOTOR DE IA (GOOGLE GEMINI / MODELO LOCAL OLLAMA) */}
      {showConfigPanel && (
        <div
          style={{
            padding: 14,
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(168, 85, 247, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399' }}>
              ⚙️ Motor de IA Local (Ollama / Motor PUDS Offline)
            </span>
            <button
              className="btn-secondary"
              style={{ fontSize: 10, padding: '2px 8px' }}
              onClick={() => setShowConfigPanel(false)}
            >
              Listo
            </button>
          </div>

          {/* Selector de Proveedor (IA Local primero) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              { id: 'local_llm', label: 'IA Local (Ollama/PUDS)', sub: ollamaStatus?.online ? `● Ollama (${ollamaStatus.models.length} modelos)` : 'Local Offline Automático' },
              { id: 'builtin_senior', label: 'Motor Local PUDS', sub: '100% Sin Internet/API' },
              { id: 'google_gemini', label: 'Google Gemini AI', sub: 'Nube Opcional (API Key)' }
            ].map(p => {
              const active = aiConfig.provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onUpdateAIConfig({ ...aiConfig, provider: p.id as SeniorAIProvider })}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: active ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? '#34d399' : 'var(--border-subtle)'}`,
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{p.label}</div>
                  <div style={{ fontSize: 8, color: active ? '#a7f3d0' : 'var(--text-muted)' }}>{p.sub}</div>
                </button>
              );
            })}
          </div>

          {aiConfig.provider === 'local_llm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                    Endpoint Servidor Local (Ollama / LM Studio):
                  </label>
                  <input
                    type="text"
                    value={aiConfig.localEndpoint}
                    onChange={e => onUpdateAIConfig({ ...aiConfig, localEndpoint: e.target.value })}
                    placeholder="http://localhost:11434/api/chat"
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: 11,
                      borderRadius: 6,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                    Modelo Local:
                  </label>
                  {ollamaStatus?.online && ollamaStatus.models.length > 0 ? (
                    <select
                      value={aiConfig.localModel}
                      onChange={e => onUpdateAIConfig({ ...aiConfig, localModel: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: 11,
                        borderRadius: 6,
                        background: '#1e293b',
                        border: '1px solid #34d399',
                        color: '#fff'
                      }}
                    >
                      {ollamaStatus.models.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={aiConfig.localModel}
                      onChange={e => onUpdateAIConfig({ ...aiConfig, localModel: e.target.value })}
                      placeholder="llama3.2"
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: 11,
                        borderRadius: 6,
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid var(--border-subtle)',
                        color: '#fff'
                      }}
                    />
                  )}
                </div>
              </div>
              <div style={{ fontSize: 9.5, color: ollamaStatus?.online ? '#34d399' : '#94a3b8' }}>
                {ollamaStatus?.online
                  ? `✅ Ollama local conectado (${ollamaStatus.models.join(', ') || 'listo'}).`
                  : 'ℹ️ Si Ollama no está encendido, responde automáticamente el Motor IA Local PUDS integrado (sin APIs externas).'}
              </div>
            </div>
          )}

          {aiConfig.provider === 'google_gemini' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 8 }}>
              <div>
                <label style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                  Google Gemini API Key (opcional; usa Motor Local si está vacía):
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy... (Google AI Studio API Key)"
                  value={aiConfig.googleApiKey}
                  onChange={e => onUpdateAIConfig({ ...aiConfig, googleApiKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    fontSize: 11,
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                  Modelo de Google:
                </label>
                <select
                  value={aiConfig.googleModel}
                  onChange={e => onUpdateAIConfig({ ...aiConfig, googleModel: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    fontSize: 11,
                    borderRadius: 6,
                    background: '#1e293b',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff'
                  }}
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                  <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                  <option value="gemini-flash-latest">gemini-flash-latest</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LISTA DE MENSAJES DEL CHAT GRUPAL */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        {messages.map(msg => {
          const isAI = msg.senderType === 'senior_ai';
          const isCurrentSender = msg.senderId === currentUser.id && !isAI;

          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isAI ? 'flex-start' : isCurrentSender ? 'flex-end' : 'flex-start',
                maxWidth: isAI ? '94%' : '86%',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              {/* Cabecera del Mensaje con Identidad y Rol */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  justifyContent: isCurrentSender ? 'flex-end' : 'flex-start'
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: msg.senderColor
                  }}
                />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{msg.senderName}</span>
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 6px',
                    borderRadius: 6,
                    background: `${msg.senderColor}25`,
                    color: msg.senderColor,
                    fontWeight: 700
                  }}
                >
                  {msg.senderRole}
                </span>
                {isAI && msg.aiMetadata?.addressedTo && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '1px 6px',
                      borderRadius: 6,
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8'
                    }}
                  >
                    ➔ Respondiendo a {msg.aiMetadata.addressedTo} ({msg.aiMetadata.addressedRole})
                  </span>
                )}
              </div>

              {/* Cuerpo del Mensaje */}
              <div
                style={{
                  background: isAI
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(30, 41, 59, 0.9) 100%)'
                    : isCurrentSender
                    ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                    : 'rgba(255, 255, 255, 0.07)',
                  border: isAI
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : `1px solid ${msg.senderColor}55`,
                  borderRadius: 12,
                  padding: '10px 13px',
                  fontSize: 11.5,
                  lineHeight: 1.55,
                  color: '#f8fafc'
                }}
              >
                {msg.imageDataUrl && (
                  <div style={{ marginBottom: 8 }}>
                    <img
                      src={msg.imageDataUrl}
                      alt="Diagrama adjunto"
                      style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)' }}
                    />
                  </div>
                )}
                {renderFormattedText(msg.text)}

                {/* Snippet de Código Contextual si la IA lo incluye */}
                {isAI && msg.aiMetadata?.codeSnippet && (
                  <div
                    style={{
                      marginTop: 10,
                      background: '#090d16',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(255,255,255,0.05)',
                        fontSize: 9.5,
                        color: '#38bdf8',
                        fontWeight: 700,
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{msg.aiMetadata.codeSnippet.title}</span>
                      <span>{msg.aiMetadata.codeSnippet.language.toUpperCase()}</span>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        padding: 10,
                        fontSize: 10,
                        color: '#e2e8f0',
                        overflowX: 'auto',
                        fontFamily: 'monospace'
                      }}
                    >
                      {msg.aiMetadata.codeSnippet.code}
                    </pre>
                  </div>
                )}

                {/* Botón para aplicar solución propuesta por el Senior AI */}
                {isAI && msg.aiMetadata?.proposedChange && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      flexWrap: 'wrap'
                    }}
                  >
                    <span style={{ fontSize: 10, color: '#34d399', fontWeight: 600 }}>
                      {msg.aiMetadata.solutionApplied
                        ? '✓ Solución aplicada automáticamente (Modo Solucionador)'
                        : `💡 Propuesta lista: ${msg.aiMetadata.proposedChange.summary}`}
                    </span>
                    <button
                      className="btn-primary"
                      style={{
                        fontSize: 10,
                        padding: '5px 10px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        gap: 5
                      }}
                      onClick={() =>
                        onApplyChanges(
                          msg.aiMetadata!.proposedChange!.entities,
                          msg.aiMetadata!.proposedChange!.relationships,
                          msg.aiMetadata!.proposedChange!.summary
                        )
                      }
                    >
                      <Sparkles size={12} />
                      <span>Aplicar Solución del Senior al Diagrama</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Pie de metadatos del mensaje */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 9,
                  color: 'var(--text-muted)',
                  alignSelf: isCurrentSender ? 'flex-end' : 'flex-start'
                }}
              >
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isAI && msg.aiMetadata && (
                  <>
                    <span>•</span>
                    <span style={{ color: '#a5b4fc' }}>{msg.aiMetadata.providerUsed}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {isAIThinking && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: 11,
              color: '#34d399',
              alignSelf: 'flex-start'
            }}
          >
            <Sparkles size={13} />
            <span>
              El Senior AI está analizando la consulta de <strong>{currentUser.name}</strong> ({currentUser.role}) y el contexto de <strong>{model.name}</strong>...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* DEMOSTRACIÓN EN 1 CLIC: SIMULAR PREGUNTAS DE CADA ROL PUDS EN EL CHAT GRUPAL */}
      <div
        style={{
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 5
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Probar respuesta diferenciada por Rol en el Chat Grupal:
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          <button
            onClick={() => handleSimulateTeamRoleQuestion('Analista')}
            style={{
              fontSize: 10,
              padding: '4px 9px',
              borderRadius: 12,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#60a5fa',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            🟦 Pregunta como Analista (Negocio)
          </button>
          <button
            onClick={() => handleSimulateTeamRoleQuestion('Diseñador')}
            style={{
              fontSize: 10,
              padding: '4px 9px',
              borderRadius: 12,
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#c084fc',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            🟪 Pregunta como Diseñador (Normalización/FK)
          </button>
          <button
            onClick={() => handleSimulateTeamRoleQuestion('Implementador')}
            style={{
              fontSize: 10,
              padding: '4px 9px',
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            🟩 Pregunta como Implementador (Spring/SQL)
          </button>
        </div>
      </div>

      {/* FORMULARIO DE ENTRADA DEL CHAT GRUPAL */}
      <div
        onPaste={handleChatPaste}
        style={{
          padding: 12,
          background: 'rgba(0, 0, 0, 0.55)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={askSeniorDirectly}
              onChange={e => setAskSeniorDirectly(e.target.checked)}
            />
            <span>Pedir intervención del Senior AI Mentor al enviar</span>
          </label>
          <span style={{ color: currentUser.color, fontWeight: 700 }}>
            Escribiendo como: {currentUser.name} ({currentUser.role})
          </span>
        </div>

        {attachedImage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)'
          }}>
            <img src={attachedImage} alt="Preview" style={{ width: 42, height: 32, objectFit: 'cover', borderRadius: 4 }} />
            <span style={{ fontSize: 11, color: '#a7f3d0', flex: 1 }}>
              Imagen de diagrama UML lista para digitalizar y exportar al lienzo general
            </span>
            <button
              className="btn-icon"
              onClick={() => setAttachedImage(null)}
              title="Quitar imagen"
              style={{ width: 22, height: 22 }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        <input
          ref={chatImageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleAttachImageFile(f);
            e.target.value = '';
          }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => chatImageInputRef.current?.click()}
            title="Insertar o tomar foto de diagrama de clases para digitalizar con IA y exportarlo al lienzo"
            style={{
              padding: '0 10px',
              borderRadius: 10,
              borderColor: 'rgba(56, 189, 248, 0.45)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              flexShrink: 0
            }}
          >
            <Camera size={15} />
            <span style={{ fontSize: 10, fontWeight: 700 }}>Foto UML</span>
          </button>
          <input
            type="text"
            placeholder={
              attachedImage
                ? 'Opcional: escribe qué clases tiene o qué deseas editar en esta imagen...'
                : `Mensaje grupal como ${currentUser.name} (${currentUser.role}) o pega imagen (Ctrl+V)...`
            }
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${currentUser.color}66`,
              borderRadius: 10,
              padding: '9px 12px',
              color: '#fff',
              fontSize: 12
            }}
          />
          <button
            className="btn-primary"
            onClick={() => handleSend()}
            disabled={isAIThinking}
            style={{
              padding: '0 14px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700
            }}
          >
            <Send size={14} />
            <span>Enviar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

