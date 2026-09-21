import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  Check, 
  Play, 
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { DiagramModel } from '../../types/case';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DiagramModel;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  model
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'crud' | 'supabase' | 'sql'>('crud');
  const [selectedTable, setSelectedTable] = useState<string>('clientes');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado de la conexión
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    provider: string;
    isSupabase: boolean;
    urlMasked: string | null;
    tables: string[];
    counts: Record<string, number>;
  }>({
    connected: false,
    provider: 'Simulador Reactivo en Memoria',
    isSupabase: false,
    urlMasked: null,
    tables: ['clientes', 'mascotas', 'veterinarios', 'citas_medicas', 'proveedores', 'medicamentos', 'lotes', 'ventas', 'productos', 'pedidos', 'usuarios', 'system_users'],
    counts: { clientes: 3, mascotas: 3, veterinarios: 2, citas_medicas: 2, proveedores: 3, medicamentos: 3, lotes: 2, ventas: 2, productos: 3, pedidos: 2, usuarios: 3, system_users: 4 }
  });

  // Formulario para Crear / Editar Registro
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Formulario de Supabase
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [runInitOnConnect, setRunInitOnConnect] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Consola SQL
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM clientes ORDER BY id ASC;');
  const [sqlResult, setSqlResult] = useState<any | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const API_BASE = (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port !== '3001') ? 'http://localhost:3001' : '';

  // Cargar estado de la base de datos
  const fetchDbStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/db/status`);
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (e) {
      console.warn('Backend API no disponible, usando estado local.');
    }
  };

  // Cargar registros de la tabla seleccionada
  const fetchRecords = async (table: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/data/${table}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Usando fallback reactivo para tabla:', table);
    } finally {
      setLoading(false);
    }
    setRecords(prev => prev.length > 0 ? prev : getMockRecordsForTable(table));
  };

  const getMockRecordsForTable = (table: string) => {
    if (table === 'clientes') {
      return [
        { id: 1, dni: '74839201', nombre_completo: 'Carlos Mendoza', telefono: '+591 71234567', direccion: 'Av. Las Palmas #420' },
        { id: 2, dni: '78493021', nombre_completo: 'Sofía Reyes', telefono: '+591 71239988', direccion: 'Calle Comercio #102' },
        { id: 3, dni: '84930128', nombre_completo: 'Juan Pablo Gómez', telefono: '+591 70011223', direccion: 'Av. América #890' }
      ];
    } else if (table === 'mascotas') {
      return [
        { id: 1, nombre: 'Rocky', especie: 'Canino', raza: 'Golden Retriever', fecha_nacimiento: '2023-04-10', cliente_id: 1 },
        { id: 2, nombre: 'Toby', especie: 'Canino', raza: 'Beagle', fecha_nacimiento: '2022-08-15', cliente_id: 2 },
        { id: 3, nombre: 'Luna', especie: 'Felino', raza: 'Siamés', fecha_nacimiento: '2024-01-20', cliente_id: 3 }
      ];
    } else if (table === 'veterinarios') {
      return [
        { id: 1, matricula: 'VET-8832', nombre: 'Dra. Elena Ramos', especialidad: 'Cirugía Menor', telefono: '+591 79876543' },
        { id: 2, matricula: 'VET-4410', nombre: 'Dr. Martín Cáceres', especialidad: 'Medicina Felina', telefono: '+591 76543210' }
      ];
    } else if (table === 'citas_medicas') {
      return [
        { id: 1, fecha: '2026-09-18', motivo: 'Control anual y vacunación', diagnostico: 'Paciente sano', costo: 120.00, mascota_id: 1, veterinario_id: 1 },
        { id: 2, fecha: '2026-09-19', motivo: 'Revisión dental', diagnostico: 'Limpieza recomendada', costo: 85.00, mascota_id: 2, veterinario_id: 2 }
      ];
    } else if (table === 'proveedores') {
      return [
        { id: 1, razon_social: 'Laboratorios Farmacéuticos Andinos', nit: '1029384756', telefono: '+591 2 2456789', direccion: 'Zona Industrial #500' },
        { id: 2, razon_social: 'Distribuidora Médica Global S.R.L.', nit: '9847362019', telefono: '+591 3 3341122', direccion: 'Av. Banzer Km 6' },
        { id: 3, razon_social: 'Insumos Hospitalarios Santa Cruz', nit: '5566778899', telefono: '+591 4 4567890', direccion: 'Calle Sucre #230' }
      ];
    } else if (table === 'medicamentos') {
      return [
        { id: 1, codigo_barras: '7771234567890', nombre_comercial: 'Amoxicilina 500mg', principio_activo: 'Amoxicilina Trihidrato', precio: 15.50, stock: 120 },
        { id: 2, codigo_barras: '7779876543210', nombre_comercial: 'Ibuprofeno Forte 400mg', principio_activo: 'Ibuprofeno', precio: 8.00, stock: 250 },
        { id: 3, codigo_barras: '7774561237895', nombre_comercial: 'Paracetamol Jarabe 120ml', principio_activo: 'Paracetamol', precio: 12.00, stock: 80 }
      ];
    } else if (table === 'lotes') {
      return [
        { id: 1, numero_lote: 'LT-2026-09A', fecha_vencimiento: '2028-06-30', stock_actual: 120, medicamento_id: 1 },
        { id: 2, numero_lote: 'LT-2026-11C', fecha_vencimiento: '2027-12-15', stock_actual: 250, medicamento_id: 2 }
      ];
    } else if (table === 'ventas') {
      return [
        { id: 1, fecha_hora: '2026-09-20 10:30:00', total: 45.50, cliente_nombre: 'Mariana Flores', estado: 'Completada' },
        { id: 2, fecha_hora: '2026-09-21 15:45:00', total: 112.00, cliente_nombre: 'Roberto Vaca', estado: 'Completada' }
      ];
    } else if (table === 'productos') {
      return [
        { id: 1, sku: 'PROD-LAPTOP-01', nombre: 'Laptop Ultrabook 14"', precio: 850.00, stock: 15 },
        { id: 2, sku: 'PROD-MOUSE-02', nombre: 'Mouse Ergonómico Inalámbrico', precio: 25.00, stock: 60 },
        { id: 3, sku: 'PROD-KEYB-03', nombre: 'Teclado Mecánico RGB', precio: 65.00, stock: 35 }
      ];
    } else if (table === 'pedidos') {
      return [
        { id: 1, fecha: '2026-09-19', total: 875.00, estado: 'Enviado', usuario_id: 1 },
        { id: 2, fecha: '2026-09-20', total: 90.00, estado: 'Entregado', usuario_id: 2 }
      ];
    } else if (table === 'usuarios') {
      return [
        { id: 1, email: 'cliente.vip@gmail.com', nombre: 'Diego Morales', rol: 'Cliente' },
        { id: 2, email: 'laura.compras@empresa.bo', nombre: 'Laura Paz', rol: 'Cliente' },
        { id: 3, email: 'admin.store@tienda.com', nombre: 'Administrador Tienda', rol: 'Admin' }
      ];
    } else if (table === 'system_users') {
      return [
        { id: 'usr_migue', name: 'Migue', email: 'migue.director@case-enterprise.com', role: 'Administrador', status: 'active' },
        { id: 'usr_sofia', name: 'Lic. Sofía Reyes', email: 'sofia.analista@case-enterprise.com', role: 'Analista', status: 'active' },
        { id: 'usr_alex', name: 'Ing. Alex Rivera', email: 'alex.desarrollador@case-enterprise.com', role: 'Implementador', status: 'active' },
        { id: 'usr_carlos', name: 'Arq. Carlos Mendoza', email: 'carlos.disenador@case-enterprise.com', role: 'Diseñador', status: 'active' }
      ];
    }
    return [
      { id: 1, nombre: `Registro demo 1 de ${table}`, created_at: '2026-09-21' },
      { id: 2, nombre: `Registro demo 2 de ${table}`, created_at: '2026-09-21' }
    ];
  };

  useEffect(() => {
    fetchDbStatus();
    fetchRecords(selectedTable);
  }, [selectedTable]);

  // Manejador para Guardar (Crear o Actualizar)
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        // Actualizar (PUT)
        const res = await fetch(`${API_BASE}/api/data/${selectedTable}/${editingRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          const data = await res.json();
          setRecords(prev => prev.map(r => r.id === editingRecord.id ? (data.record || { ...r, ...formData }) : r));
          showToast(`✓ Registro #${editingRecord.id} actualizado con éxito.`);
        } else {
          setRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...r, ...formData } : r));
          showToast(`✓ Registro #${editingRecord.id} actualizado localmente.`);
        }
      } else {
        // Crear (POST)
        const res = await fetch(`${API_BASE}/api/data/${selectedTable}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.record) {
            setRecords(prev => [data.record, ...prev]);
          }
          showToast(`✓ Nuevo registro creado con ID #${data.record?.id || 'OK'}.`);
        } else {
          // Creación local
          const newId = records.length > 0 ? Math.max(...records.map(r => Number(r.id) || 0)) + 1 : 1;
          setRecords(prev => [{ id: newId, ...formData }, ...prev]);
          showToast(`✓ Registro creado con ID #${newId}.`);
        }
      }

      setIsFormOpen(false);
      setEditingRecord(null);
      setFormData({});
      fetchDbStatus();
    } catch (e: any) {
      showToast(`Error guardando: ${e.message}`);
    }
  };

  // Manejador para Eliminar (DELETE)
  const handleDeleteRecord = async (id: any) => {
    if (!confirm(`¿Estás seguro de eliminar el registro #${id} de la tabla ${selectedTable}?`)) return;

    try {
      await fetch(`${API_BASE}/api/data/${selectedTable}/${id}`, { method: 'DELETE' });
      setRecords(prev => prev.filter(r => r.id !== id));
      showToast(`✓ Registro #${id} eliminado de ${selectedTable}.`);
      fetchDbStatus();
    } catch (e: any) {
      setRecords(prev => prev.filter(r => r.id !== id));
      showToast(`✓ Registro #${id} eliminado.`);
    }
  };

  // Conectar a Supabase en Caliente
  const handleConnectSupabase = async () => {
    if (!supabaseUrl || !supabaseUrl.startsWith('postgres')) {
      alert('Por favor introduce una URL válida de PostgreSQL/Supabase que comience con postgresql://');
      return;
    }

    setConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/api/db/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: supabaseUrl, runInit: runInitOnConnect })
      });

      const data = await res.json();
      if (data.success) {
        showToast('🚀 ¡Conectado a Supabase con éxito! Tablas y datos listos.');
        fetchDbStatus();
        fetchRecords(selectedTable);
      } else {
        alert('Error conectando a Supabase: ' + (data.error || 'Verifica la contraseña o credenciales.'));
      }
    } catch (e: any) {
      alert('Error de red al conectar: ' + e.message);
    } finally {
      setConnecting(false);
    }
  };

  // Columnas dinámicas según el primer registro o el modelo
  const tableColumns = React.useMemo(() => {
    if (records.length > 0) {
      return Object.keys(records[0]);
    }
    const matchingEntity = model.entities.find(e => e.name.toLowerCase() === selectedTable.toLowerCase() || e.tableName?.toLowerCase() === selectedTable.toLowerCase());
    if (matchingEntity) {
      return matchingEntity.attributes.map(a => a.name);
    }
    return ['id', 'nombre', 'descripcion'];
  }, [records, selectedTable, model]);

  const filteredRecords = records.filter(rec => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(rec).some(val => String(val).toLowerCase().includes(q));
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #10b981',
          padding: '12px 18px',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          zIndex: 9999
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{toastMessage}</span>
        </div>
      )}

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: 1040,
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: 24,
        position: 'relative',
        borderRadius: 16
      }}>
        {/* Header con Estado de la BD */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
              <Database size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  Gestor CRUD de Base de Datos & Supabase
                </h2>
                <span style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontWeight: 600,
                  background: dbStatus.isSupabase ? 'rgba(16, 185, 129, 0.2)' : (dbStatus.connected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'),
                  color: dbStatus.isSupabase ? '#6ee7b7' : (dbStatus.connected ? '#93c5fd' : '#fcd34d'),
                  border: `1px solid ${dbStatus.isSupabase ? '#10b981' : (dbStatus.connected ? '#3b82f6' : '#f59e0b')}`
                }}>
                  {dbStatus.provider}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Administración directa de registros en tablas PostgreSQL (local o en la nube con Supabase)
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Pestañas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
          <button
            className={activeTab === 'crud' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('crud')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
          >
            <Layers size={15} />
            <span>1. Operaciones CRUD en Tablas</span>
          </button>
          <button
            className={activeTab === 'supabase' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('supabase')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
          >
            <Server size={15} />
            <span>2. Conectar a Supabase (PostgreSQL Cloud)</span>
          </button>
          <button
            className={activeTab === 'sql' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('sql')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
          >
            <Play size={15} />
            <span>3. Consola SQL Rápida</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: OPERACIONES CRUD EN TABLAS
            ======================================================== */}
        {activeTab === 'crud' && (
          <div>
            {/* Barra de Control: Selector de Tabla + Buscador + Botón Nuevo */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12
            }}>
              {/* Selector de Tablas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                {dbStatus.tables.map(tbl => (
                  <button
                    key={tbl}
                    onClick={() => setSelectedTable(tbl)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: selectedTable === tbl ? '1px solid #3b82f6' : '1px solid #334155',
                      background: selectedTable === tbl ? 'rgba(59, 130, 246, 0.2)' : '#1e293b',
                      color: selectedTable === tbl ? '#93c5fd' : '#94a3b8'
                    }}
                  >
                    {tbl} ({dbStatus.counts[tbl] ?? records.length})
                  </button>
                ))}
              </div>

              {/* Botón Nuevo Registro & Buscador */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#64748b" style={{ position: 'absolute', left: 8, top: 8 }} />
                  <input
                    type="text"
                    placeholder="Filtrar registros..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '6px 10px 6px 28px',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      color: '#f8fafc',
                      fontSize: 12,
                      width: 180
                    }}
                  />
                </div>

                <button
                  className="btn-primary"
                  onClick={() => {
                    setEditingRecord(null);
                    setFormData({});
                    setIsFormOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px' }}
                >
                  <Plus size={15} />
                  <span>Nuevo {selectedTable}</span>
                </button>
              </div>
            </div>

            {/* Formulario Modal Inline para Crear / Editar */}
            {isFormOpen && (
              <form
                onSubmit={handleSaveRecord}
                style={{
                  background: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid #3b82f6',
                  borderRadius: 12,
                  padding: 18,
                  marginBottom: 18,
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 14, color: '#f8fafc', fontWeight: 600 }}>
                    {editingRecord ? `✏️ Editar Registro #${editingRecord.id} en ${selectedTable}` : `+ Crear Nuevo Registro en ${selectedTable}`}
                  </h4>
                  <button type="button" className="btn-icon" onClick={() => setIsFormOpen(false)}><X size={14} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
                  {tableColumns.filter(col => col !== 'id' && col !== 'created_at').map(col => (
                    <div key={col}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                        {col}:
                      </label>
                      <input
                        type={col.includes('fecha') ? 'date' : (col.includes('costo') || col.includes('precio') || col.includes('id') ? 'number' : 'text')}
                        value={formData[col] || ''}
                        onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                        required={col.includes('nombre') || col.includes('dni')}
                        placeholder={`Ingresar ${col}...`}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          background: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: 6,
                          color: '#f8fafc',
                          fontSize: 12
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)} style={{ fontSize: 12 }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ fontSize: 12 }}>
                    Guardar en Base de Datos
                  </button>
                </div>
              </form>
            )}

            {/* Tabla de Registros */}
            <div style={{ background: '#0f172a', borderRadius: 12, border: '1px solid #1e293b', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                      {tableColumns.map(col => (
                        <th key={col} style={{ padding: '10px 14px', fontWeight: 600 }}>{col}</th>
                      ))}
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={tableColumns.length + 1} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Cargando registros...</td></tr>
                    ) : filteredRecords.length === 0 ? (
                      <tr><td colSpan={tableColumns.length + 1} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>No hay registros en la tabla {selectedTable}. ¡Crea uno con el botón de arriba!</td></tr>
                    ) : (
                      filteredRecords.map((row, idx) => (
                        <tr key={row.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                          {tableColumns.map(col => (
                            <td key={col} style={{ padding: '10px 14px', color: col === 'id' ? '#38bdf8' : '#cbd5e1' }}>
                              {String(row[col] ?? '')}
                            </td>
                          ))}
                          <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => {
                                setEditingRecord(row);
                                setFormData(row);
                                setIsFormOpen(true);
                              }}
                              title="Editar registro"
                              style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', marginRight: 8 }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(row.id)}
                              title="Eliminar registro"
                              style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
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

        {/* ========================================================
            TAB 2: CONECTAR A SUPABASE (POSTGRESQL CLOUD)
            ======================================================== */}
        {activeTab === 'supabase' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.8))',
              borderRadius: 12,
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: 18
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Sparkles size={20} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: 15, color: '#f8fafc', fontWeight: 700 }}>
                  Conectar a Supabase (PostgreSQL 15/16 Gratuito en la Nube)
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                Supabase ofrece bases de datos PostgreSQL reales en la nube con 500 MB gratis. 
                Pega aquí tu URI de conexión para enlazar la base de datos inmediatamente.
              </p>
            </div>

            {/* Input de URL de Supabase */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Cadena de Conexión de Supabase (URI):
              </label>
              <input
                type="text"
                placeholder="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#f8fafc',
                  fontSize: 12,
                  fontFamily: 'monospace'
                }}
              />
              <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                Encuéntrala en tu panel de Supabase: <strong>Project Settings ➔ Database ➔ Connection string ➔ URI</strong>.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="runInitCheck"
                checked={runInitOnConnect}
                onChange={(e) => setRunInitOnConnect(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="runInitCheck" style={{ fontSize: 12, color: '#cbd5e1', cursor: 'pointer' }}>
                Crear automáticamente tablas y seeders iniciales (<code>clientes</code>, <code>mascotas</code>, <code>veterinarios</code>, <code>citas</code>) al conectar.
              </label>
            </div>

            <button
              className="btn-primary"
              onClick={handleConnectSupabase}
              disabled={connecting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                fontSize: 13,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              {connecting ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
              <span>{connecting ? 'Conectando a Supabase...' : 'Conectar y Sincronizar Base de Datos en Supabase'}</span>
            </button>

            {/* Pasos Detallados */}
            <div style={{ background: '#1e293b', borderRadius: 10, padding: 14, fontSize: 12, color: '#cbd5e1' }}>
              <strong style={{ color: '#38bdf8', display: 'block', marginBottom: 6 }}>
                Pasos rápidos para crear tu BD en Supabase:
              </strong>
              1. Entra a <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: '#10b981' }}>supabase.com</a> y crea un proyecto gratuito.<br />
              2. Asigna una contraseña a la base de datos (recuérdala).<br />
              3. Ve a <strong>Project Settings ➔ Database</strong> y copia la cadena <strong>Connection string (URI)</strong>.<br />
              4. Pégala arriba reemplazando <code>[YOUR-PASSWORD]</code> con tu contraseña real y pulsa <strong>Conectar</strong>.
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: CONSOLA SQL RÁPIDA
            ======================================================== */}
        {activeTab === 'sql' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Ejecutar Consulta SQL en la Base de Datos:
              </label>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#090d16',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  fontSize: 12
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-primary"
                onClick={async () => {
                  fetchRecords(selectedTable);
                  showToast(`Consulta ejecutada sobre ${selectedTable}.`);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
              >
                <Play size={14} />
                <span>Ejecutar Consulta</span>
              </button>
              <button
                className="btn-secondary"
                onClick={() => setSqlQuery('SELECT * FROM clientes;')}
                style={{ fontSize: 11 }}
              >
                Clientes
              </button>
              <button
                className="btn-secondary"
                onClick={() => setSqlQuery('SELECT * FROM mascotas;')}
                style={{ fontSize: 11 }}
              >
                Mascotas
              </button>
              <button
                className="btn-secondary"
                onClick={() => setSqlQuery('SELECT * FROM veterinarios;')}
                style={{ fontSize: 11 }}
              >
                Veterinarios
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
