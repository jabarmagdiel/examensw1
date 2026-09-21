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
    entities: [
      {
        id: 'ent_cliente',
        name: 'Cliente',
        tableName: 'clientes',
        x: 60,
        y: 80,
        color: '#3b82f6',
        attributes: [
          { id: 'cli_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'cli_2', name: 'dni', type: 'VARCHAR', length: 20, isPrimaryKey: false, isNullable: false, isUnique: true },
          { id: 'cli_3', name: 'nombreCompleto', type: 'VARCHAR', length: 150, isPrimaryKey: false, isNullable: false },
          { id: 'cli_4', name: 'telefono', type: 'VARCHAR', length: 20, isPrimaryKey: false, isNullable: false },
          { id: 'cli_5', name: 'direccion', type: 'VARCHAR', length: 200, isPrimaryKey: false, isNullable: true }
        ]
      },
      {
        id: 'ent_paciente',
        name: 'Mascota',
        tableName: 'mascotas',
        x: 420,
        y: 80,
        color: '#10b981',
        attributes: [
          { id: 'mas_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'mas_2', name: 'nombre', type: 'VARCHAR', length: 80, isPrimaryKey: false, isNullable: false },
          { id: 'mas_3', name: 'especie', type: 'VARCHAR', length: 50, isPrimaryKey: false, isNullable: false },
          { id: 'mas_4', name: 'raza', type: 'VARCHAR', length: 60, isPrimaryKey: false, isNullable: true },
          { id: 'mas_5', name: 'fechaNacimiento', type: 'DATE', isPrimaryKey: false, isNullable: true },
          { id: 'mas_6', name: 'cliente_id', type: 'BIGINT', isPrimaryKey: false, isForeignKey: true, isNullable: false }
        ]
      },
      {
        id: 'ent_veterinario',
        name: 'Veterinario',
        tableName: 'veterinarios',
        x: 780,
        y: 80,
        color: '#8b5cf6',
        attributes: [
          { id: 'vet_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'vet_2', name: 'matricula', type: 'VARCHAR', length: 30, isPrimaryKey: false, isNullable: false, isUnique: true },
          { id: 'vet_3', name: 'nombre', type: 'VARCHAR', length: 120, isPrimaryKey: false, isNullable: false },
          { id: 'vet_4', name: 'especialidad', type: 'VARCHAR', length: 80, isPrimaryKey: false, isNullable: false },
          { id: 'vet_5', name: 'telefono', type: 'VARCHAR', length: 20, isPrimaryKey: false, isNullable: true }
        ]
      },
      {
        id: 'ent_cita',
        name: 'CitaMedica',
        tableName: 'citas_medicas',
        x: 420,
        y: 380,
        color: '#f59e0b',
        attributes: [
          { id: 'cit_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'cit_2', name: 'fechaHora', type: 'TIMESTAMP', isPrimaryKey: false, isNullable: false },
          { id: 'cit_3', name: 'motivo', type: 'TEXT', isPrimaryKey: false, isNullable: false },
          { id: 'cit_4', name: 'estado', type: 'VARCHAR', length: 30, isPrimaryKey: false, isNullable: false },
          { id: 'cit_5', name: 'mascota_id', type: 'BIGINT', isPrimaryKey: false, isForeignKey: true, isNullable: false },
          { id: 'cit_6', name: 'veterinario_id', type: 'BIGINT', isPrimaryKey: false, isForeignKey: true, isNullable: false }
        ]
      },
      {
        id: 'ent_historial',
        name: 'HistorialClinico',
        tableName: 'historiales_clinicos',
        x: 60,
        y: 380,
        color: '#ef4444',
        attributes: [
          { id: 'his_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'his_2', name: 'diagnostico', type: 'TEXT', isPrimaryKey: false, isNullable: false },
          { id: 'his_3', name: 'tratamiento', type: 'TEXT', isPrimaryKey: false, isNullable: false },
          { id: 'his_4', name: 'fechaRegistro', type: 'DATE', isPrimaryKey: false, isNullable: false },
          { id: 'his_5', name: 'mascota_id', type: 'BIGINT', isPrimaryKey: false, isForeignKey: true, isNullable: false }
        ]
      }
    ],
    relationships: [
      { id: 'rel_cli_mas', name: 'posee', sourceEntityId: 'ent_cliente', targetEntityId: 'ent_paciente', cardinality: '1:N' },
      { id: 'rel_mas_cit', name: 'agenda', sourceEntityId: 'ent_paciente', targetEntityId: 'ent_cita', cardinality: '1:N' },
      { id: 'rel_vet_cit', name: 'atiende', sourceEntityId: 'ent_veterinario', targetEntityId: 'ent_cita', cardinality: '1:N' },
      { id: 'rel_mas_his', name: 'registra', sourceEntityId: 'ent_paciente', targetEntityId: 'ent_historial', cardinality: '1:1' }
    ],
    functionalDependencies: [
      { id: 'fd_cli_1', determinant: ['dni'], dependent: ['nombreCompleto', 'telefono', 'direccion'] },
      { id: 'fd_vet_1', determinant: ['matricula'], dependent: ['nombre', 'especialidad'] },
      { id: 'fd_mas_1', determinant: ['id'], dependent: ['nombre', 'especie', 'raza', 'fechaNacimiento', 'cliente_id'] }
    ],
    updatedAt: Date.now(),
    version: 1
  },
  {
    id: 'proj_farmacia_1',
    name: 'Sistema de Farmacia & Lotes',
    client: 'Farmacias del Sur S.A.',
    folderId: 'f_2',
    status: 'Normalización',
    entities: [
      {
        id: 'ent_proveedor',
        name: 'Proveedor',
        tableName: 'proveedores',
        x: 80,
        y: 100,
        color: '#3b82f6',
        attributes: [
          { id: 'pr_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'pr_2', name: 'razonSocial', type: 'VARCHAR', length: 120, isPrimaryKey: false, isNullable: false },
          { id: 'pr_3', name: 'nit', type: 'VARCHAR', length: 20, isPrimaryKey: false, isNullable: false, isUnique: true },
          { id: 'pr_4', name: 'telefono', type: 'VARCHAR', length: 20, isPrimaryKey: false, isNullable: false }
        ]
      },
      {
        id: 'ent_medicamento',
        name: 'Medicamento',
        tableName: 'medicamentos',
        x: 440,
        y: 100,
        color: '#10b981',
        attributes: [
          { id: 'm_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'm_2', name: 'codigoBarras', type: 'VARCHAR', length: 50, isPrimaryKey: false, isNullable: false, isUnique: true },
          { id: 'm_3', name: 'nombreComercial', type: 'VARCHAR', length: 100, isPrimaryKey: false, isNullable: false },
          { id: 'm_4', name: 'principioActivo', type: 'VARCHAR', length: 100, isPrimaryKey: false, isNullable: false },
          { id: 'm_5', name: 'precio', type: 'DECIMAL', isPrimaryKey: false, isNullable: false }
        ]
      },
      {
        id: 'ent_lote',
        name: 'Lote',
        tableName: 'lotes',
        x: 800,
        y: 100,
        color: '#f59e0b',
        attributes: [
          { id: 'l_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'l_2', name: 'numeroLote', type: 'VARCHAR', length: 40, isPrimaryKey: false, isNullable: false },
          { id: 'l_3', name: 'fechaVencimiento', type: 'DATE', isPrimaryKey: false, isNullable: false },
          { id: 'l_4', name: 'stockActual', type: 'INTEGER', isPrimaryKey: false, isNullable: false }
        ]
      },
      {
        id: 'ent_venta',
        name: 'Venta',
        tableName: 'ventas',
        x: 440,
        y: 380,
        color: '#8b5cf6',
        attributes: [
          { id: 'v_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'v_2', name: 'fechaHora', type: 'TIMESTAMP', isPrimaryKey: false, isNullable: false },
          { id: 'v_3', name: 'total', type: 'DECIMAL', isPrimaryKey: false, isNullable: false },
          { id: 'v_4', name: 'clienteNombre', type: 'VARCHAR', length: 100, isPrimaryKey: false, isNullable: false }
        ]
      }
    ],
    relationships: [
      { id: 'rel_pr_m', name: 'suministra', sourceEntityId: 'ent_proveedor', targetEntityId: 'ent_medicamento', cardinality: '1:N' },
      { id: 'rel_m_l', name: 'clasifica', sourceEntityId: 'ent_medicamento', targetEntityId: 'ent_lote', cardinality: '1:N' },
      { id: 'rel_m_v', name: 'incluye', sourceEntityId: 'ent_medicamento', targetEntityId: 'ent_venta', cardinality: 'N:M' }
    ],
    functionalDependencies: [
      { id: 'fd_pr1', determinant: ['nit'], dependent: ['razonSocial', 'telefono'] },
      { id: 'fd_m1', determinant: ['codigoBarras'], dependent: ['nombreComercial', 'principioActivo', 'precio'] }
    ],
    updatedAt: Date.now() - 3600000,
    version: 1
  },
  {
    id: 'proj_ecommerce_1',
    name: 'Plataforma E-Commerce Multitienda',
    client: 'Retail Express Corp',
    folderId: 'f_2',
    status: 'Implementación',
    entities: [
      {
        id: 'ent_usr',
        name: 'Usuario',
        tableName: 'usuarios',
        x: 80,
        y: 100,
        attributes: [
          { id: 'u_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'u_2', name: 'email', type: 'VARCHAR', length: 120, isPrimaryKey: false, isNullable: false, isUnique: true },
          { id: 'u_3', name: 'nombre', type: 'VARCHAR', length: 80, isPrimaryKey: false, isNullable: false }
        ]
      },
      {
        id: 'ent_prod',
        name: 'Producto',
        tableName: 'productos',
        x: 750,
        y: 100,
        attributes: [
          { id: 'p_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'p_2', name: 'sku', type: 'VARCHAR', length: 50, isPrimaryKey: false, isNullable: false, isUnique: true },
          { id: 'p_3', name: 'precio', type: 'DECIMAL', isPrimaryKey: false, isNullable: false },
          { id: 'p_4', name: 'stock', type: 'INTEGER', isPrimaryKey: false, isNullable: false }
        ]
      },
      {
        id: 'ent_ord',
        name: 'Pedido',
        tableName: 'pedidos',
        x: 80,
        y: 360,
        attributes: [
          { id: 'o_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'o_2', name: 'fecha', type: 'DATE', isPrimaryKey: false, isNullable: false },
          { id: 'o_3', name: 'total', type: 'DECIMAL', isPrimaryKey: false, isNullable: false },
          { id: 'o_4', name: 'usuario_id', type: 'BIGINT', isPrimaryKey: false, isForeignKey: true, isNullable: false }
        ]
      },
      {
        id: 'ent_det',
        name: 'DetallePedido',
        tableName: 'detalles_pedidos',
        x: 750,
        y: 360,
        attributes: [
          { id: 'd_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: 'd_2', name: 'cantidad', type: 'INTEGER', isPrimaryKey: false, isNullable: false },
          { id: 'd_3', name: 'precioUnitario', type: 'DECIMAL', isPrimaryKey: false, isNullable: false },
          { id: 'd_4', name: 'pedido_id', type: 'BIGINT', isPrimaryKey: false, isForeignKey: true, isNullable: false },
          { id: 'd_5', name: 'producto_id', type: 'BIGINT', isPrimaryKey: false, isForeignKey: true, isNullable: false }
        ]
      }
    ],
    relationships: [
      { id: 'rel_u_o', name: 'realiza', sourceEntityId: 'ent_usr', targetEntityId: 'ent_ord', cardinality: '1:N' },
      { id: 'rel_o_d', name: 'contiene', sourceEntityId: 'ent_ord', targetEntityId: 'ent_det', cardinality: '1:N' },
      { id: 'rel_p_d', name: 'referencia', sourceEntityId: 'ent_prod', targetEntityId: 'ent_det', cardinality: '1:N' }
    ],
    functionalDependencies: [
      { id: 'fd_u1', determinant: ['email'], dependent: ['nombre'] },
      { id: 'fd_p1', determinant: ['sku'], dependent: ['precio', 'stock'] }
    ],
    updatedAt: Date.now() - 7200000,
    version: 2
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
