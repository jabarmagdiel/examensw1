import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Sparkles, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { processDiagramPhoto } from '../../services/aiAssistant';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setScanResult(null);
        setScanError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanImage = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    setScanError(null);
    try {
      const result = await processDiagramPhoto(imagePreview);
      setScanResult(result);
    } catch (err: any) {
      console.error('Error scanning photo:', err);
      setScanError(err?.message ?? 'Error desconocido al analizar la imagen.');
    } finally {
      setIsAnalyzing(false);
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
    <div style={{
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
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: 580,
        padding: 24,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--grad-primary)', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Escanear Diagrama por Foto (Visión IA)</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Carga una foto de un diagrama dibujado en pizarra o cuaderno para digitalizarlo automáticamente
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Upload Area */}
        <div style={{
          border: '2px dashed var(--border-subtle)',
          borderRadius: 12,
          padding: 20,
          textAlign: 'center',
          marginBottom: 16,
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          {imagePreview ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                src={imagePreview}
                alt="Diagrama preview"
                style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, marginBottom: 12 }}
              />
              <button
                className="btn-secondary"
                style={{ fontSize: 11 }}
                onClick={() => fileInputRef.current?.click()}
              >
                Cambiar Imagen
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <ImageIcon size={40} color="var(--text-muted)" />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Arrastra una imagen de un diagrama o haz clic para subir
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-primary"
                  style={{ fontSize: 12 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} /> Seleccionar Archivo
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
        </div>

        {/* Scan Actions */}
        {imagePreview && !scanResult && (
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '10px 0', fontSize: 13 }}
            onClick={handleScanImage}
            disabled={isAnalyzing}
          >
            <Sparkles size={16} />
            <span>{isAnalyzing ? 'Analizando con Gemini Vision IA...' : 'Digitalizar Diagrama con IA'}</span>
          </button>
        )}

        {/* Error Panel */}
        {scanError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 8,
            padding: 14,
            marginTop: 14,
            fontSize: 12,
            color: '#fca5a5',
            lineHeight: 1.6
          }}>
            <strong style={{ display: 'block', marginBottom: 4, color: '#f87171' }}>⚠ Error al analizar la imagen:</strong>
            {scanError}
          </div>
        )}

        {/* Result Preview */}
        {scanResult && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 8,
            padding: 14,
            marginTop: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
              <CheckCircle2 size={16} />
              <span>¡Diagrama Reconocido Exitosamente!</span>
            </div>
            <p style={{ fontSize: 12, color: '#f8fafc', marginBottom: 12 }}>
              {scanResult.summary}
            </p>
            <button
              className="btn-primary"
              style={{ width: '100%', fontSize: 12 }}
              onClick={() => {
                onApplyPhotoModel(scanResult.entities, scanResult.relationships, scanResult.summary);
                onClose();
              }}
            >
              Cargar Entidades al Canvas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
