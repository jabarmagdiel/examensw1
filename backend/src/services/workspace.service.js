import { db } from '../config/db.config.js';

const INITIAL_FOLDERS = [
  { id: 'f_1', name: 'Sector Salud & Veterinarias', icon: 'stethoscope', color: '#10b981', createdAt: Date.now() - 86400000 * 5 },
  { id: 'f_2', name: 'Sector Farmacéutico & Retail', icon: 'shopping-bag', color: '#06b6d4', createdAt: Date.now() - 86400000 * 3 },
  { id: 'f_3', name: 'Sector Financiero & ERP', icon: 'building', color: '#8b5cf6', createdAt: Date.now() - 86400000 }
];

const INITIAL_PROJECTS = [
  {
    id: 'proj_veterinaria_1',
    name: 'Sistema de Gestión Veterinaria',
    client: 'Clínica Veterinaria San Roque',
    folderId: 'f_1',
    status: 'Diseño',
    entities: [],
    relationships: [],
    functionalDependencies: [],
    updatedAt: Date.now(),
    version: 1
  }
];

class WorkspaceService {
  constructor() {
    this.folders = [...INITIAL_FOLDERS];
    this.projects = [...INITIAL_PROJECTS];
  }

  getWorkspace() {
    return {
      folders: this.folders,
      projects: this.projects
    };
  }

  createFolder(folder) {
    if (!folder.id) folder.id = `f_${Date.now()}`;
    if (!this.folders.some(f => f.id === folder.id)) {
      this.folders.push(folder);
    }
    return folder;
  }

  deleteFolder(folderId) {
    this.folders = this.folders.filter(f => f.id !== folderId);
    this.projects = this.projects.map(p => p.folderId === folderId ? { ...p, folderId: 'f_1' } : p);
    return true;
  }

  createProject(project) {
    if (!project.id) project.id = `proj_${Date.now()}`;
    const idx = this.projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      this.projects[idx] = project;
    } else {
      this.projects.push(project);
    }

    if (db.isConnected()) {
      db.query(
        `INSERT INTO projects (id, name, client, status, puds_phase) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (id) DO UPDATE SET name = $2, client = $3, status = $4`,
        [project.id, project.name, project.client || 'Cliente General', project.status || 'Diseño', 'Elaboración']
      ).catch(e => console.warn('[Supabase Sync] Error syncing project:', e.message));
    }
    return project;
  }

  updateProject(project) {
    const idx = this.projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      this.projects[idx] = { ...this.projects[idx], ...project, updatedAt: Date.now() };
    } else {
      this.projects.push(project);
    }
    return this.projects[idx] || project;
  }

  deleteProject(projectId) {
    this.projects = this.projects.filter(p => p.id !== projectId);
    if (db.isConnected()) {
      db.query(`DELETE FROM projects WHERE id = $1`, [projectId]).catch(e => {});
    }
    return true;
  }
}

export const workspaceService = new WorkspaceService();
