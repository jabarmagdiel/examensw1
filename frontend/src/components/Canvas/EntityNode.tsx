import React from 'react';
import { Key, Plus, Trash2, Edit2, Link } from 'lucide-react';
import { Entity, Attribute, DataType } from '../../types/case';

interface EntityNodeProps {
  entity: Entity;
  viewMode: 'conceptual' | 'logical' | 'physical' | 'uml';
  isSelected: boolean;
  isConnectingSource?: boolean;
  onSelect: () => void;
  onUpdatePosition: (x: number, y: number) => void;
  onEditEntity: (entity: Entity) => void;
  onDeleteEntity: (entityId: string) => void;
  onStartConnect: (entityId: string) => void;
}

export const EntityNode: React.FC<EntityNodeProps> = ({
  entity,
  viewMode,
  isSelected,
  isConnectingSource,
  onSelect,
  onUpdatePosition,
  onEditEntity,
  onDeleteEntity,
  onStartConnect
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: entity.x,
      startY: entity.y
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.mouseX;
      const dy = moveEvent.clientY - dragStartRef.current.mouseY;
      onUpdatePosition(
        Math.max(20, Math.round((dragStartRef.current.startX + dx) / 10) * 10),
        Math.max(20, Math.round((dragStartRef.current.startY + dy) / 10) * 10)
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const getHeaderColor = () => {
    if (entity.color) return entity.color;
    return '#4f46e5';
  };

  return (
    <div
      className={`entity-box ${isSelected ? 'selected' : ''}`}
      style={{
        left: entity.x,
        top: entity.y,
        borderColor: isConnectingSource ? '#10b981' : isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
        boxShadow: isConnectingSource ? '0 0 20px rgba(16, 185, 129, 0.6)' : undefined
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        className="entity-header"
        style={{
          background: `linear-gradient(135deg, ${getHeaderColor()}22 0%, rgba(17, 25, 46, 0.95) 100%)`,
          borderLeft: `4px solid ${isConnectingSource ? '#10b981' : getHeaderColor()}`
        }}
      >
        <div>
          {isConnectingSource && (
            <div style={{ fontSize: 9, color: '#34d399', fontWeight: 700, letterSpacing: '0.05em' }}>
              ● ORIGEN SELECCIONADO
            </div>
          )}
          {viewMode === 'uml' && !isConnectingSource && (
            <div style={{ fontSize: 9, color: '#a5b4fc', textTransform: 'lowercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              &laquo;class / entity&raquo;
            </div>
          )}
          <span style={{ color: 'var(--text-primary)' }}>{entity.name}</span>
          {viewMode === 'physical' && entity.tableName && (
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400 }}>
              tabla: {entity.tableName}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="btn-icon"
            style={{
              width: 26,
              height: 26,
              padding: 0,
              background: isConnectingSource ? 'rgba(16, 185, 129, 0.25)' : undefined,
              borderColor: isConnectingSource ? '#10b981' : undefined
            }}
            onClick={(e) => { e.stopPropagation(); onStartConnect(entity.id); }}
            title={isConnectingSource ? 'Cancelar selección de enlace' : 'Conectar relación / Foreign Key con otra tabla'}
          >
            <Link size={13} color={isConnectingSource ? '#34d399' : 'currentColor'} />
          </button>
          <button
            className="btn-icon"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={(e) => { e.stopPropagation(); onEditEntity(entity); }}
            title="Editar atributos"
          >
            <Edit2 size={12} />
          </button>
          <button
            className="btn-icon"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={(e) => { e.stopPropagation(); onDeleteEntity(entity.id); }}
            title="Eliminar entidad"
          >
            <Trash2 size={12} color="#f43f5e" />
          </button>
        </div>
      </div>

      {/* Attributes List (Compartimento 2 UML 2.5 en vista UML) */}
      <div className="entity-body">
        {entity.attributes.map(attr => {
          const umlPropTags = [
            attr.isPrimaryKey ? 'id' : null,
            attr.isForeignKey ? 'FK' : null,
            attr.isUnique ? 'unique' : null
          ].filter(Boolean);
          const umlMultiplicity = attr.isNullable ? ' [0..1]' : '';

          if (viewMode === 'uml') {
            return (
              <div
                key={attr.id}
                className="attribute-row"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, gap: 6 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, overflow: 'hidden' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 700 }}>-</span>
                  <span
                    style={{
                      color: attr.isPrimaryKey ? '#fbbf24' : attr.isForeignKey ? '#38bdf8' : 'var(--text-primary)',
                      fontWeight: attr.isPrimaryKey ? 700 : 500,
                      textDecoration: attr.isPrimaryKey ? 'underline' : 'none'
                    }}
                  >
                    {attr.name}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>:</span>
                  <span style={{ color: '#a5b4fc' }}>
                    {attr.type}
                    {attr.length ? `(${attr.length})` : ''}
                    {umlMultiplicity}
                  </span>
                </div>
                {umlPropTags.length > 0 && (
                  <span style={{ color: attr.isPrimaryKey ? '#fbbf24' : '#34d399', fontSize: 9, flexShrink: 0 }}>
                    {`{${umlPropTags.join(', ')}}`}
                  </span>
                )}
              </div>
            );
          }

          return (
            <div key={attr.id} className="attribute-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {attr.isPrimaryKey && (
                  <span className="badge badge-pk" title="Clave Primaria (PK)">
                    <Key size={10} style={{ marginRight: 2 }} /> PK
                  </span>
                )}
                {attr.isForeignKey && (
                  <span className="badge badge-fk" title="Clave Foránea (FK)">
                    FK
                  </span>
                )}
                <span style={{
                  color: attr.isPrimaryKey ? '#fbbf24' : 'var(--text-primary)',
                  fontWeight: attr.isPrimaryKey ? 600 : 400
                }}>
                  {attr.name}
                </span>
              </div>

              {viewMode !== 'conceptual' && (
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  {viewMode === 'physical' && attr.length
                    ? `${attr.type}(${attr.length})`
                    : attr.type}
                  {attr.isNullable && ' ?'}
                </span>
              )}
            </div>
          );
        })}

        {/* Compartimento 3 UML 2.5: Operaciones / Métodos */}
        {viewMode === 'uml' && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6, paddingTop: 6, fontFamily: 'var(--font-mono)' }}>
            {entity.methods && entity.methods.length > 0 ? (
              entity.methods.map(m => {
                const visSymbol = m.visibility === 'private' ? '-' : m.visibility === 'protected' ? '#' : '+';
                const paramsStr = (m.parameters || []).join(', ');
                return (
                  <div key={m.id} style={{ color: 'var(--text-secondary)', fontSize: 11, padding: '2px 4px' }}>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>{visSymbol}</span> {m.name}({paramsStr}) : <span style={{ color: '#c084fc' }}>{m.returnType}</span>
                  </div>
                );
              })
            ) : (
              <>
                <div style={{ color: 'var(--text-secondary)', fontSize: 10.5, padding: '1px 4px' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>+</span> registrar() : <span style={{ color: '#c084fc' }}>Boolean</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 10.5, padding: '1px 4px' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>+</span> actualizar() : <span style={{ color: '#c084fc' }}>void</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
