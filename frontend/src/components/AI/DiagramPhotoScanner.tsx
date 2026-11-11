import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Sparkles, CheckCircle2, Image as ImageIcon, Wand2 } from 'lucide-react';
import { executeVoiceCommand, processDiagramPhoto } from '../../services/aiAssistant';
import { DiagramModel } from '../../types/case';

interface DiagramPhotoScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPhotoModel: (entities: any[], relationships: any[], summary: string) => void;
}

export const DiagramPhotoScanner: React.FC<DiagramPhotoScannerProps> = ({
  isOpen,
  onClose,
  onApplyPhotoModel
}) => {
  if (!isOpen) return null;

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [photoHint, setPhotoHint] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [scanEngine, setScanEngine] = useState<'auto' | 'gemini' | 'local'>('auto');
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('case_ai_senior_config_v1');
      return raw ? JSON.parse(raw)?.googleApiKey || '' : '';
    } catch {
      return '';
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleGeminiKeyChange = (val: string) => {
    setGeminiKeyInput(val);
    try {
      const raw = localStorage.getItem('case_ai_senior_config_v1');
      const current = raw ? JSON.parse(raw) : {};
      localStorage.setItem('case_ai_senior_config_v1', JSON.stringify({ ...current, googleApiKey: val.trim() }));
    } catch {}
  };

  const loadImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setScanResult(null);
      setScanError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImageFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const blob = items[i].getAsFile();
        if (blob) {
          loadImageFile(blob);
          break;
        }
      }
    }
  };

  const handleScanImage = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    setScanError(null);
    setScanResult(null);
    try {
      const result = await processDiagramPhoto(imagePreview, photoHint, [], {
        engine: scanEngine,
        customGeminiApiKey: geminiKeyInput
      });
      if (result.entities.length === 0) {
        setScanError(result.summary);
      } else {
        setScanResult(result);
      }
    } catch (err: any) {
      console.error('Error scanning photo:', err);
      setScanError(err?.message ?? 'Error desconocido al analizar la imagen.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditScannedWithAI = () => {
    if (!scanResult || !editPrompt.trim()) return;
    const tempModel: DiagramModel = {
      id: 'photo_temp',
      name: 'Diagrama Escaneado',
      entities: scanResult.entities,
      relationships: scanResult.relationships,
      functionalDependencies: [],
      updatedAt: Date.now(),
      version: 1
    };
    const res = executeVoiceCommand(editPrompt, tempModel);
    if (res.actionType !== 'UNKNOWN') {
      setScanResult({
        entities: res.model.entities,
        relationships: res.model.relationships,
        summary: `${scanResult.summary} • Editado por IA: ${res.summary}`
      });
      setEditPrompt('');
    } else {
      setScanError('Prueba comandos como: "agregar atributo email a Paciente", "crear tabla Cita", o "relacionar Paciente con Doctor".');
    }
  };

  const handleLoadDemoPhoto = () => {
    // Foto de demostración simulada (canvas vectorizado con dibujo a mano)
    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 400;
    demoCanvas.height = 250;
    const ctx = demoCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 400, 250);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;

      // Dibujar caja Paciente
      ctx.strokeRect(30, 40, 130, 90);
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('Paciente', 40, 65);
      ctx.font = '11px sans-serif';
      ctx.fillText('+ id: Long [PK]', 40, 85);
      ctx.fillText('+ nombre: String', 40, 105);

      // Dibujar caja Doctor
      ctx.strokeRect(230, 40, 130, 90);
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Doctor', 240, 65);
      ctx.font = '11px sans-serif';
      ctx.fillText('+ id: Long [PK]', 240, 85);
      ctx.fillText('+ nombre: String', 240, 105);

      // Línea de relación
      ctx.beginPath();
      ctx.moveTo(160, 85);
      ctx.lineTo(230, 85);
      ctx.stroke();
      ctx.fillText('1:N', 185, 75);

      setImagePreview(demoCanvas.toDataURL());
      setScanResult(null);
    }
  };

  return (
    <div
      onPaste={handlePaste}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }}
    >
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: 620,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 24,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--grad-primary)', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Foto a Diagrama UML 2.5 + Edición con IA</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Digitaliza con Gemini Vision o IA Local (Ollama / OCR), edita clases y cárgalo al lienzo
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Selector de Motor de Visión (Cambiable en 1 clic: Auto / Gemini / Local) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginBottom: 14,
          padding: 10,
          borderRadius: 10,
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              { id: 'auto', label: 'Automático', sub: 'Ollama / Gemini / OCR' },
              { id: 'gemini', label: 'Gemini Vision', sub: 'Alta precisión (API Key)' },
              { id: 'local', label: '100% Local', sub: 'Ollama Vision / OCR' }
            ].map(item => {
              const active = scanEngine === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setScanEngine(item.id as any);
                    setScanError(null);
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 8,
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: active ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? '#818cf8' : 'var(--border-subtle)'}`,
                    color: '#fff'
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{item.label}</div>
                  <div style={{ fontSize: 9, color: active ? '#c7d2fe' : 'var(--text-muted)' }}>{item.sub}</div>
                </button>
              );
            })}
          </div>
          {(scanEngine === 'gemini' || scanEngine === 'auto') && (
            <input
              type="password"
              value={geminiKeyInput}
              onChange={e => handleGeminiKeyChange(e.target.value)}
              placeholder="Gemini API Key opcional (usa la de .env si la dejas vacía, o pega una AIzaSy...)"
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 11,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: '#fff'
              }}
            />
          )}
        </div>

        {/* Upload Area */}
        <div style={{
          border: '2px dashed var(--border-subtle)',
          borderRadius: 12,
          padding: 18,
          textAlign: 'center',
          marginBottom: 14,
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          {imagePreview ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <img
                src={imagePreview}
                alt="Diagrama preview"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Cambiar Imagen
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={12} /> Tomar Otra Foto
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <ImageIcon size={38} color="var(--text-muted)" />
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                Sube una imagen, toma una foto con cámara o pega una captura (Ctrl+V)
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  className="btn-primary"
                  style={{ fontSize: 12 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} /> Subir Imagen
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 12, borderColor: '#10b981', color: '#34d399' }}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={14} /> Tomar Foto
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 12 }}
                  onClick={handleLoadDemoPhoto}
                >
                  Cargar Boceto Ejemplo
                </button>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Contexto opcional + Scan */}
        {imagePreview && !scanResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              value={photoHint}
              onChange={e => setPhotoHint(e.target.value)}
              placeholder="Opcional: nombra las clases de tu foto si quieres guiar a la IA local (ej: Cliente Pedido Producto)"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 8,
                fontSize: 11.5,
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid var(--border-subtle)',
                color: '#fff'
              }}
            />
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '10px 0', fontSize: 13 }}
              onClick={handleScanImage}
              disabled={isAnalyzing}
            >
              <Sparkles size={16} />
              <span>
                {isAnalyzing
                  ? scanEngine === 'gemini'
                    ? 'Analizando con Gemini Vision...'
                    : 'Digitalizando diagrama...'
                  : scanEngine === 'gemini'
                  ? 'Digitalizar con Gemini Vision'
                  : scanEngine === 'local'
                  ? 'Digitalizar con IA Local'
                  : 'Digitalizar Diagrama con IA'}
              </span>
            </button>
          </div>
        )}

        {/* Error Panel */}
        {scanError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 8,
            padding: 12,
            marginTop: 12,
            fontSize: 12,
            color: '#fca5a5',
            lineHeight: 1.5
          }}>
            <strong style={{ display: 'block', marginBottom: 4, color: '#f87171' }}>⚠ Aviso:</strong>
            {scanError}
          </div>
        )}

        {/* Result Preview + Edición mediante IA */}
        {scanResult && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 10,
            padding: 14,
            marginTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontWeight: 700, fontSize: 13 }}>
                <CheckCircle2 size={16} />
                <span>¡Diagrama Reconocido ({scanResult.entities?.length || 0} clases)!</span>
              </div>
              {scanResult.providerUsed && (
                <span style={{ fontSize: 10, background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                  {scanResult.providerUsed}
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#f8fafc', margin: 0 }}>
              {scanResult.summary}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(scanResult.entities || []).map((ent: any) => (
                <span key={ent.id} style={{ fontSize: 11, background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#c7d2fe', padding: '2px 8px', borderRadius: 6 }}>
                  {ent.name} ({ent.attributes?.length || 0} atrib.)
                </span>
              ))}
            </div>

            {/* Edición rápida mediante IA antes de cargar al lienzo */}
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEditScannedWithAI()}
                placeholder="Editar con IA (ej: agregar atributo email a Paciente)..."
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#fff'
                }}
              />
              <button
                className="btn-secondary"
                style={{ fontSize: 11, padding: '6px 10px', borderColor: '#a855f7', color: '#e9d5ff' }}
                onClick={handleEditScannedWithAI}
              >
                <Wand2 size={12} /> Editar IA
              </button>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', fontSize: 12 }}
              onClick={() => {
                onApplyPhotoModel(scanResult.entities, scanResult.relationships, scanResult.summary);
                onClose();
              }}
            >
              Exportar / Cargar Clases al Lienzo General
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
