import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  Folder, 
  FolderOpen, 
  Layers, 
  Terminal, 
  Code2, 
  Database,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { DiagramModel } from '../../types/case';
import { GeneratedFile, getSpringBootFiles, generateSpringBootProject } from '../../services/springBootGenerator';

interface BackendCodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DiagramModel;
}

export const BackendCodeViewerModal: React.FC<BackendCodeViewerModalProps> = ({
  isOpen,
  onClose,
  model
}) => {
  if (!isOpen) return null;

  const [basePackage, setBasePackage] = useState('com.caseai.backend');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copied, setCopied] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Archivos generados en memoria
  const files = useMemo(() => {
    return getSpringBootFiles(model, basePackage);
  }, [model, basePackage]);

  const [activeFilePath, setActiveFilePath] = useState<string>(
    files.find(f => f.category === 'Model (JPA)')?.path || files[0]?.path || ''
  );

  const activeFile = useMemo(() => {
    return files.find(f => f.path === activeFilePath) || files[0];
  }, [files, activeFilePath]);

  const filteredFiles = useMemo(() => {
    if (selectedCategory === 'All') return files;
    return files.filter(f => f.category === selectedCategory);
  }, [files, selectedCategory]);

  const categories = ['All', 'Model (JPA)', 'Repository', 'Service', 'Controller', 'DTO', 'Configuration', 'Testing'];

  const handleCopyCode = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFullZip = async () => {
    setIsDownloadingZip(true);
    try {
      const zipBlob = await generateSpringBootProject(model, basePackage);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backend-springboot-${model.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando Spring Boot ZIP:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const getFileIconColor = (category: string) => {
    switch (category) {
      case 'Model (JPA)': return '#38bdf8';
      case 'Repository': return '#34d399';
      case 'Service': return '#a78bfa';
      case 'Controller': return '#f43f5e';
      case 'DTO': return '#fbbf24';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: 20
    }}>
      <div className="glass-panel" style={{
        width: '95vw',
        maxWidth: 1280,
        height: '92vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 20,
        boxShadow: 'var(--shadow-lg), var(--shadow-glow-indigo)',
        overflow: 'hidden'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(17, 25, 46, 0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'var(--grad-primary)',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Code2 size={20} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fff' }}>
                  Explorador de Código Backend Spring Boot 3
                </h2>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                  {files.length} Archivos Generados
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Arquitectura Limpia: JPA Entities, Repositories, Services, REST Controllers y Colección Postman
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Descarga de Proyecto Completo */}
            <button
              className="btn-primary"
              onClick={handleDownloadFullZip}
              disabled={isDownloadingZip}
              style={{ fontSize: 12, padding: '8px 16px', background: 'var(--grad-primary)' }}
            >
              <Download size={14} />
              <span>{isDownloadingZip ? 'Comprimiendo ZIP...' : 'Descargar Proyecto Spring Boot (.ZIP)'}</span>
            </button>

            <button className="btn-icon" onClick={onClose} title="Cerrar visor">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de Filtros por Capa Arquitectónica */}
        <div style={{
          padding: '8px 16px',
          background: 'rgba(10, 15, 29, 0.8)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflowX: 'auto'
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Layers size={13} /> Capas:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 14,
                background: selectedCategory === cat ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Body Dividido: Árbol a la Izquierda, Editor a la Derecha */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Explorador de Archivos Lateral */}
          <div style={{
            width: 320,
            background: 'rgba(10, 15, 29, 0.95)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: 10
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px', letterSpacing: '0.05em' }}>
              Estructura Maven & Java
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
              {filteredFiles.map(file => {
                const isSelected = activeFilePath === file.path;
                const iconColor = getFileIconColor(file.category);
                return (
                  <div
                    key={file.path}
                    onClick={() => setActiveFilePath(file.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: 6,
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <FileCode size={14} color={iconColor} style={{ flexShrink: 0 }} />
                      <span style={{
                        fontSize: 12,
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {file.name}
                      </span>
                    </div>

                    <span style={{
                      fontSize: 9,
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: iconColor,
                      padding: '2px 5px',
                      borderRadius: 4,
                      flexShrink: 0
                    }}>
                      {file.category}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visor de Código (Editor IDE) */}
          <div style={{
            flex: 1,
            background: '#070b14',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header del Archivo Activo */}
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(17, 25, 46, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {activeFile?.path}
                </span>
                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: 10 }}>
                  {activeFile?.language.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                  onClick={handleCopyCode}
                >
                  {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  <span>{copied ? 'Copiado' : 'Copiar Código'}</span>
                </button>

                <button
                  className="btn-secondary"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                  onClick={handleDownloadSingleFile}
                  title="Descargar este archivo individual"
                >
                  <Download size={13} />
                  <span>Descargar Archivo</span>
                </button>
              </div>
            </div>

            {/* Código con Números de Línea */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              lineHeight: 1.6,
              color: '#f8fafc',
              background: '#070b14'
            }}>
              <pre style={{ margin: 0, display: 'flex' }}>
                {/* Números de línea */}
                <div style={{
                  paddingRight: 16,
                  marginRight: 16,
                  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.25)',
                  textAlign: 'right',
                  userSelect: 'none'
                }}>
                  {activeFile?.content.split('\n').map((_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>

                {/* Contenido de código */}
                <code style={{ flex: 1, whiteSpace: 'pre', color: '#e2e8f0' }}>
                  {activeFile?.content}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
