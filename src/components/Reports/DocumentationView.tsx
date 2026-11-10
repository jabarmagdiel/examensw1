import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  Printer,
  Layers,
  Users,
  GitBranch,
  Bot,
  FolderSync,
  Camera,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import { DiagramModel, SystemUser } from '../../types/case';

interface DocumentationViewProps {
  projects: DiagramModel[];
  users: SystemUser[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onOpenDesignStudio: (id: string) => void;
}

export const DocumentationView: React.FC<DocumentationViewProps> = ({
  projects,
  users,
  activeProjectId,
  onSelectProject,
  onOpenDesignStudio
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId);
  const [activeSection, setActiveSection] = useState<'puds' | 'uml25' | 'dictionary' | 'architecture'>('puds');

  const proj = projects.find(p => p.id === selectedProjectId) || projects[0];
  const assignedUsers = users.filter(u => u.assignedProjects?.includes(proj.id));

  const generateMarkdownDoc = (): string => {
    const classesMd = proj.entities
      .map(
        e =>
          `### Clase \`${e.name}\` (Tabla: \`${e.tableName || e.name.toLowerCase()}\`)\n` +
          `**Atributos (UML 2.5):**\n` +
          e.attributes
            .map(
              a =>
                `- \`- ${a.name} : ${a.type}${a.length ? `(${a.length})` : ''}${a.isNullable ? ' [0..1]' : ''}\`${
                  a.isPrimaryKey ? ' `{id}`' : ''
                }${a.isForeignKey ? ' `{FK}`' : ''}${a.isUnique ? ' `{unique}`' : ''}`
            )
            .join('\n') +
          `\n\n**Operaciones:**\n` +
          (e.methods && e.methods.length > 0
            ? e.methods.map(m => `- \`+ ${m.name}(${(m.parameters || []).join(', ')}) : ${m.returnType}\``).join('\n')
            : `- \`+ registrar() : Boolean\`\n- \`+ actualizar() : void\``)
      )
      .join('\n\n');

    const relsMd = proj.relationships
      .map(r => {
        const s = proj.entities.find(e => e.id === r.sourceEntityId)?.name || r.sourceEntityId;
        const t = proj.entities.find(e => e.id === r.targetEntityId)?.name || r.targetEntityId;
        return `- **${s}** \`--(${r.type || 'association'} | ${r.cardinality} | "${r.name || ''}")-->\` **${t}**`;
      })
      .join('\n');

    return `# Documentación Oficial del Sistema — CASE Enterprise Studio (PUDS & UML 2.5+)

**Proyecto:** ${proj.name}
**Cliente:** ${proj.client || 'Corporativo'}
**Fase PUDS Actual:** ${proj.status || 'Diseño'} (Versión ${proj.version}.0)
**Fecha de Exportación:** ${new Date().toLocaleDateString()}

---

## 1. Metodología PUDS (Proceso Unificado de Desarrollo de Software)
- **Fases:** Inicio (Inception) → Elaboración → Construcción → Transición.
- **Flujos de Trabajo:** Requisitos, Análisis, Diseño (UML 2.5 + Normalización 1FN–BCNF), Implementación (Spring Boot 3 + React + PostgreSQL), Pruebas & Despliegue.
- **Equipo PUDS Asignado:**
${assignedUsers.map(u => `  - **${u.name}** (${u.role}) — ${u.email}`).join('\n') || '  - Equipo multidisciplinario asignado'}

---

## 2. Especificación UML 2.5 Superior
- **Clases con 3 compartimentos:** Estereotipo \`«class / entity»\` + Nombre, Atributos con visibilidad \`-\` / \`+\` / \`#\` y propiedades \`{id}\`, \`{FK}\`, \`{unique}\`, y Operaciones \`+ metodo() : Tipo\`.
- **Relaciones UML 2.5:** Asociación, Agregación (\`◇\`), Composición (\`◆\`), Herencia/Generalización (\`▷\`), Dependencia (\`⇢\`), Realización (\`⇸\`) y Multiplicidades (\`1\`, \`0..*\`, \`*\`).
- **Interoperabilidad:** Exportación e Importación OMG **XMI 2.5.1 (UML 2.5)**, XMI 2.1, XMI 1.1 y Archi XML para Sparx Enterprise Architect.

---

## 3. Diccionario Dinámico de Clases y Relaciones (${proj.entities.length} Clases)
${classesMd}

### Relaciones Modeladas (${proj.relationships.length})
${relsMd || '- Sin relaciones'}

---

## 4. Arquitectura IA Local Colaborativa & Visión por Foto
- **IA Local Colaborativa Simultánea:** Motor Senior Local PUDS Offline + soporte Ollama (\`localhost:11434\`) atendiendo en tiempo real a múltiples roles PUDS con modos Mentor, Copiloto y Solucionador Directo.
- **Foto a Diagrama de Clases:** Captura/subida/pegado de imagen de diagrama UML (tanto en Chat Grupal como en Visión IA), edición mediante IA y exportación directa al lienzo general.
`;
  };

  const handleDownloadMarkdown = () => {
    const content = generateMarkdownDoc();
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Documentacion_PUDS_UML25_${proj.name.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      height: 'calc(100vh - var(--header-height) - 40px)',
      margin: '0 16px 16px 16px',
      overflow: 'hidden'
    }}>
      <div className="glass-panel" style={{
        flex: 1,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              width: 42,
              height: 42,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}>
              <BookOpen size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>
                Documentación Oficial PUDS & UML 2.5+
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Especificación metodológica, estándar OMG UML 2.5, diccionario dinámico de clases y arquitectura IA Local
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedProjectId}
              onChange={e => {
                setSelectedProjectId(e.target.value);
                onSelectProject(e.target.value);
              }}
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '6px 10px',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} style={{ background: '#1e293b' }}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>

            <button
              className="btn-secondary"
              style={{ fontSize: 12, padding: '6px 12px', gap: 6 }}
              onClick={() => onOpenDesignStudio(proj.id)}
            >
              <span>Ver en Lienzo UML 2.5</span>
              <ArrowUpRight size={14} />
            </button>

            <button
              className="btn-secondary"
              style={{ fontSize: 12, padding: '6px 12px', gap: 6 }}
              onClick={() => window.print()}
            >
              <Printer size={14} />
              <span>Imprimir / PDF</span>
            </button>

            <button
              className="btn-primary"
              style={{ fontSize: 12, padding: '6px 14px', gap: 6 }}
              onClick={handleDownloadMarkdown}
            >
              <Download size={14} />
              <span>Exportar Documentación (.md)</span>
            </button>
          </div>
        </div>

        {/* Sub-navegación */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { id: 'puds', label: '1. Metodología PUDS (Fases, Flujos & Roles)', icon: GitBranch },
            { id: 'uml25', label: '2. Estándar UML 2.5 Superior & Architect', icon: Layers },
            { id: 'dictionary', label: `3. Diccionario del Modelo (${proj.entities.length} Clases)`, icon: ShieldCheck },
            { id: 'architecture', label: '4. IA Local Colaborativa & Visión por Foto', icon: Bot }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  background: active ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: active ? '#a5b4fc' : 'var(--text-secondary)',
                  border: active ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeSection === 'puds' && (
            <>
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 10, padding: 16 }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: 15, color: '#fff' }}>
                  Proceso Unificado de Desarrollo de Software (PUDS) — Proyecto: {proj.name}
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  La plataforma estructura todo el ciclo de vida del software bajo PUDS: dirigido por casos de uso, centrado en la arquitectura UML 2.5+ e iterativo e incremental. Fase actual del proyecto: <strong style={{ color: '#34d399' }}>{proj.status || 'Diseño'}</strong> (v{proj.version}.0).
                </p>
              </div>

              {/* 4 Fases PUDS */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', marginBottom: 10 }}>
                  A. Ciclo de Vida PUDS en 4 Fases y Entregables
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {[
                    { phase: '1. Inicio (Inception)', desc: 'Definición de alcance, actores, reglas del negocio y cartera de proyecto con el Analista PUDS.', active: true },
                    { phase: '2. Elaboración', desc: 'Arquitectura base, diagrama de clases UML 2.5+, modelo DER lógico y verificación formal 1FN–BCNF.', active: true },
                    { phase: '3. Construcción', desc: 'Generación de entidades JPA Spring Boot 3, repositorios REST, frontend React y pruebas con PostgreSQL.', active: proj.status === 'Implementación' || proj.status === 'Producción' },
                    { phase: '4. Transición', desc: 'Despliegue continuo en contenedores Docker sobre AWS EC2 con HTTPS/SSL y documentación certificada.', active: proj.status === 'Producción' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${item.active ? 'rgba(16, 185, 129, 0.45)' : 'var(--border-subtle)'}`, borderRadius: 10, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <strong style={{ fontSize: 12.5, color: '#fff' }}>{item.phase}</strong>
                        <CheckCircle2 size={14} color={item.active ? '#34d399' : '#64748b'} />
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5 Flujos de Trabajo + Roles PUDS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 14 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', margin: '0 0 10px 0' }}>
                    B. Flujos de Trabajo (Disciplinas PUDS)
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    <li><strong>Modelado de Negocio y Requisitos:</strong> Captura de entidades del dominio, reglas y Dependencias Funcionales (X → Y).</li>
                    <li><strong>Análisis y Diseño:</strong> Vistas sincronizadas Conceptual → Lógico → Físico → Clases UML 2.5+ y Normalización 1FN–BCNF.</li>
                    <li><strong>Implementación:</strong> Generación automática Spring Boot 3 (Java 17/21), JPA/Hibernate y scripts SQL PostgreSQL.</li>
                    <li><strong>Pruebas y Validación:</strong> Test Client REST interactivo, verificación de PK/FK y auditoría automática por IA Local.</li>
                    <li><strong>Despliegue e Interoperabilidad:</strong> Contenedores Docker en AWS EC2 e intercambio XMI 2.5.1 con Enterprise Architect.</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 14 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', margin: '0 0 10px 0' }}>
                    C. Matriz de Roles PUDS e Integrantes ({assignedUsers.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11.5 }}>
                    <div><strong style={{ color: '#60a5fa' }}>Analista:</strong> Requisitos, reglas de negocio, completitud del dominio y DFs.</div>
                    <div><strong style={{ color: '#c084fc' }}>Diseñador:</strong> Clases UML 2.5, cardinalidades, PK/FK y normalización BCNF.</div>
                    <div><strong style={{ color: '#34d399' }}>Implementador:</strong> Código Spring Boot/JPA, PostgreSQL, índices y APIs REST.</div>
                    <div><strong style={{ color: '#fbbf24' }}>Administrador:</strong> Gobernanza, permisos RBAC, control de calidad y despliegue.</div>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 4, color: '#cbd5e1' }}>
                      <strong>Equipo activo en {proj.name}:</strong>{' '}
                      {assignedUsers.map(u => `${u.name} (${u.role})`).join(', ') || 'Sin usuarios asignados'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'uml25' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: 10, padding: 16 }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: 15, color: '#fff' }}>
                  Cumplimiento OMG UML 2.5+ & Enterprise Architect (XMI 2.5.1)
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  La vista <strong>Clases UML</strong> del Taller de Diseño implementa la notación estándar UML 2.5 para diagramas de clases estructurales e intercambio bidireccional XMI 2.5.1 / 2.1 / 1.1 con Sparx Enterprise Architect.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 14 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', margin: '0 0 8px 0' }}>
                    1. Estructura de Clase UML 2.5 (3 Compartimentos)
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                    <li><strong>Compartimento Superior:</strong> Estereotipo oficial <code>«class / entity»</code> y nombre de la clase.</li>
                    <li><strong>Compartimento de Atributos:</strong> Visibilidad (<code>-</code> privado, <code>+</code> público, <code>#</code> protegido), tipo de dato, multiplicidad <code>[0..1]</code> para opcionales y propiedades <code>{'{id}'}</code>, <code>{'{FK}'}</code>, <code>{'{unique}'}</code>.</li>
                    <li><strong>Compartimento de Operaciones:</strong> Firma completa <code>+ metodo(parametros) : TipoRetorno</code>.</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 14 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', margin: '0 0 8px 0' }}>
                    2. Conectores, Marcadores y Multiplicidades UML 2.5
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                    <li><strong>Asociación (⎯):</strong> Línea sólida con multiplicidades oficiales en extremos (<code>1</code>, <code>0..*</code>, <code>*</code>).</li>
                    <li><strong>Agregación (◇):</strong> Rombo hueco en el borde de la clase todo (<code>aggregation="shared"</code> en XMI 2.5).</li>
                    <li><strong>Composición (◆):</strong> Rombo relleno en el borde de la clase propietaria (<code>aggregation="composite"</code>).</li>
                    <li><strong>Generalización / Herencia (▷):</strong> Triángulo hueco apuntando a la superclase (<code>uml:Generalization</code>).</li>
                    <li><strong>Dependencia (⇢) y Realización (⇸):</strong> Trazos discontinuos según especificación OMG UML 2.5.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'dictionary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {proj.entities.map(ent => (
                  <div key={ent.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 9.5, color: '#a5b4fc' }}>«class / entity»</div>
                        <strong style={{ fontSize: 14, color: '#fff' }}>{ent.name}</strong>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {ent.tableName || ent.name.toLowerCase()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontFamily: 'monospace', fontSize: 11 }}>
                      {ent.attributes.map(a => (
                        <div key={a.id} style={{ color: a.isPrimaryKey ? '#fbbf24' : a.isForeignKey ? '#38bdf8' : '#e2e8f0' }}>
                          - {a.name} : {a.type}{a.length ? `(${a.length})` : ''}{a.isNullable ? ' [0..1]' : ''}
                          {a.isPrimaryKey ? ' {id}' : ''}{a.isForeignKey ? ' {FK}' : ''}{a.isUnique ? ' {unique}' : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'architecture' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              <div style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#34d399', fontWeight: 700, fontSize: 13 }}>
                  <Bot size={16} />
                  <span>IA Local Colaborativa Simultánea</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  La IA opera 100% en modo local (compatible con Ollama local <code>localhost:11434</code> y Motor Local PUDS Offline sin API keys externas). Reconoce simultáneamente qué desarrollador pregunta (Analista, Diseñador, Implementador o Administrador) dentro del Chat Grupal sincronizado por Socket.IO y permite alternar entre Mentor Guía, Copiloto con botón de solución y Solucionador Directo.
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#38bdf8', fontWeight: 700, fontSize: 13 }}>
                  <Camera size={16} />
                  <span>Foto de Diagrama a Lienzo + Edición IA</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  Permite tomar foto, subir o pegar capturas de diagramas de clases (tanto desde Visión IA como directamente dentro del Chat Grupal), digitalizarlas localmente, editar sus clases/atributos conversando con la IA y exportarlas al lienzo general colaborativo.
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#c084fc', fontWeight: 700, fontSize: 13 }}>
                  <FolderSync size={16} />
                  <span>Importación y Exportación Architect XMI 2.5</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  Intercambio completo bidireccional en estándares <strong>UML 2.5 (XMI 2.5.1)</strong>, XMI 2.1, XMI 1.1 y Archi Open Exchange para abrir o continuar los modelos en Sparx Enterprise Architect preservando clases, atributos, métodos, relaciones y coordenadas.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
