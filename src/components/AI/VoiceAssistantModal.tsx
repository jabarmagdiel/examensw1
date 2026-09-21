import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Wifi, WifiOff, RefreshCw, X, Volume2, CheckCircle2, BookOpen, ChevronRight, Play } from 'lucide-react';
import { DiagramModel, VoiceCommandQueueItem } from '../../types/case';
import { enqueueVoiceCommand, getOfflineVoiceQueue, processNaturalLanguagePrompt, saveOfflineVoiceQueue, VOICE_COMMANDS_GUIDE } from '../../services/aiAssistant';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DiagramModel;
  onApplyVoiceChanges: (entities: any[], relationships: any[], summary: string) => void;
  onQueueChange?: (count: number) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  model,
  onApplyVoiceChanges,
  onQueueChange
}) => {
  if (!isOpen) return null;

  const [isListening, setIsListening] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [assistantReply, setAssistantReply] = useState('Hola, soy tu asistente CASE-AI. Habla para modelar entidades y atributos.');
  const [queue, setQueue] = useState<VoiceCommandQueueItem[]>(getOfflineVoiceQueue());

  // Web Speech API para reconocimiento de voz del navegador
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'es-ES';

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpokenText(transcript);
        handleVoiceInput(transcript);
        setIsListening(false);
      };

      recog.onerror = () => {
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, [isOffline, model]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognition) recognition.stop();
      setIsListening(false);
    } else {
      setSpokenText('');
      if (recognition) {
        try {
          recognition.start();
          setIsListening(true);
        } catch (e) {
          console.warn('Error starting speech recognition:', e);
        }
      } else {
        // Fallback si el navegador no tiene habilitado el micrófono: simulación de comando
        const sampleCommands = [
          'Crear el sistema de veterinaria con pacientes, clientes y citas',
          'Agregar entidad Vacuna con atributos fecha y dosis',
          'Crear entidad Factura con total y fecha'
        ];
        const randomCmd = sampleCommands[Math.floor(Math.random() * sampleCommands.length)];
        setSpokenText(randomCmd);
        handleVoiceInput(randomCmd);
      }
    }
  };

  const handleVoiceInput = (text: string) => {
    if (isOffline) {
      // Modo desconectado: encolar en buffer local persistente
      const item = enqueueVoiceCommand(text);
      const updatedQueue = [...queue, item];
      setQueue(updatedQueue);
      onQueueChange?.(updatedQueue.length);

      const msg = `Modo Offline: Comando guardado en buffer local. Se sincronizará al restablecer la red.`;
      setAssistantReply(msg);
      speakText(msg);
    } else {
      // Modo conectado: procesar de inmediato
      const result = processNaturalLanguagePrompt(text, model);
      onApplyVoiceChanges(result.entities, result.relationships, result.summary);
      setAssistantReply(result.summary);
      speakText(result.summary);
    }
  };

  const handleSyncOfflineQueue = () => {
    if (queue.length === 0) return;

    let currentModelCopy = { ...model };
    let summaryList: string[] = [];

    for (const item of queue) {
      const res = processNaturalLanguagePrompt(item.transcript, currentModelCopy);
      currentModelCopy.entities = res.entities;
      currentModelCopy.relationships = res.relationships;
      summaryList.push(res.summary);
    }

    onApplyVoiceChanges(
      currentModelCopy.entities,
      currentModelCopy.relationships,
      `Sincronizados ${queue.length} comandos offline en lote.`
    );

    setQueue([]);
    saveOfflineVoiceQueue([]);
    onQueueChange?.(0);

    const reply = `¡Conexión restablecida! Se han sincronizado exitosamente ${summaryList.length} comandos de voz al diagrama colaborativo.`;
    setAssistantReply(reply);
    speakText(reply);
  };

  return (
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
      zIndex: 1000,
      padding: 20
    }}>
      {/* Device Frame (Mobile Assistant Voice-Only) */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: 420,
        height: 680,
        borderRadius: 36,
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '2px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), var(--shadow-glow-indigo)',
        position: 'relative'
      }}>
        {/* Top bar (Status, Network indicator, Close) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              CASE-AI MOBILE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Botón de Guía de Parámetros */}
            <button
              onClick={() => setShowGuide(!showGuide)}
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
                background: showGuide ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                color: showGuide ? '#a5b4fc' : '#cbd5e1',
                border: `1px solid ${showGuide ? '#6366f1' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Ver sintaxis y parámetros de comandos de voz"
            >
              <BookOpen size={11} />
              <span>{showGuide ? 'Voz' : 'Parámetros'}</span>
            </button>

            {/* Toggle Offline/Online */}
            <button
              onClick={() => setIsOffline(!isOffline)}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 20,
                background: isOffline ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isOffline ? '#fb7185' : '#34d399',
                border: `1px solid ${isOffline ? '#f43f5e' : '#10b981'}`
              }}
            >
              {isOffline ? <WifiOff size={11} /> : <Wifi size={11} />}
              <span>{isOffline ? 'Offline' : 'Online'}</span>
            </button>

            <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={onClose}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Center: Si showGuide está activo, mostrar tabla de parámetros; si no, orbe de voz */}
        {showGuide ? (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e0e7ff', marginBottom: 2 }}>
              📖 Guía de Parámetros de Voz:
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
              Usa estos parámetros exactos para diseñar o editar sin alterar otras tablas:
            </div>
            {VOICE_COMMANDS_GUIDE.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8' }}>
                    {item.action}
                  </span>
                  <button
                    onClick={() => {
                      setSpokenText(item.example);
                      handleVoiceInput(item.example);
                      setShowGuide(false);
                    }}
                    style={{
                      fontSize: 9,
                      background: 'rgba(99, 102, 241, 0.25)',
                      color: '#a5b4fc',
                      border: '1px solid #6366f1',
                      borderRadius: 10,
                      padding: '2px 7px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}
                    title="Probar este ejemplo ahora"
                  >
                    <Play size={8} /> Probar
                  </button>
                </div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#f1f5f9' }}>
                  {item.syntax}
                </div>
                <div style={{ fontSize: 9, color: '#94a3b8' }}>
                  ⚙️ <em>{item.parameters}</em>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px 10px' }}>
            {/* Pulsing Orb */}
            <div style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: isListening
                ? 'radial-gradient(circle, #f43f5e 0%, #a855f7 70%, transparent 100%)'
                : 'radial-gradient(circle, #6366f1 0%, #3b82f6 70%, transparent 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 28,
              boxShadow: isListening ? '0 0 40px rgba(244, 63, 94, 0.6)' : 'var(--shadow-glow-indigo)',
              animation: isListening ? 'pulseGlow 1s infinite alternate' : 'pulseGlow 3s infinite alternate'
            }}>
              {isListening ? (
                <Mic size={48} color="#fff" />
              ) : (
                <Volume2 size={44} color="#fff" />
              )}
            </div>

            {/* Assistant Voice Response Balloon */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 18,
              padding: 16,
              textAlign: 'center',
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              minHeight: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {assistantReply}
            </div>

            {/* Transcripción capturada */}
            {spokenText && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-accent)', textAlign: 'center' }}>
                &ldquo;{spokenText}&rdquo;
              </div>
            )}

            {/* Indicador de cola offline */}
            {queue.length > 0 && (
              <div style={{
                marginTop: 16,
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 12,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
              }}>
                <span style={{ fontSize: 11, color: '#fbbf24' }}>
                  📦 {queue.length} comando(s) en buffer offline
                </span>
                {!isOffline && (
                  <button
                    className="btn-primary"
                    style={{ fontSize: 10, padding: '4px 8px' }}
                    onClick={handleSyncOfflineQueue}
                  >
                    <RefreshCw size={11} /> Sincronizar
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom: Voice Action Button & Quick prompts */}
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              'Crear tabla Proveedor',
              'Añadir atributo telefono a Proveedor',
              'Editar atributo telefono a celular en Proveedor',
              'Añadir precio de tipo decimal a Producto',
              'Relacionar Proveedor con Producto',
              'Hacer id clave primaria en Proveedor'
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => {
                  setSpokenText(prompt);
                  handleVoiceInput(prompt);
                }}
                style={{
                  fontSize: 10,
                  padding: '5px 10px',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#93c5fd',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          <button
            onClick={toggleListening}
            style={{
              width: '100%',
              height: 54,
              borderRadius: 28,
              background: isListening ? 'var(--accent-rose)' : 'var(--grad-primary)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            <span>{isListening ? 'Escuchando... Toca para detener' : 'Presiona para Hablar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
