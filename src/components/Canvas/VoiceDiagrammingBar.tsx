import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, Sparkles, Volume2, ArrowRight, HelpCircle, CheckCircle2 } from 'lucide-react';
import { DiagramModel } from '../../types/case';
import { executeVoiceCommand } from '../../services/aiAssistant';

interface VoiceDiagrammingBarProps {
  model: DiagramModel;
  onApplyVoiceResult: (updatedModel: DiagramModel, summary: string) => void;
}

export const VoiceDiagrammingBar: React.FC<VoiceDiagrammingBarProps> = ({
  model,
  onApplyVoiceResult
}) => {
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
        // Fallback simulación
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

  return (
    <div style={{
      position: 'absolute',
      top: 14,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 60,
      width: '90%',
      maxWidth: 820,
      pointerEvents: 'auto'
    }}>
      <div className="glass-panel" style={{
        padding: '10px 14px',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow-indigo)',
        border: '1px solid var(--border-active)',
        background: 'rgba(10, 15, 29, 0.88)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Micrófono interactivo */}
          <button
            onClick={toggleListening}
            title={isListening ? 'Detener micrófono' : 'Hablar comando de graficado'}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: isListening ? 'var(--accent-rose)' : 'var(--grad-primary)',
              color: '#fff',
              boxShadow: isListening ? '0 0 20px rgba(244, 63, 94, 0.7)' : '0 4px 12px rgba(99, 102, 241, 0.4)',
              animation: isListening ? 'pulseGlow 1s infinite alternate' : 'none',
              flexShrink: 0
            }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Campo de Entrada de Voz / Texto */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder={isListening ? '🎙️ Escuchando... Di: "Crear entidad Proveedor" o "Añadir atributo precio a Producto"' : 'Graficar por voz o escribir comando: ej. "añadir atributo telefono a Cliente"'}
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExecute()}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 24,
                padding: '10px 42px 10px 16px',
                color: '#fff',
                fontSize: 13,
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleExecute()}
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                color: '#fff',
                padding: 0
              }}
              title="Ejecutar comando de graficado"
            >
              <Send size={13} />
            </button>
          </div>

          <button
            className="btn-icon"
            style={{ width: 34, height: 34 }}
            onClick={() => setShowHelp(!showHelp)}
            title="Ver ejemplos de comandos de graficado por voz"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        {/* Feedback de la última acción */}
        {lastFeedback && (
          <div style={{
            marginTop: 8,
            fontSize: 11,
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '4px 10px',
            borderRadius: 6
          }}>
            <CheckCircle2 size={13} />
            <span>{lastFeedback}</span>
          </div>
        )}

        {/* Comandos rápidos recomendados */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            Ejemplos de Voz:
          </span>
          {[
            'crear entidad Proveedor con nit y direccion',
            'añadir atributo telefono a Cliente',
            'añadir atributo precio de tipo decimal a Mascota',
            'relacionar Cliente con Mascota de uno a muchos',
            'hacer que dni sea clave primaria en Cliente',
            'eliminar entidad HistorialClinico',
            'modelar Farmacia'
          ].map(example => (
            <button
              key={example}
              onClick={() => {
                setTranscript(example);
                handleExecute(example);
              }}
              style={{
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap'
              }}
            >
              &ldquo;{example}&rdquo;
            </button>
          ))}
        </div>

        {/* Guía desplegable de ayuda de comandos */}
        {showHelp && (
          <div style={{
            marginTop: 10,
            padding: 10,
            background: 'var(--bg-surface)',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
            lineHeight: 1.6,
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              🎙️ Sintaxis de Comandos de Voz Admitidos:
            </div>
            <div>• <strong>Crear clase/entidad:</strong> &ldquo;Crear entidad Proveedor&rdquo; o &ldquo;Crear clase Factura con total y fecha&rdquo;</div>
            <div>• <strong>Añadir atributo con tipo:</strong> &ldquo;Añadir atributo nombre de tipo texto a Proveedor&rdquo; o &ldquo;Añadir campo precio decimal a Producto&rdquo;</div>
            <div>• <strong>Establecer Clave Primaria:</strong> &ldquo;Hacer que dni sea clave primaria en Cliente&rdquo;</div>
            <div>• <strong>Graficar relación:</strong> &ldquo;Crear relación de uno a muchos entre Cliente y Mascota&rdquo;</div>
            <div>• <strong>Eliminar elemento:</strong> &ldquo;Eliminar entidad HistorialClinico&rdquo;</div>
            <div>• <strong>Diseñar dominio completo:</strong> &ldquo;Modelar sistema de Farmacia&rdquo; o &ldquo;Diseñar Veterinaria&rdquo;</div>
          </div>
        )}
      </div>
    </div>
  );
};
