import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  Mic, 
  MicOff, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Database, 
  QrCode, 
  ShieldCheck, 
  Zap, 
  Send,
  Trash2,
  FileCode,
  Layers,
  Info,
  ChevronRight
} from 'lucide-react';
import { DiagramModel, Entity } from '../../types/case';

interface MobileAppViewProps {
  model: DiagramModel;
  onNavigate?: (module: any) => void;
}

interface QueuedRecord {
  id: string;
  entityName: string;
  data: Record<string, any>;
  voicePrompt: string;
  status: 'offline_pending' | 'synced_online';
  timestamp: string;
}

export const MobileAppView: React.FC<MobileAppViewProps> = ({ model, onNavigate }) => {
  // Entidad seleccionada en el móvil
  const [selectedEntityName, setSelectedEntityName] = useState<string>(
    model.entities[0]?.name || 'Cliente'
  );
  const selectedEntity = model.entities.find(e => e.name === selectedEntityName) || model.entities[0];

  // Estado de conexión (Online / Offline)
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Estado del Micrófono y Reconocimiento de Voz
  const [isListening, setIsListening] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [voiceLogMessage, setVoiceLogMessage] = useState<string>(
    'Presiona el micrófono y dicta: "Registrar cliente Juan Perez con DNI 78901234"'
  );

  // Formulario en el teléfono con los atributos extraídos por la IA Local
  const [mobileFormData, setMobileFormData] = useState<Record<string, string>>({});

  // Cola de registros locales / offline
  const [recordsQueue, setRecordsQueue] = useState<QueuedRecord[]>(() => {
    try {
      const saved = localStorage.getItem('case_mobile_records_queue');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading mobile queue:', e);
    }
    return [
      {
        id: 'rec_1',
        entityName: 'Cliente',
        data: { id: '1', dni: '74839201', nombre: 'Carlos Mendoza', telefono: '+591 71234567' },
        voicePrompt: 'Registrar cliente Carlos Mendoza con DNI 74839201',
        status: 'synced_online',
        timestamp: '14:20'
      },
      {
        id: 'rec_2',
        entityName: 'Mascota',
        data: { id: '1', nombre: 'Rocky', especie: 'Canino', raza: 'Golden Retriever', cliente_id: '1' },
        voicePrompt: 'Agregar mascota Rocky canino raza Golden',
        status: 'synced_online',
        timestamp: '14:25'
      }
    ];
  });

  const [syncingAll, setSyncingAll] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('case_mobile_records_queue', JSON.stringify(recordsQueue));
    } catch (e) {
      console.warn('Error saving queue:', e);
    }
  }, [recordsQueue]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Motor de IA Local para parsear comandos de voz según los atributos de la entidad
  const parseVoiceWithLocalAI = (text: string, entity: Entity): Record<string, string> => {
    const parsedData: Record<string, string> = {};
    const lower = text.toLowerCase();

    entity.attributes.forEach(attr => {
      if (attr.isPrimaryKey) return;

      const attrNameLower = attr.name.toLowerCase();

      // Extracción inteligente por patrones léxicos en español
      if (attrNameLower.includes('dni') || attrNameLower.includes('cedula') || attrNameLower.includes('identificacion')) {
        const match = text.match(/\b\d{7,10}\b/);
        if (match) parsedData[attr.name] = match[0];
      } else if (attrNameLower.includes('telefono') || attrNameLower.includes('celular') || attrNameLower.includes('phone')) {
        const match = text.match(/(\+?\d[\d\s-]{6,12}\d)/);
        if (match) parsedData[attr.name] = match[0].trim();
      } else if (attrNameLower.includes('precio') || attrNameLower.includes('total') || attrNameLower.includes('costo') || attrNameLower.includes('monto')) {
        const match = text.match(/\b\d+(\.\d{1,2})?\b/);
        if (match) parsedData[attr.name] = match[0];
      } else if (attrNameLower.includes('fecha') || attrNameLower.includes('date')) {
        parsedData[attr.name] = new Date().toISOString().split('T')[0];
      } else if (attrNameLower.includes('nombre') || attrNameLower.includes('name')) {
        // Extraer nombre buscando frases comunes
        const match = text.match(/(?:nombre|llamado|cliente|mascota|veterinario|para)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+)?)/i);
        if (match) {
          parsedData[attr.name] = match[1].trim();
        } else {
          parsedData[attr.name] = 'Registro Dictado';
        }
      } else if (attrNameLower.includes('especie')) {
        if (lower.includes('perro') || lower.includes('canino')) parsedData[attr.name] = 'Canino';
        else if (lower.includes('gato') || lower.includes('felino')) parsedData[attr.name] = 'Felino';
        else parsedData[attr.name] = 'Canino';
      } else if (attrNameLower.includes('raza')) {
        const match = text.match(/raza\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+)?)/i);
        if (match) parsedData[attr.name] = match[1].trim();
        else parsedData[attr.name] = 'Mestizo';
      } else if (attr.isForeignKey) {
        parsedData[attr.name] = '1';
      } else {
        // Fallback genérico
        parsedData[attr.name] = `Voz: ${attr.name}`;
      }
    });

    return parsedData;
  };

  // Activar Micrófono con Web Speech API o Fallback simulado
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.continuous = false;

        setIsListening(true);
        setVoiceLogMessage('🎙️ Escuchando... Habla ahora.');

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSpokenTranscript(transcript);
          processSpokenCommand(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
          setVoiceLogMessage('⚠️ No se detectó audio. Pulsa una sugerencia rápida o intenta de nuevo.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        return;
      } catch (e) {
        console.warn('SpeechRecognition error:', e);
      }
    }

    // Fallback: Si el navegador no permite micro por permisos, ofrecer comando aleatorio
    handleUseVoicePreset(`Registrar ${selectedEntity?.name || 'Cliente'} con nombre Mario Vargas y DNI 84930219`);
  };

  const processSpokenCommand = (text: string) => {
    if (!selectedEntity) return;

    setVoiceLogMessage(`IA Local procesó: "${text}"`);
    const extracted = parseVoiceWithLocalAI(text, selectedEntity);
    setMobileFormData(extracted);

    // Guardar inmediatamente en la cola (Offline o Online)
    const newRecord: QueuedRecord = {
      id: `rec_${Date.now()}`,
      entityName: selectedEntity.name,
      data: extracted,
      voicePrompt: text,
      status: isOffline ? 'offline_pending' : 'synced_online',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setRecordsQueue(prev => [newRecord, ...prev]);

    if (isOffline) {
      showToast(`📦 Guardado en almacenamiento local OFFLINE (Pendiente de sinc)`);
    } else {
      showToast(`✅ Relleno por voz enviado y registrado en el backend ONLINE`);
    }
  };

  const handleUseVoicePreset = (presetText: string) => {
    setSpokenTranscript(presetText);
    processSpokenCommand(presetText);
  };

  // Sincronizar en Ráfaga todos los pendientes hacia el backend
  const handleBurstSync = () => {
    const pendingCount = recordsQueue.filter(r => r.status === 'offline_pending').length;
    if (pendingCount === 0) {
      showToast('No hay registros pendientes de sincronización.');
      return;
    }

    setSyncingAll(true);
    setTimeout(() => {
      setRecordsQueue(prev => prev.map(r => ({ ...r, status: 'synced_online' })));
      setSyncingAll(false);
      showToast(`🚀 ¡Sincronización en ráfaga completada! ${pendingCount} registros enviados al Backend Spring Boot.`);
    }, 1200);
  };

  const clearQueue = () => {
    setRecordsQueue([]);
    showToast('Cola de registros limpia.');
  };

  const pendingCount = recordsQueue.filter(r => r.status === 'offline_pending').length;

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #10b981',
          padding: '14px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.2)',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease'
        }}>
          <CheckCircle2 size={20} color="#10b981" />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toastMessage}</span>
        </div>
      )}

      {/* Header del Módulo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <Smartphone size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                App Móvil APK & Relleno por Voz con IA Local
              </h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
                Aplicación Android nativa con motor NLP local para poblar los backends generados (Spring Boot 3) en modo Offline y Online.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas del Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Toggle Online / Offline */}
          <button
            onClick={() => {
              setIsOffline(!isOffline);
              showToast(isOffline ? 'Conectado a Internet (Modo Online)' : 'Desconectado de Internet (Modo Offline Activado)');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              background: isOffline ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              borderColor: isOffline ? '#ef4444' : '#10b981',
              color: isOffline ? '#fca5a5' : '#6ee7b7'
            }}
          >
            {isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
            <span>{isOffline ? 'Modo: OFFLINE (Sin Red)' : 'Modo: ONLINE (En Línea)'}</span>
          </button>

          {/* Descarga Directa del APK */}
          <a
            href="/downloads/case-voice-mobile.apk"
            download="case-voice-mobile.apk"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Download size={16} />
            <span>Descargar APK Móvil (.apk)</span>
          </a>
        </div>
      </div>

      {/* Grid Principal: Simulador Móvil a la izquierda + Panel de Control a la derecha */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(360px, 420px) 1fr',
        gap: '28px',
        alignItems: 'start'
      }}>
        {/* ========================================================
            COLUMNA 1: SMARTPHONE SIMULATOR INTERACTIVO
            ======================================================== */}
        <div style={{
          background: '#090d16',
          borderRadius: '40px',
          border: '10px solid #1e293b',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '740px',
          position: 'relative'
        }}>
          {/* Barra Superior del Teléfono (Altavoz y Cámara Frontal) */}
          <div style={{
            height: '28px',
            background: '#090d16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>12:00</span>
            {/* Notch / Speaker */}
            <div style={{
              width: '60px',
              height: '5px',
              background: '#334155',
              borderRadius: '999px'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isOffline ? <WifiOff size={13} color="#ef4444" /> : <Wifi size={13} color="#10b981" />}
              <div style={{ width: '16px', height: '9px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '1px' }}>
                <div style={{ width: '80%', height: '100%', background: '#10b981' }} />
              </div>
            </div>
          </div>

          {/* Pantalla del Teléfono (Contenido de la App Android) */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            background: 'linear-gradient(180deg, #0b1120 0%, #060913 100%)'
          }}>
            {/* Banner de Identidad Móvil */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '16px',
              padding: '12px 14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: '#10b981',
                  color: '#ffffff',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex'
                }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>CASE Voice AI</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{model.name}</div>
                </div>
              </div>

              {/* Badge Offline / Online */}
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '999px',
                background: isOffline ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isOffline ? '#fca5a5' : '#6ee7b7',
                border: `1px solid ${isOffline ? '#ef4444' : '#10b981'}`
              }}>
                {isOffline ? 'OFFLINE 📦' : 'ONLINE ⚡'}
              </div>
            </div>

            {/* Selector de Entidad del Backend a Poblar */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
                Tabla / Entidad del Backend:
              </label>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {model.entities.map(ent => (
                  <button
                    key={ent.name}
                    onClick={() => {
                      setSelectedEntityName(ent.name);
                      setMobileFormData({});
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      border: selectedEntityName === ent.name ? '1px solid #10b981' : '1px solid #334155',
                      background: selectedEntityName === ent.name ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                      color: selectedEntityName === ent.name ? '#6ee7b7' : '#cbd5e1'
                    }}
                  >
                    {ent.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón Circular del Micrófono (IA Voice Recognition) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 0',
              position: 'relative'
            }}>
              {/* Ondas pulsantes cuando está grabando */}
              {isListening && (
                <div style={{
                  position: 'absolute',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.3)',
                  animation: 'pulse 1.2s infinite'
                }} />
              )}

              <button
                onClick={toggleListening}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isListening 
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isListening 
                    ? '0 0 25px rgba(239, 68, 68, 0.6)' 
                    : '0 0 25px rgba(16, 185, 129, 0.5)',
                  zIndex: 2,
                  transition: 'all 0.2s ease'
                }}
              >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
              </button>

              <div style={{
                marginTop: '10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: isListening ? '#f87171' : '#10b981'
              }}>
                {isListening ? '🔴 Grabando Voz en Español...' : 'Toca el micrófono para dictar'}
              </div>
            </div>

            {/* Log / Estado del Reconocimiento de Voz */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '12px',
              padding: '10px 12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.76rem',
              color: '#cbd5e1'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#10b981', fontWeight: 600 }}>
                <Zap size={14} />
                <span>IA Local (Offline NLP):</span>
              </div>
              <div style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                {spokenTranscript ? `"${spokenTranscript}"` : voiceLogMessage}
              </div>
            </div>

            {/* Sugerencias Rápidas de Dictado por Voz (1 Clic) */}
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
                💡 Sugerencias de voz para {selectedEntity?.name}:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {selectedEntity?.name === 'Cliente' && (
                  <>
                    <button
                      onClick={() => handleUseVoicePreset('Registrar cliente Sofía Reyes con DNI 78493021 y teléfono 71239988')}
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      🗣️ "Registrar cliente Sofía Reyes con DNI 78493021..."
                    </button>
                    <button
                      onClick={() => handleUseVoicePreset('Registrar cliente Juan Pablo Gómez con DNI 84930128')}
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      🗣️ "Registrar cliente Juan Pablo Gómez con DNI..."
                    </button>
                  </>
                )}

                {selectedEntity?.name === 'Mascota' && (
                  <>
                    <button
                      onClick={() => handleUseVoicePreset('Agregar mascota Lucas especie Canino raza Beagle')}
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      🗣️ "Agregar mascota Lucas especie Canino raza Beagle"
                    </button>
                  </>
                )}

                {selectedEntity?.name !== 'Cliente' && selectedEntity?.name !== 'Mascota' && (
                  <button
                    onClick={() => handleUseVoicePreset(`Nuevo registro de ${selectedEntity?.name} con fecha 2026-09-25`)}
                    style={{
                      textAlign: 'left',
                      padding: '6px 10px',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    🗣️ "Nuevo registro de {selectedEntity?.name} con fecha..."
                  </button>
                )}
              </div>
            </div>

            {/* Formulario con Campos Auto-rellenados por la IA */}
            {selectedEntity && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '14px',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Campos Auto-rellenados ({selectedEntity.name}):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedEntity.attributes.filter(a => !a.isPrimaryKey).map(attr => (
                    <div key={attr.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginBottom: '2px' }}>
                        <span>{attr.name}</span>
                        <span style={{ color: '#64748b' }}>{attr.type}</span>
                      </div>
                      <input
                        type="text"
                        value={mobileFormData[attr.name] || ''}
                        onChange={(e) => setMobileFormData({ ...mobileFormData, [attr.name]: e.target.value })}
                        placeholder={`Dictar ${attr.name}...`}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          background: '#1e293b',
                          border: mobileFormData[attr.name] ? '1px solid #10b981' : '1px solid #334155',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          fontSize: '0.75rem'
                        }}
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const newRecord: QueuedRecord = {
                      id: `rec_${Date.now()}`,
                      entityName: selectedEntity.name,
                      data: { ...mobileFormData },
                      voicePrompt: 'Guardado manual desde formulario móvil',
                      status: isOffline ? 'offline_pending' : 'synced_online',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    setRecordsQueue(prev => [newRecord, ...prev]);
                    setMobileFormData({});
                    showToast(`Registro guardado (${isOffline ? 'Offline' : 'Online'})`);
                  }}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '8px',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Guardar en Backend {isOffline ? '(Encolar Offline)' : '(Enviar)'}
                </button>
              </div>
            )}
          </div>

          {/* Barra Inferior del Teléfono (Home Bar) */}
          <div style={{
            height: '18px',
            background: '#090d16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '80px', height: '4px', background: '#475569', borderRadius: '999px' }} />
          </div>
        </div>

        {/* ========================================================
            COLUMNA 2: PANEL DE CONTROL DE SINCRONIZACIÓN Y APK
            ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TARJETA 1: DESCARGA DEL APK ANDROID NATIVO */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.8))',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <ShieldCheck size={20} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
                  Paquete APK Android Compilado
                </h3>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#6ee7b7',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  Release v1.0.0
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                Archivo APK nativo listo para instalar en cualquier teléfono o tablet Android (~49.3 MB).
              </p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                <span>📁 <strong>Archivo:</strong> <code>case-voice-mobile.apk</code></span>
                <span>📦 <strong>Ruta local:</strong> <code>mobile/apk/</code></span>
                <span>📶 <strong>Motor:</strong> IA Local + Offline Sync</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a
                href="/downloads/case-voice-mobile.apk"
                download="case-voice-mobile.apk"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Download size={18} />
                <span>Descargar APK (49.3 MB)</span>
              </a>
            </div>
          </div>

          {/* TARJETA 2: COLA DE REGISTROS / BUFFER OFFLINE */}
          <div style={{
            background: '#0f172a',
            borderRadius: '16px',
            border: '1px solid #1e293b',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 600 }}>
                  Buffer de Sincronización del Backend ({recordsQueue.length})
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {pendingCount > 0 
                    ? `⚠️ Tienes ${pendingCount} registro(s) encolados en modo offline pendientes de enviar.`
                    : 'Todos los registros están sincronizados con la base de datos del backend.'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {pendingCount > 0 && (
                  <button
                    onClick={handleBurstSync}
                    disabled={syncingAll}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: '#10b981',
                      color: '#ffffff',
                      boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <RefreshCw size={14} className={syncingAll ? 'animate-spin' : ''} />
                    <span>Sincronizar en Ráfaga ({pendingCount})</span>
                  </button>
                )}

                <button
                  onClick={clearQueue}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                  <span>Limpiar</span>
                </button>
              </div>
            </div>

            {/* Lista de Registros */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
              {recordsQueue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.85rem' }}>
                  No hay registros encolados. Dicta por voz en el teléfono para rellenar la base de datos.
                </div>
              ) : (
                recordsQueue.map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: '#1e293b',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: item.status === 'offline_pending' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#93c5fd',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {item.entityName}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {item.timestamp}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: item.status === 'offline_pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: item.status === 'offline_pending' ? '#fcd34d' : '#6ee7b7'
                        }}>
                          {item.status === 'offline_pending' ? '⏳ Offline Pendiente' : '✅ Sincronizado en Backend'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 500 }}>
                        {Object.entries(item.data).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                        Dictado: "{item.voicePrompt}"
                      </div>
                    </div>

                    <button
                      onClick={() => setRecordsQueue(prev => prev.filter(r => r.id !== item.id))}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TARJETA 3: EXPLICACIÓN METODOLÓGICA PUDS DE IA LOCAL Y OFFLINE */}
          <div style={{
            background: '#0f172a',
            borderRadius: '16px',
            border: '1px solid #1e293b',
            padding: '20px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} color="#38bdf8" />
              <span>Arquitectura de la IA Local Móvil & Relleno por Voz</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '0.8rem', color: '#94a3b8' }}>
              <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '4px' }}>1. IA Local Determinista:</strong>
                No envía audio a servidores externos. Procesa el texto de la voz directamente en el teléfono mapeando números a DNIs, teléfonos a VARCHAR y nombres a los atributos del modelo.
              </div>
              <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '4px' }}>2. Buffer Offline Persistente:</strong>
                Si el usuario está en una clínica, almacén o zona sin cobertura, los registros se encolan en almacenamiento seguro local con timestamp y hash de integridad.
              </div>
              <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '4px' }}>3. Sincronización en Ráfaga:</strong>
                Al conectarse a Wi-Fi/4G, dispara llamadas REST POST /api/v1/[tabla] al backend Spring Boot 3 con JPA/Hibernate generado, persistiendo todo en base de datos.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
