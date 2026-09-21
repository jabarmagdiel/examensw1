import React, { useState } from 'react';
import { X, Plus, Trash2, Key, Check } from 'lucide-react';
import { Attribute, DataType, Entity } from '../../types/case';

interface EditEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity | null;
  onSaveEntity: (updatedEntity: Entity) => void;
}

const DATA_TYPES: DataType[] = [
  'BIGINT',
  'INTEGER',
  'VARCHAR',
  'TEXT',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
  'DECIMAL',
  'FLOAT'
];

export const EditEntityModal: React.FC<EditEntityModalProps> = ({
  isOpen,
  onClose,
  entity,
  onSaveEntity
}) => {
  if (!isOpen || !entity) return null;

  const [name, setName] = useState(entity.name);
  const [tableName, setTableName] = useState(entity.tableName || entity.name.toLowerCase() + 's');
  const [attributes, setAttributes] = useState<Attribute[]>([...entity.attributes]);

  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrType, setNewAttrType] = useState<DataType>('VARCHAR');
  const [newAttrIsPK, setNewAttrIsPK] = useState(false);
  const [newAttrNullable, setNewAttrNullable] = useState(false);

  const handleAddAttribute = () => {
    if (!newAttrName.trim()) return;
    const newAttr: Attribute = {
      id: `attr_${Date.now()}`,
      name: newAttrName.trim(),
      type: newAttrType,
      isPrimaryKey: newAttrIsPK,
      isNullable: newAttrNullable,
      length: newAttrType === 'VARCHAR' ? 100 : undefined
    };
    setAttributes([...attributes, newAttr]);
    setNewAttrName('');
    setNewAttrIsPK(false);
    setNewAttrNullable(false);
  };

  const handleRemoveAttribute = (id: string) => {
    setAttributes(attributes.filter(a => a.id !== id));
  };

  const handleTogglePK = (id: string) => {
    setAttributes(attributes.map(a => a.id === id ? { ...a, isPrimaryKey: !a.isPrimaryKey } : a));
  };

  const handleSave = () => {
    onSaveEntity({
      ...entity,
      name,
      tableName,
      attributes
    });
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
        maxWidth: 620,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 24,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Editar Entidad: {entity.name}</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Form Nombres */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nombre Entidad / Clase:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nombre Tabla SQL:</label>
            <input
              type="text"
              value={tableName}
              onChange={e => setTableName(e.target.value)}
              style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12 }}
            />
          </div>
        </div>

        {/* Lista de Atributos */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
            Atributos de la Entidad ({attributes.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
            {attributes.map(attr => (
              <div
                key={attr.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-surface)',
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => handleTogglePK(attr.id)}
                    style={{
                      background: attr.isPrimaryKey ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: attr.isPrimaryKey ? '#fbbf24' : 'var(--text-muted)',
                      border: `1px solid ${attr.isPrimaryKey ? '#f59e0b' : 'var(--border-subtle)'}`,
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600
                    }}
                    title="Alternar Clave Primaria (PK)"
                  >
                    <Key size={10} style={{ marginRight: 2 }} /> PK
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{attr.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>({attr.type})</span>
                </div>

                <button
                  className="btn-icon"
                  style={{ width: 22, height: 22 }}
                  onClick={() => handleRemoveAttribute(attr.id)}
                >
                  <Trash2 size={12} color="#f43f5e" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Agregar Nuevo Atributo */}
        <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Agregar Atributo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Nombre atributo"
              value={newAttrName}
              onChange={e => setNewAttrName(e.target.value)}
              style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12 }}
            />
            <select
              value={newAttrType}
              onChange={e => setNewAttrType(e.target.value as DataType)}
              style={{ background: '#11192e', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12 }}
            >
              {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={newAttrIsPK}
                onChange={e => setNewAttrIsPK(e.target.checked)}
              /> PK
            </label>
            <button className="btn-secondary" onClick={handleAddAttribute} style={{ fontSize: 11 }}>
              <Plus size={13} /> Añadir
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-secondary" onClick={onClose} style={{ fontSize: 12 }}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} style={{ fontSize: 12 }}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};
