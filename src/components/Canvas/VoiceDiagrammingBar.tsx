import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  X, 
  ArrowUpDown, 
  Minimize2,
  ChevronDown,
  BookOpen,
  Play
} from 'lucide-react';
import { DiagramModel } from '../../types/case';
import { executeVoiceCommand, VOICE_COMMANDS_GUIDE } from '../../services/aiAssistant';

interface VoiceDiagrammingBarProps {
  model: DiagramModel;
  onApplyVoiceResult: (updatedModel: DiagramModel, summary: string) => void;
}

export const VoiceDiagrammingBar: React.FC<VoiceDiagrammingBarProps> = ({
  model,
  onApplyVoiceResult
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'es-ES';

      recog.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleExecute(text);
        setIsListening(false);
      };

      recog.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, [model]);

  // Tecla Escape para minimizar la barra
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognition) recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      if (recognition) {
        try {
          recognition.start();
          setIsListening(true);
        } catch (err) {
          console.warn('Error starting speech recog:', err);
          setIsListening(false);
        }
      } else {
        const fallbackCommands = [
          'crear entidad Proveedor con nit y razonSocial',
          'añadir atributo telefono a Cliente',
          'añadir atributo precio de tipo decimal a Mascota',
          'relacionar Cliente con Mascota de uno a muchos'
        ];
        const picked = fallbackCommands[Math.floor(Math.random() * fallbackCommands.length)];
        setTranscript(picked);
        handleExecute(picked);
      }
    }
  };

  const handleExecute = (textToExecute?: string) => {
    const cmd = (textToExecute || transcript).trim();
    if (!cmd) return;

    const result = executeVoiceCommand(cmd, model);
    onApplyVoiceResult(result.model, result.summary);
    setLastFeedback(result.summary);
    speakResponse(result.summary);
    setTranscript('');
  };

  // MODO COLAPSADO: Botón flotante discreto (FAB)
  if (!isExpanded) {
    return (
      <div style={{
        position: 'absolute',
        bottom: 24,
        right: 86,
        zIndex: 60,
        pointerEvents: 'auto'
      }}>
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 30,
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(99, 102, 241, 0.45)',
            color: '#fff',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(99, 102, 241, 0.25)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          title="Diseñar diagrama con comandos de voz (Clic para abrir barra)"
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = '#818cf8';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.45)';
          }}
        >
          <div style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.6)'
          }}>
            <Mic size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#e0e7ff', letterSpacing: '-0.01em' }}>
            Diseñar por Voz
          </span>
          <span style={{
            fontSize: 9,
            background: 'rgba(99, 102, 241, 0.25)',
            color: '#a5b4fc',
            padding: '1px 6px',
            borderRadius: 10,
            fontWeight: 700
          }}>
            IA
          </span>
        </button>
      </div>
    );
  }

  // MODO EXPANDIDO: Barra flotante elegante con botón para ocultar y mover
  return (
    <div style={{
      position: 'absolute',
      top: position === 'top' ? 14 : 'auto',
      bottom: position === 'bottom' ? 24 : 'auto',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 65,
      width: '92%',
      maxWidth: 680,
      pointerEvents: 'auto',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel" style={{
        padding: '10px 14px',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.35)',
        border: '1.5px solid rgba(99, 102, 241, 0.5)',
        background: 'rgba(10, 15, 29, 0.94)',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Micrófono interactivo */}
          <button
            onClick={toggleListening}
            title={isListening ? 'Detener micrófono' : 'Hablar comando de graficado'}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: isListening ? '#f43f5e' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isListening ? '0 0 20px rgba(244, 63, 94, 0.7)' : '0 4px 12px rgba(99, 102, 241, 0.4)',
              animation: isListening ? 'pulseGlow 1s infinite alternate' : 'none',
              flexShrink: 0
            }}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Campo de Entrada de Voz / Texto */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              autoFocus
              placeholder={isListening ? '🎙️ Escuchando... Di: "Crear entidad Proveedor" o "Añadir campo precio a Mascota"' : 'Comando de voz o escribir: ej. "crear entidad Factura"'}
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExecute()}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 20,
                padding: '8px 38px 8px 14px',
                color: '#fff',
                fontSize: 12,
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleExecute()}
              style={{
                position: 'absolute',
                right: 5,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
              title="Ejecutar comando"
            >
              <Send size={12} />
            </button>
          </div>

          {/* Botón Ayuda */}
          <button
            className="btn-icon"
            style={{ width: 30, height: 30 }}
            onClick={() => setShowHelp(!showHelp)}
            title="Ver ejemplos de comandos de voz"
          >
            <HelpCircle size={15} />
          </button>

          {/* Botón Mover (Arriba / Abajo) */}
          <button
            className="btn-icon"
            style={{ width: 30, height: 30 }}
            onClick={() => setPosition(position === 'top' ? 'bottom' : 'top')}
            title={position === 'top' ? 'Mover barra abajo' : 'Mover barra arriba'}
          >
            <ArrowUpDown size={14} />
          </button>

          {/* Botón Minimizar / Ocultar */}
          <button
            className="btn-icon"
            style={{
              width: 30,
              height: 30,
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: 6
            }}
            onClick={() => setIsExpanded(false)}
            title="Minimizar barra a botón flotante (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Feedback de la última acción ejecutada */}
        {lastFeedback && (
          <div style={{
            marginTop: 8,
            fontSize: 11,
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '4px 10px',
            borderRadius: 6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} />
              <span>{lastFeedback}</span>
            </div>
            <button
              onClick={() => setLastFeedback(null)}
              style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', padding: 0 }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Comandos rápidos recomendados */}
        <div style={{ display: 'flex', gap: 5, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            Ejemplos:
          </span>
          {[
            'Crear tabla Proveedor',
            'Añadir atributo telefono a Proveedor',
            'Editar atributo telefono a celular en Proveedor',
            'Añadir precio de tipo decimal a Producto',
            'Relacionar Proveedor con Producto',
            'Hacer id clave primaria en Proveedor'
          ].map(example => (
            <button
              key={example}
              onClick={() => {
                setTranscript(example);
                handleExecute(example);
              }}
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#93c5fd',
                border: '1px solid rgba(147, 197, 253, 0.25)',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              &ldquo;{example}&rdquo;
            </button>
          ))}
        </div>

        {/* Guía desplegable de ayuda con parámetros exactos */}
        {showHelp && (
          <div style={{
            marginTop: 10,
            padding: 12,
            background: 'rgba(10, 15, 30, 0.98)',
            borderRadius: 10,
            border: '1px solid rgba(99, 102, 241, 0.35)',
            maxHeight: 260,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <div style={{ fontWeight: 700, color: '#e0e7ff', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={13} color="#818cf8" />
                <span>Parámetros de Comandos de Voz:</span>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}
              >
                ✕ Cerrar
              </button>
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>
              Cada comando actúa únicamente sobre los elementos especificados sin sobrescribir otras tablas:
            </div>
            {VOICE_COMMANDS_GUIDE.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 8,
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8' }}>{item.action}:</span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#f1f5f9' }}>{item.syntax}</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>
                    ⚙️ <em>{item.parameters}</em>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTranscript(item.example);
                    handleExecute(item.example);
                  }}
                  style={{
                    fontSize: 9,
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    borderRadius: 8,
                    padding: '2px 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    flexShrink: 0
                  }}
                  title="Ejecutar ejemplo"
                >
                  <Play size={8} /> Probar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
