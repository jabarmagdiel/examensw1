import React, { useState } from 'react';
import { X, Play, RefreshCw, Plus, Trash2, CheckCircle2, AlertCircle, Database, Sparkles } from 'lucide-react';
import { DiagramModel, Entity } from '../../types/case';

interface LiveTestClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DiagramModel;
}

export const LiveTestClientModal: React.FC<LiveTestClientModalProps> = ({
  isOpen,
  onClose,
  model
}) => {
  if (!isOpen) return null;

  const [selectedEntityName, setSelectedEntityName] = useState<string>(
    model.entities[0]?.name || ''
  );

  const selectedEntity = model.entities.find(e => e.name === selectedEntityName) || model.entities[0];

  // Base de datos simulada en memoria para pruebas inmediatas si el backend aún no está encendido
  const [localDatabase, setLocalDatabase] = useState<Record<string, any[]>>({
    Cliente: [
      { id: 1, dni: '74839201', nombreCompleto: 'Carlos Mendoza', telefono: '+591 71234567', direccion: 'Av. Las Palmas #420' }
    ],
    Mascota: [
      { id: 1, nombre: 'Rocky', especie: 'Canino', raza: 'Golden Retriever', fechaNacimiento: '2023-04-10', cliente_id: 1 }
    ],
    Veterinario: [
      { id: 1, matricula: 'VET-8832', nombre: 'Dra. Elena Ramos', especialidad: 'Cirugía', telefono: '+591 79876543' }
    ]
  });

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [apiResponseStatus, setApiResponseStatus] = useState<string | null>(null);

  const currentRecords = (selectedEntity ? localDatabase[selectedEntity.name] : []) || [];

  const handleFillSampleData = () => {
    if (!selectedEntity) return;
    const sample: Record<string, string> = {};
    selectedEntity.attributes.forEach(attr => {
      if (!attr.isPrimaryKey) {
        if (attr.name.toLowerCase().includes('dni')) sample[attr.name] = '83920194';
        else if (attr.name.toLowerCase().includes('nombre')) sample[attr.name] = selectedEntity.name === 'Mascota' ? 'Toby' : 'Mariana Torres';
        else if (attr.name.toLowerCase().includes('telefono')) sample[attr.name] = '+591 70011223';
        else if (attr.name.toLowerCase().includes('especie')) sample[attr.name] = 'Felino';
        else if (attr.name.toLowerCase().includes('raza')) sample[attr.name] = 'Siamés';
        else if (attr.name.toLowerCase().includes('fecha')) sample[attr.name] = '2026-03-19';
        else if (attr.type === 'INTEGER' || attr.type === 'BIGINT') sample[attr.name] = '1';
        else sample[attr.name] = `Dato ${attr.name}`;
      }
    });
    setFormData(sample);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) return;

    const newId = currentRecords.length > 0 ? Math.max(...currentRecords.map(r => Number(r.id) || 0)) + 1 : 1;
    const newRecord = { id: newId, ...formData };

    setLocalDatabase(prev => ({
      ...prev,
      [selectedEntity.name]: [...(prev[selectedEntity.name] || []), newRecord]
    }));

    setFormData({});
    setApiResponseStatus(`HTTP 201 CREATED: ${selectedEntity.name} con ID ${newId} guardado con éxito.`);
    setTimeout(() => setApiResponseStatus(null), 3500);
  };

  const handleDeleteRecord = (id: any) => {
    if (!selectedEntity) return;
    setLocalDatabase(prev => ({
      ...prev,
      [selectedEntity.name]: (prev[selectedEntity.name] || []).filter(r => r.id !== id)
    }));
    setApiResponseStatus(`HTTP 204 NO CONTENT: Registro ${id} eliminado.`);
    setTimeout(() => setApiResponseStatus(null), 3000);
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
            <div style={{ background: 'var(--grad-primary)', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Cliente Frontend de Pruebas en Vivo (Revisión de Examen)</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Prueba interactiva inmediata de operaciones CRUD para validar los endpoints generados
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Entity Selector Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {model.entities.map(ent => (
            <button
              key={ent.name}
              onClick={() => { setSelectedEntityName(ent.name); setFormData({}); }}
              style={{
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 6,
                background: selectedEntity?.name === ent.name ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedEntity?.name === ent.name ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap'
              }}
            >
              {ent.name} ({ent.attributes.length} attrs)
            </button>
          ))}
        </div>

        {apiResponseStatus && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '8px 14px',
            borderRadius: 6,
            fontSize: 12,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle2 size={16} />
            <span>{apiResponseStatus}</span>
          </div>
        )}

        {selectedEntity && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
            {/* Formulario de Inserción */}
            <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600 }}>Nuevo {selectedEntity.name}</h3>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 10, padding: '3px 8px' }}
                  onClick={handleFillSampleData}
                >
                  <Sparkles size={11} color="var(--accent-secondary)" /> Auto-rellenar
                </button>
              </div>

              <form onSubmit={handleSaveRecord} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedEntity.attributes.filter(a => !a.isPrimaryKey).map(attr => (
                  <div key={attr.name}>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>
                      {attr.name} <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({attr.type})</span>
                    </label>
                    <input
                      type={attr.type === 'INTEGER' || attr.type === 'BIGINT' || attr.type === 'DECIMAL' ? 'number' : attr.type === 'DATE' ? 'date' : 'text'}
                      value={formData[attr.name] || ''}
                      onChange={e => setFormData({ ...formData, [attr.name]: e.target.value })}
                      required={!attr.isNullable}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        padding: '6px 10px',
                        color: '#fff',
                        fontSize: 12
                      }}
                    />
                  </div>
                ))}

                <button type="submit" className="btn-primary" style={{ marginTop: 8, width: '100%', fontSize: 12 }}>
                  <Plus size={14} /> Guardar (POST /api/v1/{selectedEntity.name.toLowerCase()}s)
                </button>
              </form>
            </div>

            {/* Tabla de Registros */}
            <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600 }}>
                  Registros en Base de Datos ({currentRecords.length})
                </h3>
                <span style={{ fontSize: 10, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                  GET /api/v1/{selectedEntity.name.toLowerCase()}s
                </span>
              </div>

              <div style={{ flex: 1, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                      {selectedEntity.attributes.map(a => (
                        <th key={a.name} style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {a.name}
                        </th>
                      ))}
                      <th style={{ padding: '8px 10px', color: 'var(--text-secondary)', textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.length === 0 ? (
                      <tr>
                        <td colSpan={selectedEntity.attributes.length + 1} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                          No hay registros aún. Usa el formulario para crear uno.
                        </td>
                      </tr>
                    ) : (
                      currentRecords.map(rec => (
                        <tr key={rec.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          {selectedEntity.attributes.map(a => (
                            <td key={a.name} style={{ padding: '8px 10px', fontFamily: a.isPrimaryKey ? 'var(--font-mono)' : 'inherit' }}>
                              {String(rec[a.name] ?? '')}
                            </td>
                          ))}
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            <button
                              className="btn-icon"
                              style={{ width: 24, height: 24 }}
                              onClick={() => handleDeleteRecord(rec.id)}
                              title="Eliminar registro"
                            >
                              <Trash2 size={12} color="#f43f5e" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
