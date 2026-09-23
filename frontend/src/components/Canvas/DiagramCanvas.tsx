import React, { useRef, useState } from 'react';
import { EntityNode } from './EntityNode';
import { DiagramModel, Entity, Relationship, RelationshipType, UserPresence } from '../../types/case';
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
    type?: RelationshipType;
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

  // Herramientas de Modelado Manual UML
  type CanvasTool = 'select' | 'class' | 'association' | 'aggregation' | 'composition' | 'inheritance' | 'dependency' | 'realization';
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [pendingConnectorType, setPendingConnectorType] = useState<RelationshipType | null>(null);

  const handleSelectConnectorTool = (type: RelationshipType) => {
    setActiveTool(type as CanvasTool);
    setPendingConnectorType(type);
    setConnectingSourceId(null);
  };

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
      const src = model.entities.find(e => e.id === connectingSourceId) || null;
      const tgt = model.entities.find(e => e.id === entityId) || null;
      setRelSourceEntity(src);
      setRelTargetEntity(tgt);
      setEditingRel(null);
      setIsRelationshipModalOpen(true);
      setConnectingSourceId(null);
      setActiveTool('select');
    } else {
      setConnectingSourceId(null);
      setActiveTool('select');
      setPendingConnectorType(null);
    }
  };

  const handleEntityClick = (entityId: string) => {
    // Si hay una herramienta de unión activa seleccionada en la barra
    if (activeTool !== 'select' && pendingConnectorType) {
      if (!connectingSourceId) {
        setConnectingSourceId(entityId);
      } else if (connectingSourceId !== entityId) {
        const src = model.entities.find(e => e.id === connectingSourceId) || null;
        const tgt = model.entities.find(e => e.id === entityId) || null;
        setRelSourceEntity(src);
        setRelTargetEntity(tgt);
        setEditingRel(null);
        setIsRelationshipModalOpen(true);
        setConnectingSourceId(null);
        setActiveTool('select');
      }
      return;
    }

    if (connectingSourceId && connectingSourceId !== entityId) {
      const src = model.entities.find(e => e.id === connectingSourceId) || null;
      const tgt = model.entities.find(e => e.id === entityId) || null;
      setRelSourceEntity(src);
      setRelTargetEntity(tgt);
      setEditingRel(null);
      setIsRelationshipModalOpen(true);
      setConnectingSourceId(null);
      setActiveTool('select');
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

  const [showCanvasGuide, setShowCanvasGuide] = useState(false);

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

      {/* Barra de Herramientas de Modelado Manual UML 2.5+ */}
      <div style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(16px)',
        padding: '5px 10px',
        borderRadius: 14,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Puntero de Selección */}
        <button
          type="button"
          onClick={() => { setActiveTool('select'); setPendingConnectorType(null); setConnectingSourceId(null); }}
          title="Modo Selección / Puntero"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 8,
            border: activeTool === 'select' ? '1px solid #818cf8' : '1px solid transparent',
            background: activeTool === 'select' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
            color: activeTool === 'select' ? '#fff' : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <MousePointer size={14} />
          <span>Seleccionar</span>
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />

        {/* Añadir Clase */}
        <button
          type="button"
          onClick={onAddEntity}
          title="Agregar Nueva Clase / Entidad UML"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(16, 185, 129, 0.4)',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Plus size={14} />
          <span>+ Clase</span>
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />

        <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', padding: '0 4px', fontWeight: 700, letterSpacing: '0.05em' }}>
          Uniones UML:
        </span>

        {/* Asociación */}
        <button
          type="button"
          onClick={() => handleSelectConnectorTool('association')}
          title="Asociación Simple (Línea Continua)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 9px',
            borderRadius: 8,
            border: activeTool === 'association' ? '1px solid #6366f1' : '1px solid transparent',
            background: activeTool === 'association' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
            color: activeTool === 'association' ? '#fff' : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 900 }}>⎯</span>
          <span>Asociación</span>
        </button>

        {/* Agregación ◇ */}
        <button
          type="button"
          onClick={() => handleSelectConnectorTool('aggregation')}
          title="Agregación (Rombo Blanco ◇: Todo/Parte Débil)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 9px',
            borderRadius: 8,
            border: activeTool === 'aggregation' ? '1px solid #38bdf8' : '1px solid transparent',
            background: activeTool === 'aggregation' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: activeTool === 'aggregation' ? '#38bdf8' : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 900, color: '#38bdf8' }}>◇</span>
          <span>Agregación</span>
        </button>

        {/* Composición ◆ */}
        <button
          type="button"
          onClick={() => handleSelectConnectorTool('composition')}
          title="Composición (Rombo Lleno ◆: Todo/Parte Fuerte)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 9px',
            borderRadius: 8,
            border: activeTool === 'composition' ? '1px solid #818cf8' : '1px solid transparent',
            background: activeTool === 'composition' ? 'rgba(129, 140, 248, 0.25)' : 'transparent',
            color: activeTool === 'composition' ? '#a5b4fc' : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 900, color: '#818cf8' }}>◆</span>
          <span>Composición</span>
        </button>

        {/* Herencia ▷ */}
        <button
          type="button"
          onClick={() => handleSelectConnectorTool('inheritance')}
          title="Herencia / Generalización (Triángulo ▷: Subclase a Superclase)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 9px',
            borderRadius: 8,
            border: activeTool === 'inheritance' ? '1px solid #fbbf24' : '1px solid transparent',
            background: activeTool === 'inheritance' ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
            color: activeTool === 'inheritance' ? '#fbbf24' : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fbbf24' }}>▷</span>
          <span>Herencia</span>
        </button>

        {/* Dependencia ⇢ */}
        <button
          type="button"
          onClick={() => handleSelectConnectorTool('dependency')}
          title="Dependencia (Línea Punteada ⇢)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 9px',
            borderRadius: 8,
            border: activeTool === 'dependency' ? '1px solid #f43f5e' : '1px solid transparent',
            background: activeTool === 'dependency' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
            color: activeTool === 'dependency' ? '#f43f5e' : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 900, color: '#f43f5e' }}>⇢</span>
          <span>Dependencia</span>
        </button>
      </div>

      {/* Barra Flotante de Graficado por Voz en Tiempo Real */}
      <VoiceDiagrammingBar
        model={model}
        onApplyVoiceResult={onApplyVoiceResult}
      />

      {/* Banner de Conexión Activa con Instrucción Clara */}
      {connectingSourceEntity && (
        <div style={{
          position: 'absolute',
          top: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 55,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #818cf8',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          padding: '8px 22px',
          borderRadius: 30,
          fontSize: 12,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)'
        }}>
          <span>
            {pendingConnectorType === 'composition' && '◆ Composición: '}
            {pendingConnectorType === 'aggregation' && '◇ Agregación: '}
            {pendingConnectorType === 'inheritance' && '▷ Herencia: '}
            {pendingConnectorType === 'dependency' && '⇢ Dependencia: '}
            {!pendingConnectorType && '🟢 Enlace: '}
            Origen <strong>{connectingSourceEntity.name}</strong> ➔ Haz clic en la tabla <strong>DESTINO</strong> para completar la unión.
          </span>
          <button
            onClick={() => { setConnectingSourceId(null); setActiveTool('select'); setPendingConnectorType(null); }}
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              padding: '3px 10px',
              borderRadius: 12,
              fontSize: 11,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Controles flotantes de Zoom y Añadir (Esquina inferior izquierda para no solapar herramientas IA) */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
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
          <defs>
            {/* Flecha estándar para Dependencia */}
            <marker id="marker-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
            </marker>

            {/* Rombo Blanco (Agregación) */}
            <marker id="marker-aggregation" viewBox="0 0 16 16" refX="8" refY="8" markerWidth="14" markerHeight="14" orient="auto">
              <polygon points="8,1 15,8 8,15 1,8" fill="#0b1329" stroke="#38bdf8" strokeWidth="2" />
            </marker>

            {/* Rombo Relleno Morado/Azul (Composición) */}
            <marker id="marker-composition" viewBox="0 0 16 16" refX="8" refY="8" markerWidth="14" markerHeight="14" orient="auto">
              <polygon points="8,1 15,8 8,15 1,8" fill="#818cf8" stroke="#c7d2fe" strokeWidth="2" />
            </marker>

            {/* Triángulo Hueco (Herencia / Generalización) */}
            <marker id="marker-inheritance" viewBox="0 0 16 16" refX="14" refY="8" markerWidth="14" markerHeight="14" orient="auto">
              <polygon points="1,2 14,8 1,14" fill="#0b1329" stroke="#fbbf24" strokeWidth="2" />
            </marker>

            {/* Triángulo Hueco para Realización */}
            <marker id="marker-realization" viewBox="0 0 16 16" refX="14" refY="8" markerWidth="14" markerHeight="14" orient="auto">
              <polygon points="1,2 14,8 1,14" fill="#0b1329" stroke="#34d399" strokeWidth="2" />
            </marker>
          </defs>

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

            const relType = rel.type || 'association';
            const isDashed = relType === 'dependency' || relType === 'realization' || (relType === 'association' && rel.cardinality === 'N:M');
            
            const strokeColor = 
              relType === 'composition' ? '#818cf8' :
              relType === 'aggregation' ? '#38bdf8' :
              relType === 'inheritance' ? '#fbbf24' :
              relType === 'dependency' ? '#f43f5e' :
              relType === 'realization' ? '#34d399' : '#6366f1';

            const markerStart = 
              relType === 'aggregation' ? 'url(#marker-aggregation)' :
              relType === 'composition' ? 'url(#marker-composition)' : undefined;

            const markerEnd = 
              relType === 'inheritance' ? 'url(#marker-inheritance)' :
              relType === 'dependency' ? 'url(#marker-arrow)' :
              relType === 'realization' ? 'url(#marker-realization)' : undefined;

            const badgeSymbol = 
              relType === 'composition' ? '◆' :
              relType === 'aggregation' ? '◇' :
              relType === 'inheritance' ? '▷' :
              relType === 'dependency' ? '⇢' :
              relType === 'realization' ? '⇸' : '⎯';

            const badgeTitle = 
              relType === 'composition' ? 'Composición' :
              relType === 'aggregation' ? 'Agregación' :
              relType === 'inheritance' ? 'Herencia (IS-A)' :
              relType === 'dependency' ? 'Dependencia' :
              relType === 'realization' ? 'Realización' : rel.cardinality;

            return (
              <g key={rel.id}>
                {/* Línea de conexión con marcadores UML */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeDasharray={isDashed ? '6 4' : 'none'}
                  markerStart={markerStart}
                  markerEnd={markerEnd}
                  opacity="0.95"
                />

                {/* Badge en el centro de la línea (Clickeable para editar o eliminar) */}
                <g
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={() => handleEditRelationship(rel)}
                >
                  <rect
                    x={midX - 60}
                    y={midY - 14}
                    width="120"
                    height="28"
                    rx="8"
                    fill="#0b1329"
                    stroke={strokeColor}
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
                    {badgeSymbol} {badgeTitle} {rel.name ? `• ${rel.name}` : ''}
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
        onClose={() => {
          setIsRelationshipModalOpen(false);
          setEditingRel(null);
          setPendingConnectorType(null);
          setActiveTool('select');
        }}
        sourceEntity={relSourceEntity}
        targetEntity={relTargetEntity}
        existingRelationship={editingRel}
        initialType={pendingConnectorType || editingRel?.type || 'association'}
        onSaveRelationship={onSaveRelationshipWithFK}
        onDeleteRelationship={onDeleteRelationship}
      />
    </div>
  );
};
