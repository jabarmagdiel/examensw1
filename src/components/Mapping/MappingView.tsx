import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Table2, 
  Download, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Key, 
  Link2, 
  Layers, 
  Code, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink,
  Info,
  Database,
  Eye,
  FileText
} from 'lucide-react';
import { DiagramModel, Entity, Relationship } from '../../types/case';

interface MappingViewProps {
  projects: DiagramModel[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onOpenDesignStudio: (id: string) => void;
}

export const MappingView: React.FC<MappingViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenDesignStudio
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'attributes' | 'relations' | 'tables'>('attributes');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const selectedProj = projects.find(p => p.id === selectedProjectId) || projects[0] || {
    id: 'default',
    name: 'Proyecto',
    client: 'Cliente',
    status: 'Diseño',
    entities: [],
    relationships: [],
    version: 1
  };

  // Mapeo de tipos de datos SQL a Java
  const mapSqlToJavaType = (sqlType: string): string => {
    const t = sqlType.toUpperCase();
    if (t.includes('INT') || t.includes('SERIAL')) return t.includes('BIG') ? 'Long' : 'Integer';
    if (t.includes('CHAR') || t.includes('TEXT')) return 'String';
    if (t.includes('DECIMAL') || t.includes('NUMERIC') || t.includes('FLOAT') || t.includes('DOUBLE')) return 'Double';
    if (t.includes('BOOL')) return 'Boolean';
    if (t.includes('DATE') || t.includes('TIME')) return 'LocalDate';
    return 'String';
  };

  // Generar filas detalladas del mapeo de atributos
  const mappingRows = useMemo(() => {
    const rows: {
      entityId: string;
      entityName: string;
      tableName: string;
      attributeName: string;
      columnName: string;
      sqlType: string;
      javaType: string;
      isPrimaryKey: boolean;
      isForeignKey: boolean;
      referencedTable: string;
      isNullable: boolean;
      jpaAnnotation: string;
      constraintStr: string;
    }[] = [];

    selectedProj.entities.forEach(entity => {
      const tableName = entity.tableName || entity.name.toLowerCase() + 's';
      
      entity.attributes.forEach(attr => {
        // Buscar si este atributo es FK de alguna relación
        let referencedTable = '-';
        let isFK = !!attr.isForeignKey;

        const relFound = selectedProj.relationships.find(r => 
          r.targetEntityId === entity.id && 
          r.foreignKeyAttributeName?.toLowerCase() === attr.name.toLowerCase()
        );

        if (relFound) {
          isFK = true;
          const sourceEnt = selectedProj.entities.find(e => e.id === relFound.sourceEntityId);
          if (sourceEnt) {
            referencedTable = `${sourceEnt.name} (id)`;
          }
        }

        // Tipo Java
        const javaType = mapSqlToJavaType(attr.type);

        // Anotación JPA
        let jpaAnnotation = `@Column(name = "${attr.name}")`;
        if (attr.isPrimaryKey) {
          jpaAnnotation = '@Id @GeneratedValue(strategy = GenerationType.IDENTITY)';
        } else if (isFK) {
          jpaAnnotation = `@ManyToOne @JoinColumn(name = "${attr.name}")`;
        }

        // Restricción SQL
        let constraintStr = attr.isNullable ? 'NULL' : 'NOT NULL';
        if (attr.isPrimaryKey) constraintStr = 'PRIMARY KEY NOT NULL';
        if (isFK && referencedTable !== '-') constraintStr = `FK REFERENCES ${referencedTable}`;

        rows.push({
          entityId: entity.id,
          entityName: entity.name,
          tableName,
          attributeName: attr.name,
          columnName: attr.name.toLowerCase(),
          sqlType: attr.type + (attr.length ? `(${attr.length})` : ''),
          javaType,
          isPrimaryKey: !!attr.isPrimaryKey,
          isForeignKey: isFK,
          referencedTable,
          isNullable: !!attr.isNullable,
          jpaAnnotation,
          constraintStr
        });
      });
    });

    return rows;
  }, [selectedProj]);

  // Filas filtradas por tabla y texto de búsqueda
  const filteredRows = useMemo(() => {
    return mappingRows.filter(r => {
      const matchesEntity = selectedEntityId === 'all' || r.entityId === selectedEntityId;
      const matchesQuery = searchQuery === '' || 
        r.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.attributeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.columnName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sqlType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.javaType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesEntity && matchesQuery;
    });
  }, [mappingRows, selectedEntityId, searchQuery]);

  // Filas de Mapeo de Relaciones
  const relationshipRows = useMemo(() => {
    return selectedProj.relationships.map(rel => {
      const source = selectedProj.entities.find(e => e.id === rel.sourceEntityId);
      const target = selectedProj.entities.find(e => e.id === rel.targetEntityId);
      const sourceName = source ? source.name : 'Desconocido';
      const targetName = target ? target.name : 'Desconocido';
      const fkName = rel.foreignKeyAttributeName || `${sourceName.toLowerCase()}_id`;

      let jpaMapping = '';
      if (rel.cardinality === '1:N') {
        jpaMapping = `${targetName}: @ManyToOne / ${sourceName}: @OneToMany(mappedBy = "${sourceName.toLowerCase()}")`;
      } else if (rel.cardinality === '1:1') {
        jpaMapping = `@OneToOne @JoinColumn(name = "${fkName}")`;
      } else {
        jpaMapping = `@ManyToMany @JoinTable(name = "${sourceName.toLowerCase()}_${targetName.toLowerCase()}")`;
      }

      return {
        id: rel.id,
        verb: rel.name || 'asocia',
        cardinality: rel.cardinality,
        sourceTable: source ? (source.tableName || sourceName.toLowerCase() + 's') : sourceName,
        targetTable: target ? (target.tableName || targetName.toLowerCase() + 's') : targetName,
        sourceEntity: sourceName,
        targetEntity: targetName,
        fkName,
        jpaMapping
      };
    });
  }, [selectedProj]);

  // Exportar a Excel con XLSX
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Hoja Diccionario & Mapeo de Atributos
    const excelAttributesData = mappingRows.map(r => ({
      'Entidad / Modelo': r.entityName,
      'Tabla SQL': r.tableName,
      'Atributo Lógico': r.attributeName,
      'Columna Física SQL': r.columnName,
      'Tipo de Dato SQL': r.sqlType,
      'Tipo de Dato Java': r.javaType,
      'Es PK (Clave Primaria)': r.isPrimaryKey ? 'SÍ' : 'NO',
      'Es FK (Clave Foránea)': r.isForeignKey ? 'SÍ' : 'NO',
      'Tabla / Campo Referenciado': r.referencedTable,
      'Permite Nulos': r.isNullable ? 'SÍ' : 'NO',
      'Restricción (Constraint)': r.constraintStr,
      'Anotación JPA (Spring Boot)': r.jpaAnnotation
    }));
    const wsAttributes = XLSX.utils.json_to_sheet(excelAttributesData);
    // Ajustar ancho de columnas aproximado
    wsAttributes['!cols'] = [
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
      { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
      { wch: 22 }, { wch: 14 }, { wch: 26 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, wsAttributes, 'Diccionario_Atributos');

    // 2. Hoja Mapeo de Relaciones & Foreign Keys
    const excelRelationsData = relationshipRows.map(rel => ({
      'Entidad Origen': rel.sourceEntity,
      'Tabla Origen': rel.sourceTable,
      'Cardinalidad': rel.cardinality,
      'Verbo de Asociación': rel.verb,
      'Entidad Destino': rel.targetEntity,
      'Tabla Destino': rel.targetTable,
      'Clave Foránea (FK)': rel.fkName,
      'Mapeo JPA Hibernate': rel.jpaMapping
    }));
    const wsRelations = XLSX.utils.json_to_sheet(excelRelationsData);
    wsRelations['!cols'] = [
      { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 20 },
      { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 45 }
    ];
    XLSX.utils.book_append_sheet(wb, wsRelations, 'Mapeo_Relaciones_FK');

    // 3. Hoja Resumen de Tablas
    const excelTablesData = selectedProj.entities.map(e => {
      const pkCount = e.attributes.filter(a => a.isPrimaryKey).length;
      const fkCount = e.attributes.filter(a => a.isForeignKey).length;
      return {
        'Nombre Entidad': e.name,
        'Tabla Física': e.tableName || e.name.toLowerCase() + 's',
        'Clase Java': `${e.name}.java`,
        'Total Atributos': e.attributes.length,
        'Claves Primarias': pkCount,
        'Claves Foráneas': fkCount,
        'Controlador REST': `${e.name}Controller.java`,
        'Repositorio JPA': `${e.name}Repository.java`
      };
    });
    const wsTables = XLSX.utils.json_to_sheet(excelTablesData);
    wsTables['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 25 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTables, 'Resumen_Tablas');

    // Guardar archivo Excel .xlsx
    const cleanProjectName = selectedProj.name.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');
    const fileName = `Mapeo_BD_${cleanProjectName}_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fileName);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
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
      <div className="glass-panel" style={{
        flex: 1,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        position: 'relative'
      }}>
        {/* Toast de Descarga Exitosa */}
        {downloadSuccess && (
          <div style={{
            position: 'absolute',
            top: 14,
            right: 24,
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
            zIndex: 100
          }}>
            <CheckCircle2 size={16} color="#fff" />
            <span>✓ Libro de Excel (.xlsx) generado y descargado con éxito.</span>
          </div>
        )}

        {/* Encabezado Superior */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              width: 40,
              height: 40,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
            }}>
              <Table2 size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>
                Módulo de Mapeo de Diagramas & Tablas (Diccionario de Datos)
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Estructura formal de tablas, correspondencia de tipos SQL/Java, claves foráneas, restricciones y exportación a Excel
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Selector de Proyecto */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Proyecto:</span>
              <select
                value={selectedProjectId}
                onChange={e => {
                  setSelectedProjectId(e.target.value);
                  setSelectedEntityId('all');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#1e2230', color: '#fff' }}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Descargar Excel */}
            <button
              className="btn-primary"
              style={{
                fontSize: 12,
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 700
              }}
              onClick={handleExportExcel}
              title="Descargar libro de mapeo en formato Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet size={16} />
              <span>Descargar en Excel (.xlsx)</span>
            </button>

            {/* Abrir en Taller de Diseño */}
            <button
              className="btn-secondary"
              style={{ fontSize: 12, padding: '8px 14px', gap: 6, borderColor: '#818cf8', color: '#a5b4fc' }}
              onClick={() => onOpenDesignStudio(selectedProjectId)}
              title="Abrir este diagrama en el Taller de Diseño"
            >
              <span>Taller de Diseño</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Tarjetas de Resumen Rápido del Mapeo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(2, 132, 199, 0.3)', borderLeft: '4px solid #0284c7', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tablas / Entidades Mapeadas</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>{selectedProj.entities.length}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Modelos de base de datos</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(16, 185, 129, 0.3)', borderLeft: '4px solid #10b981', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Campos / Columnas Totales</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399', marginTop: 2 }}>{mappingRows.length}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Tipos SQL y Java tipados</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(168, 85, 247, 0.3)', borderLeft: '4px solid #a855f7', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Claves Primarias (PK)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#c084fc', marginTop: 2 }}>
              {mappingRows.filter(r => r.isPrimaryKey).length}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Identificadores únicos</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(245, 158, 11, 0.3)', borderLeft: '4px solid #f59e0b', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Relaciones & Claves Foráneas (FK)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>
              {relationshipRows.length}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Integridad referencial activa</div>
          </div>
        </div>

        {/* Pestañas y Filtros */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
          {/* Pestañas de Vista */}
          <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.3)', padding: 3, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveTab('attributes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 6,
                background: activeTab === 'attributes' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'attributes' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'attributes' ? 700 : 500
              }}
            >
              <Table2 size={13} />
              <span>1. Diccionario de Atributos & Columnas ({filteredRows.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('relations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 6,
                background: activeTab === 'relations' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'relations' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'relations' ? 700 : 500
              }}
            >
              <Link2 size={13} />
              <span>2. Mapeo de Relaciones & FKs ({relationshipRows.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 6,
                background: activeTab === 'tables' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'tables' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'tables' ? 700 : 500
              }}
            >
              <Layers size={13} />
              <span>3. Resumen Estructural de Tablas ({selectedProj.entities.length})</span>
            </button>
          </div>

          {/* Filtros de Tabla y Búsqueda */}
          {activeTab === 'attributes' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
              {/* Filtro por Entidad */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Filtrar Tabla:</span>
                <select
                  value={selectedEntityId}
                  onChange={e => setSelectedEntityId(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    padding: '5px 10px',
                    color: '#fff',
                    fontSize: 11,
                    outline: 'none'
                  }}
                >
                  <option value="all">Todas las tablas ({selectedProj.entities.length})</option>
                  {selectedProj.entities.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.tableName || e.name.toLowerCase() + 's'})</option>
                  ))}
                </select>
              </div>

              {/* Input de Búsqueda */}
              <div style={{ position: 'relative', width: 220 }}>
                <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Buscar columna, tipo, PK..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 16,
                    padding: '5px 10px 5px 28px',
                    color: '#fff',
                    fontSize: 11
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* CONTENIDO DE LAS PESTAÑAS */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          {activeTab === 'attributes' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', background: 'rgba(0, 0, 0, 0.25)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Tabla SQL / Entidad</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Columna / Atributo</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Tipo SQL</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Tipo Java</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center' }}>Clave</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Referencia FK</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Nullable</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Mapeo JPA (Spring Boot)</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      No se encontraron campos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <tr
                      key={`${row.entityId}_${row.attributeName}_${idx}`}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: row.isPrimaryKey 
                          ? 'rgba(99, 102, 241, 0.05)' 
                          : row.isForeignKey 
                            ? 'rgba(56, 189, 248, 0.04)' 
                            : 'transparent'
                      }}
                    >
                      {/* Entidad / Tabla */}
                      <td style={{ padding: '8px 12px' }}>
                        <div>
                          <strong style={{ color: '#fff' }}>{row.tableName}</strong>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Clase: {row.entityName}</div>
                        </div>
                      </td>

                      {/* Columna / Atributo */}
                      <td style={{ padding: '8px 12px' }}>
                        <code style={{ fontSize: 12, color: row.isPrimaryKey ? '#fbbf24' : (row.isForeignKey ? '#38bdf8' : '#e2e8f0'), fontWeight: 600 }}>
                          {row.columnName}
                        </code>
                      </td>

                      {/* Tipo SQL */}
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, color: '#38bdf8' }}>
                          {row.sqlType}
                        </span>
                      </td>

                      {/* Tipo Java */}
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: 11, color: '#a78bfa' }}>
                          {row.javaType}
                        </span>
                      </td>

                      {/* Claves PK / FK */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          {row.isPrimaryKey && (
                            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontSize: 10 }}>
                              PK
                            </span>
                          )}
                          {row.isForeignKey && (
                            <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: 10 }}>
                              FK
                            </span>
                          )}
                          {!row.isPrimaryKey && !row.isForeignKey && (
                            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>-</span>
                          )}
                        </div>
                      </td>

                      {/* Referencia FK */}
                      <td style={{ padding: '8px 12px' }}>
                        {row.isForeignKey ? (
                          <span style={{ fontSize: 11, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Link2 size={12} /> {row.referencedTable}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>-</span>
                        )}
                      </td>

                      {/* Nullable */}
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: 11, color: row.isNullable ? '#94a3b8' : '#34d399' }}>
                          {row.isNullable ? 'SÍ (Nullable)' : 'NO (NOT NULL)'}
                        </span>
                      </td>

                      {/* Anotación JPA */}
                      <td style={{ padding: '8px 12px' }}>
                        <code style={{ fontSize: 11, color: '#a5b4fc', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>
                          {row.jpaAnnotation}
                        </code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'relations' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', background: 'rgba(0, 0, 0, 0.25)' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 700 }}>Tabla Origen</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center' }}>Cardinalidad & Verbo</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 700 }}>Tabla Destino</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 700 }}>Clave Foránea Generada (FK)</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 700 }}>Mapeo ORM / JPA Hibernate</th>
                </tr>
              </thead>
              <tbody>
                {relationshipRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      No se han configurado relaciones entre las tablas de este proyecto.
                    </td>
                  </tr>
                ) : (
                  relationshipRows.map(rel => (
                    <tr key={rel.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <strong style={{ color: '#fff' }}>{rel.sourceTable}</strong>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Entidad: {rel.sourceEntity}</div>
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontSize: 11 }}>
                          {rel.cardinality}
                        </span>
                        <div style={{ fontSize: 10, color: '#38bdf8', fontStyle: 'italic', marginTop: 2 }}>
                          "{rel.verb}"
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <strong style={{ color: '#fff' }}>{rel.targetTable}</strong>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Entidad: {rel.targetEntity}</div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: 11 }}>
                          {rel.fkName} [FK]
                        </span>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          Apunta a {rel.sourceTable}.id
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <code style={{ fontSize: 11, color: '#a5b4fc', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 4, display: 'block' }}>
                          {rel.jpaMapping}
                        </code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'tables' && (
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {selectedProj.entities.map(e => {
                const tableName = e.tableName || e.name.toLowerCase() + 's';
                const pkCount = e.attributes.filter(a => a.isPrimaryKey).length;
                const fkCount = e.attributes.filter(a => a.isForeignKey).length;
                return (
                  <div
                    key={e.id}
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      padding: 16
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{e.name}</span>
                      <span style={{ fontSize: 11, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                        tabla: {tableName}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                      Clase Java: <strong style={{ color: '#a78bfa' }}>{e.name}.java</strong> • Atributos: <strong>{e.attributes.length}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      <span className="badge" style={{ background: pkCount > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: pkCount > 0 ? '#34d399' : '#f87171' }}>
                        {pkCount > 0 ? `${pkCount} Clave Primaria (PK)` : 'Sin PK'}
                      </span>
                      {fkCount > 0 && (
                        <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                          {fkCount} Foreign Key (FK)
                        </span>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <div>• Repositorio: <code>{e.name}Repository.java</code></div>
                      <div>• Servicio: <code>{e.name}Service.java</code></div>
                      <div>• Controlador REST: <code>{e.name}Controller.java</code></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
