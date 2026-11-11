import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Key } from 'lucide-react';
import { Attribute, DataType, Entity, EntityMethod } from '../../types/case';

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
  const defaultMethodsFor = (ent: Entity): EntityMethod[] =>
    ent.methods && ent.methods.length > 0
      ? [...ent.methods]
      : [
          { id: `meth_${ent.id}_1`, name: 'registrar', returnType: 'Boolean', visibility: 'public', parameters: [] },
          { id: `meth_${ent.id}_2`, name: 'actualizar', returnType: 'void', visibility: 'public', parameters: [] }
        ];

  const [name, setName] = useState(entity?.name || '');
  const [tableName, setTableName] = useState(entity?.tableName || (entity ? entity.name.toLowerCase() + 's' : ''));
  const [stereotype, setStereotype] = useState<NonNullable<Entity['stereotype']>>(entity?.stereotype || 'entity');
  const [attributes, setAttributes] = useState<Attribute[]>(entity ? [...entity.attributes] : []);
  const [methods, setMethods] = useState<EntityMethod[]>(entity ? defaultMethodsFor(entity) : []);

  useEffect(() => {
    if (entity) {
      setName(entity.name);
      setTableName(entity.tableName || entity.name.toLowerCase() + 's');
      setStereotype(entity.stereotype || 'entity');
      setAttributes([...entity.attributes]);
      setMethods(defaultMethodsFor(entity));
    }
  }, [entity]);

  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrType, setNewAttrType] = useState<DataType>('VARCHAR');
  const [newAttrVis, setNewAttrVis] = useState<NonNullable<Attribute['visibility']>>('private');
  const [newAttrIsPK, setNewAttrIsPK] = useState(false);
  const [newAttrNullable, setNewAttrNullable] = useState(false);

  const [newMethName, setNewMethName] = useState('');
  const [newMethParams, setNewMethParams] = useState('');
  const [newMethReturn, setNewMethReturn] = useState('void');
  const [newMethVis, setNewMethVis] = useState<EntityMethod['visibility']>('public');

  if (!isOpen || !entity) return null;

  const handleAddAttribute = () => {
    if (!newAttrName.trim()) return;
    const newAttr: Attribute = {
      id: `attr_${Date.now()}`,
      name: newAttrName.trim(),
      type: newAttrType,
      visibility: newAttrVis,
      isPrimaryKey: newAttrIsPK,
      isNullable: newAttrNullable,
      length: newAttrType === 'VARCHAR' ? 100 : undefined
    };
    setAttributes([...attributes, newAttr]);
    setNewAttrName('');
    setNewAttrIsPK(false);
    setNewAttrNullable(false);
  };

  const handleUpdateAttribute = (id: string, field: 'name' | 'type' | 'visibility', value: any) => {
    setAttributes(attributes.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleRemoveAttribute = (id: string) => {
    setAttributes(attributes.filter(a => a.id !== id));
  };

  const handleTogglePK = (id: string) => {
    setAttributes(attributes.map(a => a.id === id ? { ...a, isPrimaryKey: !a.isPrimaryKey } : a));
  };

  const handleAddMethod = () => {
    if (!newMethName.trim()) return;
    const paramsArr = newMethParams
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);
    setMethods([
      ...methods,
      {
        id: `meth_${Date.now()}`,
        name: newMethName.trim().replace(/\(\)$/, ''),
        returnType: newMethReturn.trim() || 'void',
        visibility: newMethVis,
        parameters: paramsArr
      }
    ]);
    setNewMethName('');
    setNewMethParams('');
  };

  const handleUpdateMethod = (id: string, field: keyof EntityMethod, value: any) => {
    setMethods(methods.map(m => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleRemoveMethod = (id: string) => {
    setMethods(methods.filter(m => m.id !== id));
  };

  const handleSave = () => {
    onSaveEntity({
      ...entity,
      name,
      tableName,
      stereotype,
      attributes,
      methods
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

        {/* Form Nombres + Estereotipo UML 2.5 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: 10, marginBottom: 16 }}>
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
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Estereotipo UML 2.5:</label>
            <select
              value={stereotype}
              onChange={e => setStereotype(e.target.value as NonNullable<Entity['stereotype']>)}
              style={{ width: '100%', background: '#11192e', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: 6, color: '#a5b4fc', fontSize: 12, fontWeight: 600 }}
            >
              <option value="entity">&laquo;entity&raquo;</option>
              <option value="class">&laquo;class&raquo;</option>
              <option value="abstract">&laquo;abstract&raquo;</option>
              <option value="interface">&laquo;interface&raquo;</option>
              <option value="enum">&laquo;enum&raquo;</option>
            </select>
          </div>
        </div>

        {/* Lista de Atributos Editables */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>
              Atributos de la Entidad ({attributes.length})
            </h3>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>
              💡 Puedes editar directamente el nombre o tipo de cada campo
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
            {attributes.map(attr => (
              <div
                key={attr.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <button
                  type="button"
                  onClick={() => handleTogglePK(attr.id)}
                  style={{
                    background: attr.isPrimaryKey ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: attr.isPrimaryKey ? '#fbbf24' : 'var(--text-muted)',
                    border: `1px solid ${attr.isPrimaryKey ? '#f59e0b' : 'var(--border-subtle)'}`,
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    flexShrink: 0
                  }}
                  title="Alternar Clave Primaria (PK)"
                >
                  <Key size={10} /> PK
                </button>

                <select
                  value={attr.visibility || 'private'}
                  onChange={e => handleUpdateAttribute(attr.id, 'visibility', e.target.value)}
                  title="Visibilidad UML (- private, + public, # protected, ~ package)"
                  style={{
                    width: 44,
                    background: '#11192e',
                    border: '1px solid var(--border-subtle)',
                    padding: '4px',
                    borderRadius: 4,
                    color: '#a5b4fc',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0
                  }}
                >
                  <option value="private">-</option>
                  <option value="public">+</option>
                  <option value="protected">#</option>
                  <option value="package">~</option>
                </select>

                <input
                  type="text"
                  value={attr.name}
                  onChange={e => handleUpdateAttribute(attr.id, 'name', e.target.value)}
                  style={{
                    flex: 2,
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid var(--border-subtle)',
                    padding: '5px 8px',
                    borderRadius: 4,
                    color: '#fff',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)'
                  }}
                  placeholder="Nombre atributo"
                />

                <select
                  value={attr.type}
                  onChange={e => handleUpdateAttribute(attr.id, 'type', e.target.value as DataType)}
                  style={{
                    flex: 1.2,
                    background: '#11192e',
                    border: '1px solid var(--border-subtle)',
                    padding: '5px 8px',
                    borderRadius: 4,
                    color: '#38bdf8',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <button
                  type="button"
                  className="btn-icon"
                  style={{ width: 26, height: 26, flexShrink: 0 }}
                  onClick={() => handleRemoveAttribute(attr.id)}
                  title="Eliminar atributo"
                >
                  <Trash2 size={13} color="#f43f5e" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Agregar Nuevo Atributo */}
        <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Agregar Atributo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 2fr 1.6fr auto auto', gap: 8, alignItems: 'center' }}>
            <select
              value={newAttrVis}
              onChange={e => setNewAttrVis(e.target.value as NonNullable<Attribute['visibility']>)}
              title="Visibilidad UML"
              style={{ background: '#11192e', border: '1px solid var(--border-subtle)', padding: '6px 6px', borderRadius: 6, color: '#a5b4fc', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}
            >
              <option value="private">-</option>
              <option value="public">+</option>
              <option value="protected">#</option>
              <option value="package">~</option>
            </select>
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

        {/* Operaciones / Métodos UML 2.5 (3er Compartimento) */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px 0', color: '#34d399' }}>
            Operaciones / Métodos UML 2.5 ({methods.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto', marginBottom: 8 }}>
            {methods.map(m => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255,255,255,0.03)',
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <select
                  value={m.visibility}
                  onChange={e => handleUpdateMethod(m.id, 'visibility', e.target.value)}
                  style={{ width: 42, background: '#11192e', border: '1px solid var(--border-subtle)', padding: 4, borderRadius: 4, color: '#34d399', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                >
                  <option value="public">+</option>
                  <option value="private">-</option>
                  <option value="protected">#</option>
                </select>
                <input
                  type="text"
                  value={m.name}
                  onChange={e => handleUpdateMethod(m.id, 'name', e.target.value)}
                  placeholder="metodo"
                  style={{ flex: 1.4, background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: 4, color: '#fff', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                />
                <input
                  type="text"
                  value={(m.parameters || []).join(', ')}
                  onChange={e =>
                    handleUpdateMethod(
                      m.id,
                      'parameters',
                      e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder="param: Tipo"
                  style={{ flex: 1.4, background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: 4, color: '#cbd5e1', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                />
                <input
                  type="text"
                  value={m.returnType}
                  onChange={e => handleUpdateMethod(m.id, 'returnType', e.target.value)}
                  placeholder="void"
                  style={{ width: 80, background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: 4, color: '#c084fc', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                />
                <button
                  type="button"
                  className="btn-icon"
                  style={{ width: 24, height: 24, flexShrink: 0 }}
                  onClick={() => handleRemoveMethod(m.id)}
                  title="Eliminar método"
                >
                  <Trash2 size={12} color="#f43f5e" />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '52px 1.4fr 1.4fr 84px auto', gap: 6, alignItems: 'center' }}>
            <select
              value={newMethVis}
              onChange={e => setNewMethVis(e.target.value as EntityMethod['visibility'])}
              style={{ background: '#11192e', border: '1px solid var(--border-subtle)', padding: '6px 4px', borderRadius: 6, color: '#34d399', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}
            >
              <option value="public">+</option>
              <option value="private">-</option>
              <option value="protected">#</option>
            </select>
            <input
              type="text"
              placeholder="Nuevo método (ej: calcularTotal)"
              value={newMethName}
              onChange={e => setNewMethName(e.target.value)}
              style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: 6, color: '#fff', fontSize: 11 }}
            />
            <input
              type="text"
              placeholder="Parámetros (ej: id: Long)"
              value={newMethParams}
              onChange={e => setNewMethParams(e.target.value)}
              style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: 6, color: '#fff', fontSize: 11 }}
            />
            <input
              type="text"
              placeholder="Retorno (void)"
              value={newMethReturn}
              onChange={e => setNewMethReturn(e.target.value)}
              style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: 6, color: '#c084fc', fontSize: 11 }}
            />
            <button type="button" className="btn-secondary" onClick={handleAddMethod} style={{ fontSize: 11 }}>
              <Plus size={13} /> Método
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
