import React, { useState } from 'react';
import { X, Send, Sparkles, Bot, User, CornerDownLeft } from 'lucide-react';
import { DiagramModel } from '../../types/case';
import { processNaturalLanguagePrompt } from '../../services/aiAssistant';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  model: DiagramModel;
  onApplyChanges: (entities: any[], relationships: any[], summary: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  hasAction?: boolean;
  actionData?: { entities: any[]; relationships: any[]; summary: string };
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  model,
  onApplyChanges
}) => {
  if (!isOpen) return null;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm_1',
      sender: 'ai',
      text: '¡Hola! Soy tu copiloto de ingeniería de software. Puedes pedirme modelar dominios completos (ej. "diseña un sistema de veterinaria"), agregar entidades, sugerir relaciones o analizar la arquitectura.',
      timestamp: 'Ahora'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    setTimeout(() => {
      const result = processNaturalLanguagePrompt(text, model);
      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        sender: 'ai',
        text: result.summary,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasAction: true,
        actionData: result
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: 400,
      height: '100vh',
      background: 'rgba(10, 15, 29, 0.95)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'var(--grad-primary)', width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Copiloto IA CASE</h3>
            <span style={{ fontSize: 10, color: 'var(--accent-emerald)' }}>● Listo para modelar</span>
          </div>
        </div>
        <button className="btn-icon" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Messages List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            <div style={{
              background: msg.sender === 'user' ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.06)',
              padding: '10px 14px',
              borderRadius: 14,
              fontSize: 12,
              lineHeight: 1.5,
              border: msg.sender === 'ai' ? '1px solid var(--border-subtle)' : 'none',
              color: '#fff'
            }}>
              {msg.text}
            </div>

            {msg.hasAction && msg.actionData && (
              <button
                className="btn-primary"
                style={{ fontSize: 11, padding: '4px 10px', marginTop: 4, alignSelf: 'flex-start' }}
                onClick={() => onApplyChanges(msg.actionData!.entities, msg.actionData!.relationships, msg.actionData!.summary)}
              >
                <Sparkles size={12} /> Aplicar al Canvas
              </button>
            )}

            <span style={{ fontSize: 9, color: 'var(--text-muted)', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.timestamp}
            </span>
          </div>
        ))}
        {isProcessing && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={12} className="animate-pulse-glow" /> Analizando requisitos de software...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div style={{ padding: '0 16px 8px 16px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[
          'Modelar Veterinaria',
          'Agregar CitaMedica',
          'Agregar Historial'
        ].map(qp => (
          <button
            key={qp}
            onClick={() => handleSendMessage(qp)}
            style={{ fontSize: 10, padding: '4px 8px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Escribe tu requerimiento (ej: veterinaria)..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          style={{
            flex: 1,
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '8px 12px',
            color: '#fff',
            fontSize: 12
          }}
        />
        <button className="btn-primary" onClick={() => handleSendMessage()} style={{ width: 38, height: 38, padding: 0 }}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
