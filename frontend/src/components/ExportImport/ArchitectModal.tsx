import React, { useState, useRef } from 'react';
import { X, FolderSync, Download, Upload, CheckCircle2, AlertCircle, FileCode } from 'lucide-react';
import { DiagramModel } from '../../types/case';
import { exportToEnterpriseArchitectXMI, exportToArchiXML, importFromArchitectXML } from '../../services/architectParser';

interface ArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DiagramModel;
  onImportModel: (newModel: DiagramModel, message: string) => void;
}

export const ArchitectModal: React.FC<ArchitectModalProps> = ({
  isOpen,
  onClose,
  model,
  onImportModel
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportEnterpriseArchitect = () => {
    const xmiContent = exportToEnterpriseArchitectXMI(model);
    const blob = new Blob([xmiContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${model.name.toLowerCase().replace(/\s+/g, '_')}_enterprise_architect.xmi`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportArchi = () => {
    const xmlContent = exportToArchiXML(model);
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${model.name.toLowerCase().replace(/\s+/g, '_')}_archi.xml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const result = importFromArchitectXML(content);
      if (result.success && result.model) {
        setImportStatus({ success: true, message: result.message });
        onImportModel(result.model, result.message);
      } else {
        setImportStatus({ success: false, message: result.message });
      }
    };
    reader.readAsText(file);
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
        maxWidth: 680,
        padding: 24,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--grad-cyan)', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderSync size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Interoperabilidad con Enterprise Architect & Archi</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Importación y exportación bidireccional completa (XMI 2.1 / XML Open Exchange)
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(0, 0, 0, 0.3)', padding: 4, borderRadius: 8, marginBottom: 20 }}>
          <button
            onClick={() => setActiveTab('export')}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 6,
              fontSize: 12,
              background: activeTab === 'export' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'export' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <Download size={13} /> Exportar hacia Architect
          </button>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 6,
              fontSize: 12,
              background: activeTab === 'import' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'import' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <Upload size={13} /> Importar desde Architect
          </button>
        </div>

        {/* Content Export */}
        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Opción 1: Enterprise Architect XMI */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Enterprise Architect (Sparx Systems)
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Genera archivo XMI 2.1 estándar de UML con {model.entities.length} clases y {model.relationships.length} asociaciones
                </div>
              </div>
              <button className="btn-primary" style={{ fontSize: 12 }} onClick={handleExportEnterpriseArchitect}>
                <Download size={14} /> Descargar .XMI
              </button>
            </div>

            {/* Opción 2: Archi / ArchiMate */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Archi (ArchiMate Open Exchange XML)
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Exporta modelo compatible con Archi como DataObjects y relaciones de asociación
                </div>
              </div>
              <button className="btn-secondary" style={{ fontSize: 12 }} onClick={handleExportArchi}>
                <Download size={14} /> Descargar .XML
              </button>
            </div>
          </div>
        )}

        {/* Content Import */}
        {activeTab === 'import' && (
          <div>
            <div style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: 12,
              padding: 30,
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.2)',
              marginBottom: 16
            }}>
              <FileCode size={36} color="var(--accent-cyan)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                Sube tu archivo .xmi o .xml de Enterprise Architect o Archi
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                Se mapearán automáticamente todas las clases, atributos, visibilidades y relaciones al canvas
              </div>
              <button
                className="btn-primary"
                style={{ fontSize: 12 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} /> Seleccionar Archivo (.xmi / .xml)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,.xmi"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>

            {importStatus && (
              <div style={{
                background: importStatus.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: `1px solid ${importStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: importStatus.success ? '#34d399' : '#fb7185'
              }}>
                {importStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
