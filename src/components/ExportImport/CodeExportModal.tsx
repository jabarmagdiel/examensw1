import React, { useState } from 'react';
import { X, Download, FileCode, CheckCircle2, Terminal, Layers, Play } from 'lucide-react';
import { DiagramModel } from '../../types/case';
import { generateSpringBootProject } from '../../services/springBootGenerator';
import { generateFrontendProject } from '../../services/frontendGenerator';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DiagramModel;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  model
}) => {
  if (!isOpen) return null;

  const [isGeneratingBackend, setIsGeneratingBackend] = useState(false);
  const [isGeneratingFrontend, setIsGeneratingFrontend] = useState(false);
  const [basePackage, setBasePackage] = useState('com.caseai.backend');

  const handleDownloadBackend = async () => {
    setIsGeneratingBackend(true);
    try {
      const zipBlob = await generateSpringBootProject(model, basePackage);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backend-springboot-${model.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando Spring Boot:', err);
    } finally {
      setIsGeneratingBackend(false);
    }
  };

  const handleDownloadFrontend = async () => {
    setIsGeneratingFrontend(true);
    try {
      const zipBlob = await generateFrontendProject(model);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frontend-react-${model.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando Frontend:', err);
    } finally {
      setIsGeneratingFrontend(false);
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
        maxWidth: 720,
        padding: 24,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--grad-primary)', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCode size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Generación de Código Backend Spring Boot & Frontend</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Arquitectura en capas completa: Entities JPA, JpaRepositories, Services, REST Controllers y Colección Postman
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Configuration */}
        <div style={{ marginBottom: 16, background: 'var(--bg-surface)', padding: 14, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Paquete Base de Java:
          </label>
          <input
            type="text"
            value={basePackage}
            onChange={e => setBasePackage(e.target.value)}
            style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12, fontFamily: 'var(--font-mono)' }}
          />
        </div>

        {/* Summary of what will be generated */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div style={{ background: 'var(--bg-surface)', padding: 14, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)', marginBottom: 8 }}>
              <Layers size={14} /> Componentes Backend ({model.entities.length} entidades)
            </div>
            <ul style={{ fontSize: 11, color: 'var(--text-secondary)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>✓ {model.entities.length} Clases @Entity con JPA y Lombok</li>
              <li>✓ {model.entities.length} Interfaces JpaRepository</li>
              <li>✓ {model.entities.length} Clases Service (CRUD completo)</li>
              <li>✓ {model.entities.length} Controladores @RestController</li>
              <li>✓ pom.xml con Spring Boot 3 y base H2 / PostgreSQL</li>
              <li>✓ Colección Postman JSON auto-generada</li>
            </ul>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: 14, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 8 }}>
              <Terminal size={14} /> Cliente Frontend React de Pruebas
            </div>
            <ul style={{ fontSize: 11, color: 'var(--text-secondary)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>✓ Proyecto React + Vite listo para ejecutar</li>
              <li>✓ Formularios reactivos para cada entidad</li>
              <li>✓ Conexión directa a http://localhost:8080/api/v1</li>
              <li>✓ Operaciones GET, POST, PUT, DELETE en tiempo real</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn-primary"
            style={{ flex: 1, padding: '12px 0', fontSize: 13 }}
            onClick={handleDownloadBackend}
            disabled={isGeneratingBackend}
          >
            <Download size={16} />
            <span>{isGeneratingBackend ? 'Generando ZIP Spring Boot...' : 'Descargar Proyecto Spring Boot (.ZIP)'}</span>
          </button>

          <button
            className="btn-secondary"
            style={{ flex: 1, padding: '12px 0', fontSize: 13, borderColor: 'var(--accent-cyan)' }}
            onClick={handleDownloadFrontend}
            disabled={isGeneratingFrontend}
          >
            <Download size={16} color="var(--accent-cyan)" />
            <span>{isGeneratingFrontend ? 'Generando ZIP Frontend...' : 'Descargar Frontend React (.ZIP)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
