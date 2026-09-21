import React, { useState } from 'react';
import { 
  Folder, 
  FolderPlus, 
  Plus, 
  Layers, 
  Calendar, 
  User, 
  Search, 
  MoreVertical, 
  ExternalLink, 
  Trash2, 
  Copy, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { DiagramModel, ProjectFolder } from '../../types/case';

interface ProjectManagerViewProps {
  folders: ProjectFolder[];
  projects: DiagramModel[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateFolder: (folderName: string, color?: string) => void;
  onCreateProject: (folderId: string, projectName: string, clientName: string, template: 'veterinaria' | 'farmacia' | 'ecommerce' | 'blank') => void;
  onDeleteProject: (projectId: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export const ProjectManagerView: React.FC<ProjectManagerViewProps> = ({
  folders,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateFolder,
  onCreateProject,
  onDeleteProject,
  onDeleteFolder
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjFolderId, setNewProjFolderId] = useState(folders[0]?.id || 'f_1');
  const [newProjTemplate, setNewProjTemplate] = useState<'veterinaria' | 'farmacia' | 'ecommerce' | 'blank'>('veterinaria');

  const filteredProjects = projects.filter(p => {
    const matchesFolder = selectedFolderId === 'all' || p.folderId === selectedFolderId;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.client && p.client.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFolder && matchesSearch;
  });

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    onCreateProject(newProjFolderId, newProjName.trim(), newProjClient.trim() || 'Cliente General', newProjTemplate);
    setNewProjName('');
    setNewProjClient('');
    setIsCreatingProject(false);
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'Producción': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399' };
      case 'Implementación': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' };
      case 'Normalización': return { bg: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' };
      case 'Diseño':
      default:
        return { bg: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' };
    }
  };

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      height: 'calc(100vh - var(--header-height) - 40px)',
      margin: '0 16px 16px 16px',
      gap: 16,
      overflow: 'hidden'
    }}>
      {/* Columna Izquierda: Árbol de Carpetas Empresariales */}
      <div className="glass-panel" style={{
        width: 300,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={16} color="var(--accent-primary)" />
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Carpetas de Empresa
            </h3>
          </div>
          <button
            className="btn-icon"
            style={{ width: 28, height: 28 }}
            onClick={() => setIsCreatingFolder(true)}
            title="Crear Nueva Carpeta"
          >
            <FolderPlus size={14} />
          </button>
        </div>

        {/* Totalizador Todos los proyectos */}
        <button
          onClick={() => setSelectedFolderId('all')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: 8,
            background: selectedFolderId === 'all' ? 'var(--accent-primary)' : 'transparent',
            color: selectedFolderId === 'all' ? '#fff' : 'var(--text-secondary)',
            marginBottom: 8,
            fontSize: 12,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={14} />
            <span>Todos los Proyectos</span>
          </div>
          <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 10 }}>
            {projects.length}
          </span>
        </button>

        {/* Lista de Carpetas */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {folders.map(f => {
            const isSelected = selectedFolderId === f.id;
            const projectCount = projects.filter(p => p.folderId === f.id).length;
            return (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? `1px solid ${f.color || 'var(--accent-primary)'}` : '1px solid transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedFolderId(f.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <Folder size={15} color={f.color || '#3b82f6'} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {f.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{projectCount}</span>
                  {f.id !== 'f_1' && f.id !== 'f_2' && (
                    <button
                      className="btn-icon"
                      style={{ width: 18, height: 18, padding: 0 }}
                      onClick={(e) => { e.stopPropagation(); onDeleteFolder(f.id); }}
                    >
                      <Trash2 size={10} color="#f43f5e" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Inline Crear Carpeta */}
        {isCreatingFolder && (
          <form onSubmit={handleCreateFolderSubmit} style={{ marginTop: 12, background: 'var(--bg-surface)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Nueva Carpeta</div>
            <input
              type="text"
              placeholder="Nombre carpeta (ej: Sector Minería)"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              required
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '4px 8px', color: '#fff', fontSize: 11, marginBottom: 6 }}
            />
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ec4899'].map(c => (
                <div
                  key={c}
                  onClick={() => setNewFolderColor(c)}
                  style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: newFolderColor === c ? '2px solid #fff' : 'none', cursor: 'pointer' }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, fontSize: 10, padding: '3px 0' }}>Crear</button>
              <button type="button" className="btn-secondary" style={{ fontSize: 10, padding: '3px 6px' }} onClick={() => setIsCreatingFolder(false)}>Cancelar</button>
            </div>
          </form>
        )}
      </div>

      {/* Columna Derecha: Explorador de Proyectos de la Empresa */}
      <div className="glass-panel" style={{
        flex: 1,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Top bar con Buscador y Botón Crear Proyecto */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 400 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Buscar proyectos por nombre o cliente..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 20,
                  padding: '6px 12px 6px 32px',
                  color: '#fff',
                  fontSize: 12
                }}
              />
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ fontSize: 12, padding: '8px 16px' }}
            onClick={() => setIsCreatingProject(true)}
          >
            <Plus size={15} />
            <span>Nuevo Proyecto CASE</span>
          </button>
        </div>

        {/* Grilla de Tarjetas de Proyectos */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, paddingRight: 4 }}>
          {filteredProjects.map(proj => {
            const isActive = proj.id === activeProjectId;
            const badge = getStatusBadgeColor(proj.status);
            const folder = folders.find(f => f.id === proj.folderId);

            return (
              <div
                key={proj.id}
                className="glass-card"
                style={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isActive ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Status & Folder tags */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="badge" style={{ background: badge.bg, color: badge.color, fontSize: 10 }}>
                      ● {proj.status || 'Diseño'}
                    </span>
                    {folder && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Folder size={11} color={folder.color} /> {folder.name}
                      </span>
                    )}
                  </div>

                  {/* Nombre y Cliente */}
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>
                    {proj.name}
                  </h4>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Cliente: <strong style={{ color: '#fff' }}>{proj.client || 'General'}</strong>
                  </div>

                  {/* Métricas del Proyecto */}
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: 6 }}>
                    <div>
                      <strong style={{ color: '#fff' }}>{proj.entities.length}</strong> Entidades
                    </div>
                    <div>
                      <strong style={{ color: '#fff' }}>{proj.relationships.length}</strong> Relaciones
                    </div>
                    <div>
                      <strong style={{ color: '#fff' }}>{proj.functionalDependencies?.length || 0}</strong> DFs
                    </div>
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    v{proj.version || 1} • Activo
                  </span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-primary"
                      style={{ fontSize: 11, padding: '5px 12px' }}
                      onClick={() => onSelectProject(proj.id)}
                    >
                      {isActive ? 'En Edición' : 'Abrir Estudio'} <ArrowRight size={12} />
                    </button>

                    {proj.id !== 'proj_veterinaria_1' && (
                      <button
                        className="btn-icon"
                        style={{ width: 26, height: 26 }}
                        onClick={() => onDeleteProject(proj.id)}
                        title="Eliminar proyecto"
                      >
                        <Trash2 size={12} color="#f43f5e" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Crear Nuevo Proyecto */}
        {isCreatingProject && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="glass-panel" style={{ width: 440, padding: 22, borderRadius: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px 0' }}>Nuevo Proyecto de Software (CASE)</h3>
              <form onSubmit={handleCreateProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nombre del Sistema:</label>
                  <input
                    type="text"
                    placeholder="ej: Sistema de Facturación Electrónica"
                    value={newProjName}
                    onChange={e => setNewProjName(e.target.value)}
                    required
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Cliente / Empresa:</label>
                  <input
                    type="text"
                    placeholder="ej: Corporación Minera del Sur"
                    value={newProjClient}
                    onChange={e => setNewProjClient(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Carpeta Contenedora:</label>
                  <select
                    value={newProjFolderId}
                    onChange={e => setNewProjFolderId(e.target.value)}
                    style={{ width: '100%', background: '#11192e', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12 }}
                  >
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Plantilla Inicial del Dominio:</label>
                  <select
                    value={newProjTemplate}
                    onChange={e => setNewProjTemplate(e.target.value as any)}
                    style={{ width: '100%', background: '#11192e', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12 }}
                  >
                    <option value="veterinaria">Plantilla Veterinaria (Escenario Examen)</option>
                    <option value="farmacia">Plantilla Farmacia & Medicamentos</option>
                    <option value="ecommerce">Plantilla E-Commerce & Ventas</option>
                    <option value="blank">Lienzo en Blanco (Diseñar desde cero por voz)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={() => setIsCreatingProject(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, fontSize: 12 }}>Crear y Abrir</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
