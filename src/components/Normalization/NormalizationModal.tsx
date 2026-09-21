import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, AlertTriangle, ArrowRight, Plus, Trash2, HelpCircle, Sparkles } from 'lucide-react';
import { Entity, FunctionalDependency, DiagramModel } from '../../types/case';
import { analyzeNormalization, computeAttributeClosure } from '../../services/normalizer';

interface NormalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DiagramModel;
  onApplyDecomposition: (originalEntityId: string, newEntities: Entity[]) => void;
  onSaveFDs: (fds: FunctionalDependency[]) => void;
}

export const NormalizationModal: React.FC<NormalizationModalProps> = ({
  isOpen,
  onClose,
  model,
  onApplyDecomposition,
  onSaveFDs
}) => {
  if (!isOpen) return null;

  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    model.entities[0]?.id || ''
  );

  const selectedEntity = useMemo(() => {
    return model.entities.find(e => e.id === selectedEntityId) || model.entities[0];
  }, [model.entities, selectedEntityId]);

  // Lista local de dependencias funcionales para la entidad
  const [localFDs, setLocalFDs] = useState<FunctionalDependency[]>(
    model.functionalDependencies || []
  );

  const [newDetAttr, setNewDetAttr] = useState<string>('');
  const [newDepAttr, setNewDepAttr] = useState<string>('');

  // Reporte de normalización calculado en vivo
  const report = useMemo(() => {
    if (!selectedEntity) return null;
    return analyzeNormalization(selectedEntity, localFDs);
  }, [selectedEntity, localFDs]);

  const handleAddFD = () => {
    if (!newDetAttr || !newDepAttr) return;
    const newFD: FunctionalDependency = {
      id: `fd_${Date.now()}`,
      determinant: newDetAttr.split(',').map(s => s.trim()).filter(Boolean),
      dependent: newDepAttr.split(',').map(s => s.trim()).filter(Boolean)
    };
    const updated = [...localFDs, newFD];
    setLocalFDs(updated);
    onSaveFDs(updated);
    setNewDetAttr('');
    setNewDepAttr('');
  };

  const handleRemoveFD = (id: string) => {
    const updated = localFDs.filter(f => f.id !== id);
    setLocalFDs(updated);
    onSaveFDs(updated);
  };

  const handleExecuteDecomposition = () => {
    if (!selectedEntity || !report || report.violations.length === 0) return;
    const violation = report.violations[0];
    if (!violation.proposedDecomposition) return;

    const newEntities: Entity[] = violation.proposedDecomposition.newEntities.map((ne, idx) => ({
      id: `norm_${Date.now()}_${idx}`,
      name: ne.name,
      tableName: ne.name.toLowerCase() + 's',
      x: selectedEntity.x + idx * 280,
      y: selectedEntity.y + 40,
      attributes: ne.attributes.map((attrName, aIdx) => ({
        id: `attr_${Date.now()}_${idx}_${aIdx}`,
        name: attrName,
        type: 'VARCHAR',
        isPrimaryKey: ne.primaryKey.includes(attrName),
        isNullable: false
      }))
    }));

    onApplyDecomposition(selectedEntity.id, newEntities);
    onClose();
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
        maxWidth: 960,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 24,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--grad-emerald)', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Motor de Normalización de Datos (1FN a BCNF)</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Especifica las Dependencias Funcionales y valida paso a paso según la teoría de bases de datos relacionales
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Entity Selector */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Entidad a Normalizar:</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {model.entities.map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedEntityId(e.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  background: selectedEntity?.id === e.id ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: selectedEntity?.id === e.id ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {e.name} ({e.attributes.length} attrs)
              </button>
            ))}
          </div>
        </div>

        {selectedEntity && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Left Col: Dependencias Funcionales especificadas por el usuario */}
            <div>
              <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--accent-text)' }}>
                  Atributos Disponibles en {selectedEntity.name}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedEntity.attributes.map(a => (
                    <span key={a.id} className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                      {a.name} {a.isPrimaryKey ? '★' : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Agregar DF */}
              <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  Especificar Dependencia Funcional (X → Y)
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder="Determinante X (ej: dni)"
                    value={newDetAttr}
                    onChange={e => setNewDetAttr(e.target.value)}
                    style={{ flex: 1, background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', padding: '8px 12px', borderRadius: 6, color: '#fff', fontSize: 12 }}
                  />
                  <ArrowRight size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Dependiente Y (ej: nombre, telefono)"
                    value={newDepAttr}
                    onChange={e => setNewDepAttr(e.target.value)}
                    style={{ flex: 1, background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', padding: '8px 12px', borderRadius: 6, color: '#fff', fontSize: 12 }}
                  />
                </div>
                <button className="btn-secondary" onClick={handleAddFD} style={{ width: '100%', fontSize: 12 }}>
                  <Plus size={14} />
                  <span>Registrar Dependencia Funcional</span>
                </button>
              </div>

              {/* Lista de DFs registradas */}
              <div>
                <h4 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Dependencias Registradas ({localFDs.length})
                </h4>
                {localFDs.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No hay dependencias registradas aún. Agrega una arriba.</p>
                ) : (
                  localFDs.map(fd => (
                    <div key={fd.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '6px 12px', borderRadius: 6, marginBottom: 6, border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                        {'{'}{fd.determinant.join(', ')}{'}'} &rarr; {'{'}{fd.dependent.join(', ')}{'}'}
                      </span>
                      <button className="btn-icon" style={{ width: 22, height: 22 }} onClick={() => handleRemoveFD(fd.id)}>
                        <Trash2 size={12} color="#f43f5e" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Col: Diagnóstico y Formas Normales */}
            <div>
              {report && (
                <div style={{ background: 'var(--bg-surface)', padding: 18, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Diagnóstico de Formas Normales</span>
                    {report.isBCNF ? (
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>Esquema BCNF</span>
                    ) : report.is3FN ? (
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>Esquema 3FN</span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>Requiere Normalización</span>
                    )}
                  </h3>

                  {/* Claves Candidatas */}
                  <div style={{ marginBottom: 14, fontSize: 12 }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Claves Candidatas Mínimas Identificadas:</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {report.candidateKeys.map((ck, i) => (
                        <span key={i} className="badge badge-pk" style={{ fontFamily: 'var(--font-mono)' }}>
                          {'{'}{ck.join(', ')}{'}'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Checklist de Formas Normales */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {[
                      { name: '1FN (Atomicidad)', status: report.is1FN, desc: 'Valores atómicos sin listas o atributos compuestos' },
                      { name: '2FN (Sin Dependencias Parciales)', status: report.is2FN, desc: 'Atributos no primos dependen de toda la clave' },
                      { name: '3FN (Sin Dependencias Transitivas)', status: report.is3FN, desc: 'Atributos no primos no dependen de otros no primos' },
                      { name: 'BCNF (Determinantes son Superclaves)', status: report.isBCNF, desc: 'Toda DF no trivial tiene superclave como determinante' }
                    ].map(fn => (
                      <div key={fn.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 6 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{fn.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fn.desc}</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: fn.status ? '#10b981' : '#f43f5e' }}>
                          {fn.status ? 'CUMPLE ✓' : 'VIOLA ✗'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Violaciones detectadas y solución */}
                  {report.violations.length > 0 && (
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fb7185', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                        <AlertTriangle size={14} />
                        <span>Violación detectada en {report.violations[0].normalForm}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#f8fafc', marginBottom: 8 }}>
                        {report.violations[0].violationDescription}
                      </p>
                      <p style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 12 }}>
                        <strong>Recomendación:</strong> {report.violations[0].recommendation}
                      </p>

                      {report.violations[0].proposedDecomposition && (
                        <button
                          className="btn-primary"
                          onClick={handleExecuteDecomposition}
                          style={{ width: '100%', fontSize: 12 }}
                        >
                          <Sparkles size={14} />
                          <span>Aplicar Descomposición al Diagrama</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
