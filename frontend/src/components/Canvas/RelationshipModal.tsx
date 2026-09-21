import React, { useState } from 'react';
import { X, Link2, Key, Check, Trash2, ArrowRight, HelpCircle, Layers } from 'lucide-react';
import { Cardinality, Entity, Relationship } from '../../types/case';

interface RelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceEntity: Entity | null;
  targetEntity: Entity | null;
  existingRelationship?: Relationship | null;
  onSaveRelationship: (relData: {
    id?: string;
    sourceEntityId: string;
    targetEntityId: string;
    cardinality: Cardinality;
    name: string;
    foreignKeyName: string;
    createForeignKeyAttribute: boolean;
  }) => void;
  onDeleteRelationship?: (relationshipId: string) => void;
}

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  isOpen,
  onClose,
  sourceEntity,
  targetEntity,
  existingRelationship,
  onSaveRelationship,
  onDeleteRelationship
}) => {
  if (!isOpen || !sourceEntity || !targetEntity) return null;

  const [cardinality, setCardinality] = useState<Cardinality>(
    existingRelationship?.cardinality || '1:N'
  );
  const [relName, setRelName] = useState(
    existingRelationship?.name || 'posee'
  );
  const defaultFkName = `${sourceEntity.name.toLowerCase()}_id`;
  const [foreignKeyName, setForeignKeyName] = useState(
    existingRelationship?.foreignKeyAttributeName || defaultFkName
  );
  const [createForeignKeyAttribute, setCreateForeignKeyAttribute] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRelationship({
      id: existingRelationship?.id,
      sourceEntityId: sourceEntity.id,
      targetEntityId: targetEntity.id,
      cardinality,
      name: relName.trim() || 'relaciona',
      foreignKeyName: foreignKeyName.trim() || defaultFkName,
      createForeignKeyAttribute
    });
    onClose();
  };

  const getExplanation = () => {
    switch (cardinality) {
      case '1:1':
        return `Cada ${sourceEntity.name} se asocia exactamente con un(a) ${targetEntity.name}. La Clave Foránea (FK) se coloca en ${targetEntity.name}.`;
      case '1:N':
        return `Un(a) ${sourceEntity.name} puede tener múltiples ${targetEntity.name}s. La Clave Foránea (FK) se ubica en la tabla ${targetEntity.name} apuntando al ID de ${sourceEntity.name}.`;
      case 'N:M':
        return `Múltiples ${sourceEntity.name}s se asocian con múltiples ${targetEntity.name}s. Se generará una tabla intermedia con ambas Claves Foráneas.`;
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
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: 20
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: 580,
        padding: 24,
        borderRadius: 20,
        boxShadow: 'var(--shadow-lg), var(--shadow-glow-indigo)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'var(--grad-primary)',
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Link2 size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fff' }}>
                {existingRelationship ? 'Editar Relación & Foreign Key' : 'Configurar Enlace & Foreign Key (FK)'}
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Define la cardinalidad y la clave foránea entre las entidades
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Diagrama visual de las dos tablas a conectar */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Tabla Origen */}
          <div style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${sourceEntity.color || 'var(--accent-primary)'}`,
            borderRadius: 8,
            padding: '8px 12px',
            textAlign: 'center',
            minWidth: 120
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Origen (1)</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{sourceEntity.name}</div>
            <div style={{ fontSize: 10, color: '#fbbf24', marginTop: 2 }}>PK: id</div>
          </div>

          {/* Indicador de relación central */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span className="badge" style={{ background: 'var(--grad-primary)', color: '#fff', fontSize: 11, padding: '2px 8px' }}>
              {cardinality}
            </span>
            <div style={{ fontSize: 11, color: 'var(--text-accent)', fontWeight: 600 }}>
              &laquo;{relName || 'enlace'}&raquo;
            </div>
            <ArrowRight size={18} color="var(--accent-primary)" />
          </div>

          {/* Tabla Destino */}
          <div style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${targetEntity.color || 'var(--accent-primary)'}`,
            borderRadius: 8,
            padding: '8px 12px',
            textAlign: 'center',
            minWidth: 120
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Destino ({cardinality === '1:1' ? '1' : 'N'})
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{targetEntity.name}</div>
            <div style={{ fontSize: 10, color: '#38bdf8', marginTop: 2 }}>FK: {foreignKeyName}</div>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Selector de Cardinalidad */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Cardinalidad de la Relación:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { id: '1:1', label: '1:1 (Uno a Uno)', desc: 'Ej: Mascota y Ficha Única' },
                { id: '1:N', label: '1:N (Uno a Muchos)', desc: 'Ej: Cliente y Mascotas' },
                { id: 'N:M', label: 'N:M (Muchos a Muchos)', desc: 'Ej: Estudiantes y Cursos' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCardinality(opt.id as Cardinality)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: cardinality === opt.id ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    border: `1px solid ${cardinality === opt.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    color: cardinality === opt.id ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</div>
                  <div style={{ fontSize: 9, opacity: 0.8, marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <HelpCircle size={12} /> {getExplanation()}
            </div>
          </div>

          {/* Nombre del verbo / relación */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Nombre de la Relación (Verbo de asociación):
            </label>
            <input
              type="text"
              placeholder="ej: posee, agenda, atiende, registra"
              value={relName}
              onChange={e => setRelName(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '7px 12px',
                color: '#fff',
                fontSize: 12
              }}
            />
          </div>

          {/* Configuración de la Foreign Key (FK) */}
          <div style={{
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: 10,
            padding: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Key size={14} color="#38bdf8" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8' }}>
                Configuración de la Foreign Key (Clave Foránea)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>
                  Nombre del campo FK en <strong style={{ color: '#fff' }}>{targetEntity.name}</strong>:
                </label>
                <input
                  type="text"
                  value={foreignKeyName}
                  onChange={e => setForeignKeyName(e.target.value)}
                  placeholder="ej: cliente_id"
                  style={{
                    width: '100%',
                    background: '#0a0f1d',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    color: '#38bdf8',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>
                  Apunta al campo de <strong style={{ color: '#fff' }}>{sourceEntity.name}</strong>:
                </label>
                <input
                  type="text"
                  value="id (BIGINT / Clave Primaria)"
                  disabled
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    color: 'var(--text-muted)',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              color: 'var(--text-primary)',
              marginTop: 10,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={createForeignKeyAttribute}
                onChange={e => setCreateForeignKeyAttribute(e.target.checked)}
              />
              <span>
                Insertar automáticamente el atributo <strong>{foreignKeyName}</strong> con etiqueta <strong>[FK]</strong> en la tabla <strong>{targetEntity.name}</strong>
              </span>
            </label>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            {existingRelationship && onDeleteRelationship ? (
              <button
                type="button"
                className="btn-secondary"
                style={{ color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)', fontSize: 12 }}
                onClick={() => {
                  onDeleteRelationship(existingRelationship.id);
                  onClose();
                }}
              >
                <Trash2 size={13} /> Eliminar Relación
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn-secondary" onClick={onClose} style={{ fontSize: 12 }}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" style={{ fontSize: 12 }}>
                <Check size={14} />
                <span>{existingRelationship ? 'Actualizar Relación' : 'Establecer Relación & FK'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
