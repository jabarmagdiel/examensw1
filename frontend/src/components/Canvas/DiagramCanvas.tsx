import React, { useRef, useState } from 'react';
import { EntityNode } from './EntityNode';
import { DiagramModel, Entity, Relationship, UserPresence } from '../../types/case';
import { Plus, ZoomIn, ZoomOut, RotateCcw, MousePointer, X } from 'lucide-react';
import { VoiceDiagrammingBar } from './VoiceDiagrammingBar';
import { RelationshipModal } from './RelationshipModal';

interface DiagramCanvasProps {
  model: DiagramModel;
  viewMode: 'conceptual' | 'logical' | 'physical' | 'uml';
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onUpdateEntityPosition: (id: string, x: number, y: number) => void;
  onEditEntity: (entity: Entity) => void;
  onDeleteEntity: (id: string) => void;
  onAddEntity: () => void;
  collaborators: UserPresence[];
  onCursorMove: (x: number, y: number) => void;
  onApplyVoiceResult: (updatedModel: DiagramModel, summary: string) => void;
  onSaveRelationshipWithFK: (relData: {
    id?: string;
    sourceEntityId: string;
    targetEntityId: string;
    cardinality: any;
    name: string;
    foreignKeyName: string;
    createForeignKeyAttribute: boolean;
  }) => void;
  onDeleteRelationship: (relId: string) => void;
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  model,
  viewMode,
  selectedEntityId,
  onSelectEntity,
  onUpdateEntityPosition,
  onEditEntity,
  onDeleteEntity,
  onAddEntity,
  collaborators,
  onCursorMove,
  onApplyVoiceResult,
  onSaveRelationshipWithFK,
  onDeleteRelationship
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Estados del Modal de Relación
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [relSourceEntity, setRelSourceEntity] = useState<Entity | null>(null);
  const [relTargetEntity, setRelTargetEntity] = useState<Entity | null>(null);
  const [editingRel, setEditingRel] = useState<Relationship | null>(null);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
      onSelectEntity(null);
      if (e.button === 0) {
        setIsPanning(true);
        panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      onCursorMove(Math.round(rawX), Math.round(rawY));
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const handleStartConnect = (entityId: string) => {
    if (!connectingSourceId) {
      setConnectingSourceId(entityId);
    } else if (connectingSourceId !== entityId) {
      // Abrir modal de configuración de relación
      const src = model.entities.find(e => e.id === connectingSourceId) || null;
      const tgt = model.entities.find(e => e.id === entityId) || null;
      setRelSourceEntity(src);
      setRelTargetEntity(tgt);
      setEditingRel(null);
      setIsRelationshipModalOpen(true);
      setConnectingSourceId(null);
    } else {
      setConnectingSourceId(null);
    }
  };

  const handleEntityClick = (entityId: string) => {
    if (connectingSourceId && connectingSourceId !== entityId) {
      const src = model.entities.find(e => e.id === connectingSourceId) || null;
      const tgt = model.entities.find(e => e.id === entityId) || null;
      setRelSourceEntity(src);
      setRelTargetEntity(tgt);
      setEditingRel(null);
      setIsRelationshipModalOpen(true);
      setConnectingSourceId(null);
    } else {
      onSelectEntity(entityId);
    }
  };

  const handleEditRelationship = (rel: Relationship) => {
    const src = model.entities.find(e => e.id === rel.sourceEntityId) || null;
    const tgt = model.entities.find(e => e.id === rel.targetEntityId) || null;
    setRelSourceEntity(src);
    setRelTargetEntity(tgt);
    setEditingRel(rel);
    setIsRelationshipModalOpen(true);
  };

  const connectingSourceEntity = connectingSourceId
    ? model.entities.find(e => e.id === connectingSourceId)
    : null;

  const BOX_WIDTH = 250;
  const BOX_HEIGHT = 160;

  const [showCanvasGuide, setShowCanvasGuide] = useState(true);

  return (
    <div
      ref={canvasRef}
      style={{
        flex: 1,
        height: 'calc(100vh - var(--header-height) - 40px)',
        position: 'relative',
        overflow: 'hidden',
        background: '#070b14',
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 70%),
          linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
        cursor: isPanning ? 'grabbing' : 'default',
        margin: '0 16px 16px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
    >
      {/* Guía Contextual del Asistente Virtual en Diseño */}
      {showCanvasGuide && !connectingSourceEntity && (
        <div style={{
          position: 'absolute',
          top: 14,
          left: 16,
          zIndex: 50,
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(129, 140, 248, 0.4)',
          borderRadius: 10,
          padding: '7px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>🤖</span>
            <span style={{ fontSize: 11, color: '#fff' }}>
              <strong>Guía del Asistente:</strong> {selectedEntityId 
                ? 'Entidad seleccionada. Pulsa ✏️ para editar campos o 🔗 para conectar una Foreign Key.' 
                : 'Haz clic en una tabla para seleccionarla, o pulsa en 🔗 (cadena) en su cabecera para enlazar con Foreign Key.'}
            </span>
          </div>
          <button
            onClick={() => setShowCanvasGuide(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, padding: '0 4px' }}
            title="Ocultar guía"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra Flotante de Graficado por Voz en Tiempo Real */}
      <VoiceDiagrammingBar
        model={model}
        onApplyVoiceResult={onApplyVoiceResult}
      />

      {/* Banner de Conexión Activa con Instrucción Clara */}
      {connectingSourceEntity && (
        <div style={{
          position: 'absolute',
          top: 90,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 55,
          background: 'rgba(16, 185, 129, 0.95)',
          backdropFilter: 'blur(8px)',
          color: '#064e3b',
          padding: '8px 20px',
          borderRadius: 24,
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.5)'
        }}>
          <span>
            🟢 Origen: <strong>{connectingSourceEntity.name}</strong>. Ahora haz clic en la tabla DESTINO para configurar la relación y la Clave Foránea (FK).
          </span>
          <button
            onClick={() => setConnectingSourceId(null)}
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: 'none',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 11,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Controles flotantes de Zoom y Añadir */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        padding: 6,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        <button
          className="btn-primary"
          onClick={onAddEntity}
          title="Agregar nueva entidad"
          style={{ width: 38, height: 38, padding: 0, borderRadius: 'var(--radius-sm)' }}
        >
          <Plus size={18} />
        </button>
        <button
          className="btn-icon"
          onClick={() => setZoom(z => Math.min(1.8, z + 0.1))}
          title="Acercar zoom"
        >
          <ZoomIn size={16} />
        </button>
        <button
          className="btn-icon"
          onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
          title="Alejar zoom"
        >
          <ZoomOut size={16} />
        </button>
        <button
          className="btn-icon"
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          title="Restablecer vista"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Capa de Transformación (Zoom y Pan) */}
      <div style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: '0 0',
        position: 'absolute',
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}>
        {/* SVG de Relaciones / Conexiones */}
        <svg style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '5000px',
          height: '5000px',
          pointerEvents: 'none'
        }}>
          {model.relationships.map(rel => {
            const src = model.entities.find(e => e.id === rel.sourceEntityId);
            const tgt = model.entities.find(e => e.id === rel.targetEntityId);
            if (!src || !tgt) return null;

            const x1 = src.x + BOX_WIDTH / 2;
            const y1 = src.y + BOX_HEIGHT / 2;
            const x2 = tgt.x + BOX_WIDTH / 2;
            const y2 = tgt.y + BOX_HEIGHT / 2;

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            return (
              <g key={rel.id}>
                {/* Línea de conexión */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeDasharray={rel.cardinality === 'N:M' ? '5 5' : 'none'}
                  opacity="0.85"
                />

                {/* Badge en el centro de la línea (Clickeable para editar o eliminar) */}
                <g
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={() => handleEditRelationship(rel)}
                >
                  <rect
                    x={midX - 45}
                    y={midY - 14}
                    width="90"
                    height="28"
                    rx="8"
                    fill="#11192e"
                    stroke="#818cf8"
                    strokeWidth="1.5"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    fill="#f8fafc"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                  >
                    {rel.cardinality} {rel.name ? `• ${rel.name}` : ''}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Nodos de Entidades */}
        <div style={{ pointerEvents: 'auto' }}>
          {model.entities.map(entity => (
            <EntityNode
              key={entity.id}
              entity={entity}
              viewMode={viewMode}
              isSelected={selectedEntityId === entity.id}
              isConnectingSource={connectingSourceId === entity.id}
              onSelect={() => handleEntityClick(entity.id)}
              onUpdatePosition={(x, y) => onUpdateEntityPosition(entity.id, x, y)}
              onEditEntity={onEditEntity}
              onDeleteEntity={onDeleteEntity}
              onStartConnect={handleStartConnect}
            />
          ))}
        </div>

        {/* Cursores Remotos */}
        {collaborators.map(collab => {
          if (!collab.cursor) return null;
          return (
            <div
              key={collab.id}
              className="remote-cursor"
              style={{
                left: collab.cursor.x,
                top: collab.cursor.y,
                transform: 'translate(-2px, -2px)'
              }}
            >
              <MousePointer size={16} fill={collab.color} color="#000" />
              <div className="cursor-tag" style={{ background: collab.color }}>
                {collab.name} ({collab.role})
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Configuración de Relación & Foreign Key */}
      <RelationshipModal
        isOpen={isRelationshipModalOpen}
        onClose={() => setIsRelationshipModalOpen(false)}
        sourceEntity={relSourceEntity}
        targetEntity={relTargetEntity}
        existingRelationship={editingRel}
        onSaveRelationship={onSaveRelationshipWithFK}
        onDeleteRelationship={onDeleteRelationship}
      />
    </div>
  );
};
