import React, { useState, useRef } from 'react';
import { 
  X, 
  FolderSync, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  Copy, 
  Check, 
  Sparkles,
  HelpCircle,
  Code2
} from 'lucide-react';
import { DiagramModel } from '../../types/case';
import { 
  exportToEnterpriseArchitectXMI, 
  exportToEnterpriseArchitectXMI11,
  exportToArchiXML, 
  importFromArchitectXML 
} from '../../services/architectParser';

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
  const [selectedFormat, setSelectedFormat] = useState<'ea_xmi21' | 'ea_xmi11' | 'archi_xml'>('ea_xmi21');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contenido XML dinámico según el formato seleccionado
  const generatedContent = React.useMemo(() => {
    if (selectedFormat === 'ea_xmi21') return exportToEnterpriseArchitectXMI(model);
    if (selectedFormat === 'ea_xmi11') return exportToEnterpriseArchitectXMI11(model);
    return exportToArchiXML(model);
  }, [model, selectedFormat]);

  const handleDownload = () => {
    let filename = `${model.name.toLowerCase().replace(/\s+/g, '_')}`;
    let ext = selectedFormat === 'ea_xmi21' ? 'xmi' : 'xml';

    if (selectedFormat === 'ea_xmi21') filename += '_sparx_ea_v21.xmi';
    else if (selectedFormat === 'ea_xmi11') filename += '_sparx_ea_v11.xml';
    else filename += '_archi_exchange.xml';

    const blob = new Blob([generatedContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // Cargar ejemplo de Enterprise Architect para pruebas inmediatas en 1 clic
  const handleLoadEASample = () => {
    const sampleXMI = `<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.1" xmlns:uml="http://schema.omg.org/spec/UML/2.1" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1">
  <uml:Model xmi:type="uml:Model" xmi:id="EA_Sample_Model" name="Sistema de Facturacion EA">
    <packagedElement xmi:type="uml:Package" xmi:id="EAPK_1" name="Facturacion">
      <packagedElement xmi:type="uml:Class" xmi:id="EAID_CLASE_1" name="Factura">
        <ownedAttribute xmi:type="uml:Property" xmi:id="ATTR_1" name="id">
          <type xmi:type="uml:PrimitiveType" href="http://schema.omg.org/spec/UML/2.1/uml.xml#Integer"/>
        </ownedAttribute>
        <ownedAttribute xmi:type="uml:Property" xmi:id="ATTR_2" name="numeroFactura">
          <type xmi:type="uml:PrimitiveType" href="http://schema.omg.org/spec/UML/2.1/uml.xml#String"/>
        </ownedAttribute>
        <ownedAttribute xmi:type="uml:Property" xmi:id="ATTR_3" name="fechaEmision">
          <type xmi:type="uml:PrimitiveType" href="http://schema.omg.org/spec/UML/2.1/uml.xml#DateTime"/>
        </ownedAttribute>
        <ownedAttribute xmi:type="uml:Property" xmi:id="ATTR_4" name="montoTotal">
          <type xmi:type="uml:PrimitiveType" href="http://schema.omg.org/spec/UML/2.1/uml.xml#Real"/>
        </ownedAttribute>
      </packagedElement>
      <packagedElement xmi:type="uml:Class" xmi:id="EAID_CLASE_2" name="DetalleFactura">
        <ownedAttribute xmi:type="uml:Property" xmi:id="ATTR_5" name="id">
          <type xmi:type="uml:PrimitiveType" href="http://schema.omg.org/spec/UML/2.1/uml.xml#Integer"/>
        </ownedAttribute>
        <ownedAttribute xmi:type="uml:Property" xmi:id="ATTR_6" name="cantidad">
          <type xmi:type="uml:PrimitiveType" href="http://schema.omg.org/spec/UML/2.1/uml.xml#Integer"/>
        </ownedAttribute>
        <ownedAttribute xmi:type="uml:Property" xmi:id="ATTR_7" name="precioUnitario">
          <type xmi:type="uml:PrimitiveType" href="http://schema.omg.org/spec/UML/2.1/uml.xml#Real"/>
        </ownedAttribute>
      </packagedElement>
      <packagedElement xmi:type="uml:Association" xmi:id="EAID_ASSOC_1" name="posee_detalles">
        <ownedEnd xmi:type="uml:Property" xmi:id="END_1" type="EAID_CLASE_1"/>
        <ownedEnd xmi:type="uml:Property" xmi:id="END_2" type="EAID_CLASE_2">
          <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="*"/>
        </ownedEnd>
      </packagedElement>
    </packagedElement>
  </uml:Model>
</xmi:XMI>`;

    const result = importFromArchitectXML(sampleXMI);
    if (result.success && result.model) {
      setImportStatus({ success: true, message: '✓ Modelo de ejemplo de Enterprise Architect cargado con éxito en el lienzo.' });
      onImportModel(result.model, result.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: 820,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 24,
        position: 'relative',
        borderRadius: 16
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--grad-cyan)', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderSync size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Interoperabilidad con Enterprise Architect & Archi
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Importación y exportación de diagramas y clases en formatos estándar XMI 2.1, XMI 1.1 y Archi Open Exchange
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Pestañas Exportar / Importar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
          <button
            className={activeTab === 'export' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('export')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
          >
            <Download size={15} />
            <span>Exportar Diagrama a Architect</span>
          </button>
          <button
            className={activeTab === 'import' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('import')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
          >
            <Upload size={15} />
            <span>Importar Archivo XML/XMI</span>
          </button>
        </div>

        {/* ========================================================
            TAB: EXPORTAR
            ======================================================== */}
        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Selector de Formatos de Exportación */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, display: 'block' }}>
                Selecciona el Formato Destino:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
                <div
                  onClick={() => setSelectedFormat('ea_xmi21')}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: selectedFormat === 'ea_xmi21' ? '2px solid #06b6d4' : '1px solid #334155',
                    background: selectedFormat === 'ea_xmi21' ? 'rgba(6, 182, 212, 0.15)' : '#1e293b'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13, color: '#f8fafc' }}>Sparx EA XMI 2.1</strong>
                    <span style={{ fontSize: 10, background: '#06b6d4', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>RECOMENDADO</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                    XMI 2.1 con diagramas visuales y coordenadas de nodos embebidas para Sparx Enterprise Architect.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedFormat('ea_xmi11')}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: selectedFormat === 'ea_xmi11' ? '2px solid #06b6d4' : '1px solid #334155',
                    background: selectedFormat === 'ea_xmi11' ? 'rgba(6, 182, 212, 0.15)' : '#1e293b'
                  }}
                >
                  <strong style={{ fontSize: 13, color: '#f8fafc', display: 'block', marginBottom: 4 }}>
                    Sparx EA XMI 1.1 Clásico
                  </strong>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                    Formato clásico universal OMG UML 1.3 compatible con cualquier versión de Enterprise Architect.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedFormat('archi_xml')}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: selectedFormat === 'archi_xml' ? '2px solid #06b6d4' : '1px solid #334155',
                    background: selectedFormat === 'archi_xml' ? 'rgba(6, 182, 212, 0.15)' : '#1e293b'
                  }}
                >
                  <strong style={{ fontSize: 13, color: '#f8fafc', display: 'block', marginBottom: 4 }}>
                    Archi Open Exchange
                  </strong>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                    Formato estándar The Open Group ArchiMate 3.0 para la herramienta Archi.
                  </p>
                </div>
              </div>
            </div>

            {/* Vista Previa del Código XML Generado */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                  Previsualización del Archivo ({selectedFormat === 'ea_xmi21' ? '.xmi' : '.xml'}):
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleCopyCode}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      fontSize: 11,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      color: '#cbd5e1',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <pre style={{
                background: '#090d16',
                borderRadius: 8,
                padding: 12,
                fontSize: 11,
                color: '#38bdf8',
                maxHeight: 180,
                overflowY: 'auto',
                border: '1px solid #1e293b',
                fontFamily: 'monospace',
                margin: 0
              }}>
                {generatedContent}
              </pre>
            </div>

            {/* Botón de Descarga */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Incluye <strong>{model.entities.length} clases</strong> y <strong>{model.relationships.length} asociaciones</strong>.
              </div>

              <button
                className="btn-primary"
                onClick={handleDownload}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13 }}
              >
                <Download size={16} />
                <span>Descargar Archivo para Enterprise Architect</span>
              </button>
            </div>

            {/* Guía Rápida de Importación en Sparx EA */}
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', fontSize: 11, color: '#cbd5e1' }}>
              <strong style={{ color: '#06b6d4', display: 'block', marginBottom: 4 }}>
                ℹ️ Cómo abrirlo en Sparx Enterprise Architect:
              </strong>
              1. En Enterprise Architect, haz clic derecho sobre un Paquete en el <em>Project Browser</em>.<br />
              2. Selecciona <strong>Import/Export ➔ Import Package from XMI File...</strong> (o presiona <kbd>Ctrl+Alt+X</kbd>).<br />
              3. Selecciona el archivo descargado y presiona <strong>Import</strong>. ¡El diagrama y las clases aparecerán inmediatamente!
            </div>
          </div>
        )}

        {/* ========================================================
            TAB: IMPORTAR
            ======================================================== */}
        {activeTab === 'import' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xml,.xmi"
              style={{ display: 'none' }}
            />

            {/* Zona Drag & Drop */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #06b6d4',
                borderRadius: 12,
                padding: '36px 20px',
                textAlign: 'center',
                background: 'rgba(6, 182, 212, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Upload size={36} color="#06b6d4" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
                Selecciona o arrastra tu archivo .XMI o .XML de Enterprise Architect
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                Compatible con XMI 2.1, XMI 1.1, Sparx Native XML y Archi Open Exchange
              </p>
            </div>

            {/* Botón para Probar con Ejemplo en 1 Clic */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#1e293b',
              padding: 12,
              borderRadius: 10,
              border: '1px solid #334155'
            }}>
              <div>
                <strong style={{ fontSize: 12, color: '#f8fafc', display: 'block' }}>
                  ¿No tienes un archivo XMI a mano?
                </strong>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  Prueba la importación instantánea con un modelo de prueba de Enterprise Architect (Factura y Detalle).
                </span>
              </div>
              <button
                className="btn-secondary"
                onClick={handleLoadEASample}
                style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Sparkles size={14} color="#06b6d4" />
                <span>Cargar Ejemplo EA</span>
              </button>
            </div>

            {/* Estado de la Importación */}
            {importStatus && (
              <div style={{
                padding: 14,
                borderRadius: 8,
                background: importStatus.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${importStatus.success ? '#10b981' : '#ef4444'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: importStatus.success ? '#6ee7b7' : '#fca5a5',
                fontSize: 12
              }}>
                {importStatus.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
