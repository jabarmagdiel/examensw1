import {
  Attribute,
  DiagramModel,
  Entity,
  GroupChatMessage,
  Relationship,
  SeniorAIConfig,
  SystemRole,
  UserPresence
} from '../types/case';
import { executeVoiceCommand } from './aiAssistant';

const SENIOR_CONFIG_KEY = 'case_ai_senior_config_v1';
const GROUP_CHAT_STORAGE_KEY = 'case_ai_group_chat_v1';

export const DEFAULT_SENIOR_AI_CONFIG: SeniorAIConfig = {
  mode: 'hybrid',
  provider: 'google_gemini',
  autoIntervene: true,
  googleApiKey: '',
  googleModel: 'gemini-2.5-flash',
  localEndpoint: 'http://localhost:11434/api/chat',
  localModel: 'llama3.2',
  temperature: 0.4
};

export function loadSeniorAIConfig(): SeniorAIConfig {
  try {
    const raw = localStorage.getItem(SENIOR_CONFIG_KEY);
    if (!raw) return DEFAULT_SENIOR_AI_CONFIG;
    return { ...DEFAULT_SENIOR_AI_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SENIOR_AI_CONFIG;
  }
}

export function saveSeniorAIConfig(config: SeniorAIConfig): void {
  try {
    localStorage.setItem(SENIOR_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error guardando configuración de Senior AI:', e);
  }
}

export function loadGroupChatMessages(projectId: string): GroupChatMessage[] {
  try {
    const raw = localStorage.getItem(`${GROUP_CHAT_STORAGE_KEY}_${projectId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return getInitialTeamChat(projectId);
}

export function saveGroupChatMessages(projectId: string, messages: GroupChatMessage[]): void {
  try {
    localStorage.setItem(`${GROUP_CHAT_STORAGE_KEY}_${projectId}`, JSON.stringify(messages.slice(-100)));
  } catch {}
}

export function getInitialTeamChat(projectId: string): GroupChatMessage[] {
  const now = Date.now();
  return [
    {
      id: `init_sys_${projectId}`,
      projectId,
      senderType: 'senior_ai',
      senderId: 'senior_ai_mentor',
      senderName: 'Arq. IA Senior (Mentor PUDS)',
      senderRole: 'Senior AI Mentor',
      senderColor: '#10b981',
      text: `¡Equipo bienvenido a la sala de ingeniería colaborativa! Estoy conectado como **Desarrollador Senior y Mentor** con contexto completo del diagrama en tiempo real.\n\n• Sé exactamente **quién escribe** y cuál es su **rol PUDS** (*Analista, Diseñador, Implementador o Administrador*).\n• Analizo en vivo todas las entidades, claves primarias/foráneas, relaciones, dependencias funcionales y selección en el lienzo.\n• Pueden configurar mi nivel de intervención arriba (**Modo Mentor Guía**, **Modo Copiloto Revisor** o **Modo Solucionador Directo**) y el motor (**Google Gemini**, **Modelo Local Ollama** o **Motor Senior Integrado**).`,
      timestamp: now - 120000,
      aiMetadata: {
        mode: 'hybrid',
        providerUsed: 'Senior Context Engine + Google Gemini Ready',
        contextSummary: 'Sincronizado con el lienzo colaborativo y presencia de equipo',
        addressedTo: 'Equipo Completo',
        addressedRole: 'Analista'
      }
    }
  ];
}

export interface ArchitecturalAuditFinding {
  category: 'normalizacion' | 'relaciones' | 'integridad_pk_fk' | 'implementacion' | 'dominio';
  severity: 'alta' | 'media' | 'sugerencia';
  title: string;
  detail: string;
  proposedEntities?: Entity[];
  proposedRelationships?: Relationship[];
  proposalSummary?: string;
}

/**
 * Analiza en profundidad el modelo actual para darle a la IA conciencia real de todo el diagrama
 */
export function analyzeDiagramContext(model: DiagramModel): {
  entitiesWithoutPK: Entity[];
  nmRelationships: { rel: Relationship; source?: Entity; target?: Entity }[];
  isolatedEntities: Entity[];
  missingFKEntities: { rel: Relationship; source: Entity; target: Entity; suggestedFK: string }[];
  findings: ArchitecturalAuditFinding[];
  contextBrief: string;
} {
  const entitiesWithoutPK = model.entities.filter(e => !e.attributes.some(a => a.isPrimaryKey));

  const nmRelationships = model.relationships
    .filter(r => r.cardinality === 'N:M')
    .map(rel => ({
      rel,
      source: model.entities.find(e => e.id === rel.sourceEntityId),
      target: model.entities.find(e => e.id === rel.targetEntityId)
    }));

  const connectedIds = new Set<string>();
  model.relationships.forEach(r => {
    connectedIds.add(r.sourceEntityId);
    connectedIds.add(r.targetEntityId);
  });
  const isolatedEntities = model.entities.filter(e => !connectedIds.has(e.id));

  const missingFKEntities: { rel: Relationship; source: Entity; target: Entity; suggestedFK: string }[] = [];
  model.relationships.forEach(rel => {
    if (rel.cardinality === '1:N' || rel.cardinality === '1:1') {
      const source = model.entities.find(e => e.id === rel.sourceEntityId);
      const target = model.entities.find(e => e.id === rel.targetEntityId);
      if (source && target) {
        const expectedFkName = rel.foreignKeyAttributeName || `${source.name.toLowerCase()}_id`;
        const hasFk = target.attributes.some(
          a => a.isForeignKey || a.name.toLowerCase() === expectedFkName.toLowerCase() || a.name.toLowerCase().endsWith('_id')
        );
        if (!hasFk) {
          missingFKEntities.push({ rel, source, target, suggestedFK: expectedFkName });
        }
      }
    }
  });

  const findings: ArchitecturalAuditFinding[] = [];

  // 1. Hallazgo por relaciones N:M sin tabla intermedia física
  if (nmRelationships.length > 0) {
    nmRelationships.forEach(({ rel, source, target }) => {
      if (source && target) {
        const assocName = `Detalle${source.name}${target.name}`;
        const newAssocId = `ent_assoc_${source.id}_${target.id}`;
        const assocEntity: Entity = {
          id: newAssocId,
          name: assocName,
          tableName: `detalle_${source.name.toLowerCase()}_${target.name.toLowerCase()}`,
          x: Math.round((source.x + target.x) / 2),
          y: Math.round((source.y + target.y) / 2) + 160,
          color: '#ec4899',
          attributes: [
            { id: `at_${Date.now()}_1`, name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
            { id: `at_${Date.now()}_2`, name: `${source.name.toLowerCase()}_id`, type: 'BIGINT', isPrimaryKey: false, isForeignKey: true, isNullable: false },
            { id: `at_${Date.now()}_3`, name: `${target.name.toLowerCase()}_id`, type: 'BIGINT', isPrimaryKey: false, isForeignKey: true, isNullable: false },
            { id: `at_${Date.now()}_4`, name: 'cantidad', type: 'INTEGER', isPrimaryKey: false, isNullable: false },
            { id: `at_${Date.now()}_5`, name: 'subtotal', type: 'DECIMAL', isPrimaryKey: false, isNullable: false }
          ]
        };

        const updatedEntities = [...model.entities, assocEntity];
        const updatedRelationships = model.relationships
          .filter(r => r.id !== rel.id)
          .concat([
            {
              id: `rel_${source.id}_assoc_${Date.now()}`,
              name: 'contiene',
              sourceEntityId: source.id,
              targetEntityId: newAssocId,
              cardinality: '1:N',
              foreignKeyAttributeName: `${source.name.toLowerCase()}_id`
            },
            {
              id: `rel_${target.id}_assoc_${Date.now() + 1}`,
              name: 'referencia',
              sourceEntityId: target.id,
              targetEntityId: newAssocId,
              cardinality: '1:N',
              foreignKeyAttributeName: `${target.name.toLowerCase()}_id`
            }
          ]);

        findings.push({
          category: 'relaciones',
          severity: 'alta',
          title: `Relación N:M directa entre ${source.name} y ${target.name}`,
          detail: `Existe una relación muchos-a-muchos (${rel.name}) entre **${source.name}** y **${target.name}**. En el modelo físico relacional y en JPA con atributos adicionales, conviene descomponerla en una entidad asociativa **${assocName}** con dos relaciones \`1:N\`.`,
          proposedEntities: updatedEntities,
          proposedRelationships: updatedRelationships,
          proposalSummary: `Descomposición de relación N:M (${source.name} ↔ ${target.name}) creando la tabla asociativa ${assocName} con llaves foráneas.`
        });
      }
    });
  }

  // 2. Hallazgo por FKs faltantes en relaciones 1:N
  if (missingFKEntities.length > 0) {
    const first = missingFKEntities[0];
    const updatedEntities = model.entities.map(ent => {
      const missingForTarget = missingFKEntities.filter(m => m.target.id === ent.id);
      if (missingForTarget.length === 0) return ent;
      const newAttrs: Attribute[] = [...ent.attributes];
      missingForTarget.forEach(m => {
        if (!newAttrs.some(a => a.name.toLowerCase() === m.suggestedFK.toLowerCase())) {
          newAttrs.push({
            id: `fk_auto_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            name: m.suggestedFK,
            type: 'BIGINT',
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false
          });
        }
      });
      return { ...ent, attributes: newAttrs };
    });

    findings.push({
      category: 'integridad_pk_fk',
      severity: 'media',
      title: `Atributos Foreign Key explícitos faltantes (${missingFKEntities.length})`,
      detail: `La relación \`${first.source.name} (${first.rel.cardinality}) → ${first.target.name}\` está trazada visualmente, pero la tabla destino **${first.target.name}** no tiene declarada explícitamente la columna \`${first.suggestedFK}\` marcada como \`[FK]\`.`,
      proposedEntities: updatedEntities,
      proposedRelationships: model.relationships,
      proposalSummary: `Inyección automática de ${missingFKEntities.length} columna(s) Foreign Key explícita(s) en las entidades destino.`
    });
  }

  // 3. Hallazgo por entidades sin PK
  if (entitiesWithoutPK.length > 0) {
    const updatedEntities = model.entities.map(ent => {
      if (ent.attributes.some(a => a.isPrimaryKey)) return ent;
      return {
        ...ent,
        attributes: [
          { id: `pk_${Date.now()}_${ent.id}`, name: 'id', type: 'BIGINT' as const, isPrimaryKey: true, isNullable: false },
          ...ent.attributes
        ]
      };
    });

    findings.push({
      category: 'integridad_pk_fk',
      severity: 'alta',
      title: `Entidades sin Clave Primaria (${entitiesWithoutPK.map(e => e.name).join(', ')})`,
      detail: `Las entidades **${entitiesWithoutPK.map(e => e.name).join(', ')}** carecen de \`PK\`, lo cual viola 1FN e impedirá que Hibernate/JPA genere los repositorios \`JpaRepository\`.`,
      proposedEntities: updatedEntities,
      proposedRelationships: model.relationships,
      proposalSummary: `Adición de clave primaria BIGINT 'id' a ${entitiesWithoutPK.map(e => e.name).join(', ')}.`
    });
  }

  // 4. Hallazgo de enriquecimiento de dominio según el proyecto
  const entityNamesLower = model.entities.map(e => e.name.toLowerCase());
  if (model.name.toLowerCase().includes('veterinaria') && !entityNamesLower.some(n => n.includes('factura') || n.includes('pago') || n.includes('vacuna'))) {
    const citaEnt = model.entities.find(e => e.name.toLowerCase().includes('cita')) || model.entities[0];
    const facturaId = `ent_factura_${Date.now()}`;
    const newEntity: Entity = {
      id: facturaId,
      name: 'FacturaServicio',
      tableName: 'facturas_servicio',
      x: 780,
      y: 380,
      color: '#06b6d4',
      attributes: [
        { id: `fac_1_${Date.now()}`, name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
        { id: `fac_2_${Date.now()}`, name: 'numeroComprobante', type: 'VARCHAR', length: 40, isPrimaryKey: false, isNullable: false, isUnique: true },
        { id: `fac_3_${Date.now()}`, name: 'fechaEmision', type: 'TIMESTAMP', isPrimaryKey: false, isNullable: false },
        { id: `fac_4_${Date.now()}`, name: 'montoTotal', type: 'DECIMAL', isPrimaryKey: false, isNullable: false },
        { id: `fac_5_${Date.now()}`, name: 'metodoPago', type: 'VARCHAR', length: 30, isPrimaryKey: false, isNullable: false },
        ...(citaEnt ? [{ id: `fac_6_${Date.now()}`, name: `${citaEnt.name.toLowerCase()}_id`, type: 'BIGINT' as const, isPrimaryKey: false, isForeignKey: true, isNullable: false }] : [])
      ]
    };
    const newRels: Relationship[] = citaEnt
      ? [
          ...model.relationships,
          {
            id: `rel_cita_fac_${Date.now()}`,
            name: 'genera_cobro',
            sourceEntityId: citaEnt.id,
            targetEntityId: facturaId,
            cardinality: '1:1',
            foreignKeyAttributeName: `${citaEnt.name.toLowerCase()}_id`
          }
        ]
      : model.relationships;

    findings.push({
      category: 'dominio',
      severity: 'sugerencia',
      title: `Módulo de Facturación / Cobro para ${model.name}`,
      detail: `El modelo cubre la atención clínica (${model.entities.map(e => e.name).join(', ')}), pero aún no modela la transacción financiera posterior a la consulta (**FacturaServicio** vinculada a **${citaEnt?.name || 'CitaMedica'}**).`,
      proposedEntities: [...model.entities, newEntity],
      proposedRelationships: newRels,
      proposalSummary: `Incorporación de la entidad FacturaServicio conectada 1:1 con ${citaEnt?.name || 'CitaMedica'}.`
    });
  }

  const contextBrief = `Proyecto "${model.name}" (${model.status || 'Diseño'}) con ${model.entities.length} entidades [${model.entities.map(e => e.name).join(', ')}], ${model.relationships.length} relaciones y ${model.functionalDependencies?.length || 0} DFs.`;

  return {
    entitiesWithoutPK,
    nmRelationships,
    isolatedEntities,
    missingFKEntities,
    findings,
    contextBrief
  };
}

/**
 * Construye el System Prompt completo para Google Gemini o Modelo Local (Ollama / LM Studio)
 */
export function buildSeniorSystemPrompt(params: {
  model: DiagramModel;
  askingUser: UserPresence;
  collaborators: UserPresence[];
  selectedEntity?: Entity | null;
  config: SeniorAIConfig;
  recentMessages: GroupChatMessage[];
}): string {
  const { model, askingUser, collaborators, selectedEntity, config, recentMessages } = params;
  const audit = analyzeDiagramContext(model);

  const entitiesDesc = model.entities
    .map(
      e =>
        `- ${e.name} (tabla: ${e.tableName || e.name.toLowerCase()}): [${e.attributes
          .map(a => `${a.name}:${a.type}${a.isPrimaryKey ? '(PK)' : ''}${a.isForeignKey ? '(FK)' : ''}`)
          .join(', ')}]`
    )
    .join('\n');

  const relsDesc = model.relationships
    .map(r => {
      const s = model.entities.find(e => e.id === r.sourceEntityId)?.name || r.sourceEntityId;
      const t = model.entities.find(e => e.id === r.targetEntityId)?.name || r.targetEntityId;
      return `- ${s} --(${r.cardinality} "${r.name}")--> ${t}`;
    })
    .join('\n');

  const roleInstruction = {
    Analista: `El usuario que pregunta (${askingUser.name}) tiene el rol de ANALISTA PUDS. Dirígete a ${askingUser.name} por su nombre y adapta tu explicación a su especialidad: reglas del negocio, semántica del dominio, casos de uso, completitud de entidades y dependencias funcionales (X -> Y).`,
    Diseñador: `El usuario que pregunta (${askingUser.name}) tiene el rol de DISEÑADOR PUDS. Dirígete a ${askingUser.name} por su nombre y adapta tu explicación a su especialidad: diseño lógico/físico relacional, cardinalidades (1:1, 1:N, N:M), tablas asociativas, claves primarias/foráneas, clases UML y normalización (1FN, 2FN, 3FN, BCNF).`,
    Implementador: `El usuario que pregunta (${askingUser.name}) tiene el rol de IMPLEMENTADOR (Desarrollador Backend) PUDS. Dirígete a ${askingUser.name} por su nombre y adapta tu explicación a su especialidad: implementación física en PostgreSQL, tipos de datos SQL, índices, entidades JPA en Spring Boot 3 (@Entity, @ManyToOne, @JoinColumn), repositorios y endpoints REST.`,
    Administrador: `El usuario que pregunta (${askingUser.name}) tiene el rol de ADMINISTRADOR PUDS. Dirígete a ${askingUser.name} por su nombre y adapta tu explicación a su especialidad: gobernanza del proyecto, auditoría de calidad, coordinación de los roles del equipo y preparación para despliegue en producción.`
  }[askingUser.role];

  const modeInstruction = {
    mentor: `MODO CONFIGURADO: MENTOR SOCRÁTICO (Guía Senior). NO entregues todo resuelto de golpe; explica el criterio de ingeniería, señala qué debe observar en el diagrama actual y guíalo paso a paso como un Tech Lead / Senior Mentor.`,
    hybrid: `MODO CONFIGURADO: COPILOTO SENIOR (Mentoría + Propuesta de Solución). Explica con criterio de Desarrollador Senior por qué recomiendas el cambio y ofrece la solución técnica estructurada para que el equipo decida aplicarla.`,
    solver: `MODO CONFIGURADO: SOLUCIONADOR DIRECTO (Co-Autor Senior). Además de dar tu justificación breve como Senior, entrega la solución técnica completa y lista para aplicarse directamente en el diagrama.`
  }[config.mode];

  return `Eres el Desarrollador Senior y Mentor de Arquitectura (Arq. IA Senior) integrado en la plataforma CASE Enterprise Studio bajo metodología PUDS.
Estás participando en un CHAT GRUPAL en tiempo real junto con todo el equipo de desarrollo que construye el diagrama.

REGLA CRÍTICA DE PERSONALIZACIÓN (NO RESPONDER GENÉRICAMENTE):
- Quien te está hablando en este mensaje es: **${askingUser.name}** (Rol PUDS: **${askingUser.role}**).
- ${roleInstruction}
- NUNCA respondas de forma genérica; menciona siempre a ${askingUser.name}, su rol (${askingUser.role}) y las tablas/atributos reales del proyecto "${model.name}".

${modeInstruction}

CONTEXTO COMPLETO EN TIEMPO REAL DEL PROYECTO:
- Proyecto Activo: "${model.name}" | Cliente: "${model.client || 'N/A'}" | Fase: "${model.status || 'Diseño'}"
- Miembros del equipo en la sala: ${collaborators.map(c => `${c.name} (${c.role})`).join(', ')}
- Entidad seleccionada actualmente en el canvas por ${askingUser.name}: ${selectedEntity ? `${selectedEntity.name} (${selectedEntity.attributes.map(a => a.name).join(', ')})` : 'Ninguna seleccionada en este instante'}

ENTIDADES DEL DIAGRAMA (${model.entities.length}):
${entitiesDesc || 'Sin entidades aún'}

RELACIONES DEL DIAGRAMA (${model.relationships.length}):
${relsDesc || 'Sin relaciones aún'}

HALLAZGOS DE AUDITORÍA DETECTADOS EN EL DIAGRAMA:
${audit.findings.map(f => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.detail}`).join('\n') || '- Esquema consistente'}

HISTORIAL RECIENTE DEL CHAT GRUPAL:
${recentMessages
  .slice(-6)
  .map(m => `[${m.senderName} - ${m.senderRole}]: ${m.text}`)
  .join('\n')}

Responde en español, con formato claro y conciso digno de un Desarrollador Senior de equipo.`;
}

/**
 * Llama a Google Gemini API si el usuario configuró su API Key
 */
async function callGoogleGeminiAPI(
  prompt: string,
  systemInstruction: string,
  config: SeniorAIConfig
): Promise<string | null> {
  const apiKey = config.googleApiKey?.trim() || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (!apiKey) return null;

  const modelName = config.googleModel || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: config.temperature ?? 0.4,
        maxOutputTokens: 900
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || null;
}

/**
 * Llama a un modelo local (Ollama en :11434 o LM Studio compatible OpenAI en :1234)
 */
async function callLocalLLMAPI(
  prompt: string,
  systemInstruction: string,
  config: SeniorAIConfig
): Promise<string | null> {
  const endpoint = config.localEndpoint?.trim() || 'http://localhost:11434/api/chat';
  const modelName = config.localModel?.trim() || 'llama3.2';

  // Soporte tanto para endpoint OpenAI (/v1/chat/completions) como Ollama nativo (/api/chat)
  const isOpenAICompat = endpoint.includes('/v1/');

  const body = isOpenAICompat
    ? {
        model: modelName,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature ?? 0.4
      }
    : {
        model: modelName,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        stream: false
      };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Local LLM HTTP ${response.status}`);
  }

  const data = await response.json();
  if (isOpenAICompat) {
    return data?.choices?.[0]?.message?.content || null;
  }
  return data?.message?.content || data?.response || null;
}

/**
 * Genera una respuesta del Senior AI Mentor adaptada a QUIÉN pregunta, su ROL PUDS,
 * el CONTEXTO completo del diagrama y el MODO configurado (mentor / hybrid / solver).
 */
export async function generateSeniorMentorReply(params: {
  prompt: string;
  model: DiagramModel;
  askingUser: UserPresence;
  collaborators: UserPresence[];
  selectedEntityId?: string | null;
  config: SeniorAIConfig;
  recentMessages: GroupChatMessage[];
}): Promise<{
  text: string;
  providerUsed: string;
  proposedChange?: {
    entities: Entity[];
    relationships: Relationship[];
    summary: string;
  };
  codeSnippet?: {
    language: string;
    title: string;
    code: string;
  };
  autoApply: boolean;
}> {
  const { prompt, model, askingUser, collaborators, selectedEntityId, config, recentMessages } = params;
  const selectedEntity = model.entities.find(e => e.id === selectedEntityId) || null;
  const audit = analyzeDiagramContext(model);
  const lower = prompt.toLowerCase();

  // 1. Verificar si la instrucción del usuario pide una modificación directa al diagrama (ej. "crear tabla...", "agregar atributo...", "relacionar...")
  const directCommandResult = executeVoiceCommand(prompt, model);
  let proposedChange: { entities: Entity[]; relationships: Relationship[]; summary: string } | undefined;

  if (directCommandResult.actionType !== 'UNKNOWN') {
    proposedChange = {
      entities: directCommandResult.model.entities,
      relationships: directCommandResult.model.relationships,
      summary: directCommandResult.summary
    };
  } else if (
    lower.includes('solucion') ||
    lower.includes('arregla') ||
    lower.includes('corrige') ||
    lower.includes('optimiza') ||
    lower.includes('normaliza') ||
    lower.includes('mejora') ||
    lower.includes('n:m') ||
    lower.includes('muchos a muchos') ||
    lower.includes('foranea') ||
    lower.includes('fk') ||
    lower.includes('audita') ||
    lower.includes('revisa')
  ) {
    if (audit.findings.length > 0) {
      const topFinding = audit.findings[0];
      if (topFinding.proposedEntities && topFinding.proposedRelationships) {
        proposedChange = {
          entities: topFinding.proposedEntities,
          relationships: topFinding.proposedRelationships,
          summary: topFinding.proposalSummary || topFinding.title
        };
      }
    }
  }

  // 2. Generar snippet de código contextual si pregunta un Implementador o si piden código/SQL/Spring
  const targetEntityForCode = selectedEntity || model.entities[0];
  let codeSnippet: { language: string; title: string; code: string } | undefined;

  if (
    targetEntityForCode &&
    (askingUser.role === 'Implementador' ||
      lower.includes('codigo') ||
      lower.includes('spring') ||
      lower.includes('jpa') ||
      lower.includes('sql') ||
      lower.includes('endpoint') ||
      lower.includes('entidad'))
  ) {
    const incomingRels = model.relationships.filter(r => r.targetEntityId === targetEntityForCode.id);
    const jpaFields = targetEntityForCode.attributes
      .map(a => {
        if (a.isPrimaryKey) {
          return `    @Id\n    @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long ${a.name};`;
        }
        if (a.isForeignKey) {
          const refEntityName = a.name.replace(/_id$/i, '');
          const capRef = refEntityName.charAt(0).toUpperCase() + refEntityName.slice(1);
          return `    @ManyToOne(fetch = FetchType.LAZY)\n    @JoinColumn(name = "${a.name}", nullable = ${a.isNullable})\n    private ${capRef} ${refEntityName};`;
        }
        const javaType =
          a.type === 'BIGINT'
            ? 'Long'
            : a.type === 'INTEGER'
            ? 'Integer'
            : a.type === 'DECIMAL' || a.type === 'FLOAT'
            ? 'BigDecimal'
            : a.type === 'DATE'
            ? 'LocalDate'
            : a.type === 'TIMESTAMP'
            ? 'LocalDateTime'
            : a.type === 'BOOLEAN'
            ? 'Boolean'
            : 'String';
        return `    @Column(name = "${a.name}", nullable = ${a.isNullable})\n    private ${javaType} ${a.name};`;
      })
      .join('\n\n');

    codeSnippet = {
      language: 'java',
      title: `${targetEntityForCode.name}.java (Spring Boot 3 JPA • Contextualizado para ${askingUser.name})`,
      code: `@Entity\n@Table(name = "${targetEntityForCode.tableName || targetEntityForCode.name.toLowerCase()}")\npublic class ${targetEntityForCode.name} {\n\n${jpaFields}\n    // Relaciones detectadas en lienzo: ${incomingRels.length}\n}`
    };
  }

  // 3. Intentar proveedor externo configurado (Google Gemini o Modelo Local Ollama/LM Studio)
  const systemPrompt = buildSeniorSystemPrompt({
    model,
    askingUser,
    collaborators,
    selectedEntity,
    config,
    recentMessages
  });

  if (config.provider === 'google_gemini' && (config.googleApiKey?.trim() || (import.meta as any).env?.VITE_GEMINI_API_KEY)) {
    try {
      const geminiReply = await callGoogleGeminiAPI(prompt, systemPrompt, config);
      if (geminiReply) {
        return {
          text: geminiReply,
          providerUsed: `Google Gemini (${config.googleModel})`,
          proposedChange: config.mode === 'mentor' ? undefined : proposedChange,
          codeSnippet,
          autoApply: config.mode === 'solver' && Boolean(proposedChange)
        };
      }
    } catch (err) {
      console.warn('Fallback a Motor Senior Integrado tras error en Gemini API:', err);
    }
  }

  if (config.provider === 'local_llm') {
    try {
      const localReply = await callLocalLLMAPI(prompt, systemPrompt, config);
      if (localReply) {
        return {
          text: localReply,
          providerUsed: `Modelo Local (${config.localModel})`,
          proposedChange: config.mode === 'mentor' ? undefined : proposedChange,
          codeSnippet,
          autoApply: config.mode === 'solver' && Boolean(proposedChange)
        };
      }
    } catch (err) {
      console.warn('Fallback a Motor Senior Integrado tras no detectar servidor local activo:', err);
    }
  }

  // 4. Respuesta del Motor Senior Contextual Integrado (Personalizada por Usuario, Rol PUDS, Pregunta, Selección y Modo)
  const entityListStr = model.entities.map(e => `**${e.name}** (${e.attributes.length} atrib.)`).join(', ');
  const selectedContextLine = selectedEntity
    ? `Veo que tienes seleccionada la entidad **${selectedEntity.name}** (\`${selectedEntity.attributes.map(a => a.name).join(', ')}\`) en tu lienzo.`
    : `Contexto actual: **${model.name}** (${model.entities.length} entidades: ${entityListStr}).`;

  // Encabezado personalizado según quién pregunta y su rol PUDS
  const roleGreetingMap: Record<SystemRole, string> = {
    Analista: `👋 Hola **${askingUser.name}** (**Analista PUDS**) — Te respondo desde la perspectiva de **Requisitos, Reglas de Negocio y Semántica del Dominio**:`,
    Diseñador: `👋 Hola **${askingUser.name}** (**Diseñador PUDS**) — Te respondo enfocándome en **Estructura Relacional, Cardinalidades y Normalización (1FN-BCNF)**:`,
    Implementador: `👋 Hola **${askingUser.name}** (**Implementador PUDS**) — Te respondo enfocándome en **Persistencia SQL, Rendimiento y Spring Boot 3 / JPA**:`,
    Administrador: `👋 Hola **${askingUser.name}** (**Administrador PUDS**) — Te respondo desde la visión de **Gobernanza de Arquitectura, Calidad y Control del Equipo**:`
  };

  const roleHeader = roleGreetingMap[askingUser.role] || `👋 Hola **${askingUser.name}** (**${askingUser.role}**):`;
  const engineLabel =
    config.provider === 'google_gemini'
      ? 'Motor Senior PUDS (Configura tu API Key Gemini en ⚙️ para LLM en la nube)'
      : config.provider === 'local_llm'
      ? `Motor Senior PUDS (Servidor local ${config.localModel} no detectado)`
      : 'Motor Senior Contextual PUDS';

  // Si fue un comando directo sobre el diagrama
  if (directCommandResult.actionType !== 'UNKNOWN' && proposedChange) {
    if (config.mode === 'mentor') {
      return {
        text: `${roleHeader}\n\n${selectedContextLine}\n\n💡 **Guía de Mentor Senior sobre tu solicitud ("${prompt}"):**\nComo **${askingUser.role}**, antes de mutar el esquema directamente conviene validar cómo impacta este cambio al resto del equipo (${collaborators.map(c => c.name).join(', ')}).\n\n• **Cambio analizado:** ${directCommandResult.summary}\n• **Recomendación para tu rol (${askingUser.role}):** ${
          askingUser.role === 'Analista'
            ? 'Verifica qué dependencia funcional (X -> Y) justifica este elemento dentro de las reglas del cliente ' + (model.client || '') + '.'
            : askingUser.role === 'Diseñador'
            ? 'Asegúrate de definir la cardinalidad exacta y si requiere clave foránea NOT NULL para mantener BCNF.'
            : 'Revisa que el tipo de dato mapee limpiamente a una propiedad `@Column` en tu entidad JPA sin romper migraciones.'
        }\n\n*Estás en **Modo Mentor Guía**; si deseas aplicar la solución, cambia a **Modo Copiloto** o **Solucionador Directo**.*`,
        providerUsed: engineLabel,
        proposedChange: undefined,
        codeSnippet,
        autoApply: false
      };
    }

    if (config.mode === 'solver') {
      return {
        text: `${roleHeader}\n\n${selectedContextLine}\n\n⚡ **Solución Aplicada en Vivo por el Senior AI:**\n• ${directCommandResult.summary}\n• **Validación para ${askingUser.name} (${askingUser.role}):** He sincronizado el cambio en el diagrama compartido de **${model.name}** para que todo el equipo lo vea al instante.`,
        providerUsed: engineLabel,
        proposedChange,
        codeSnippet,
        autoApply: true
      };
    }

    return {
      text: `${roleHeader}\n\n${selectedContextLine}\n\n🛠️ **Propuesta Técnica del Senior para ${askingUser.name}:**\nHe preparado el cambio solicitado sobre **${model.name}**:\n• ${directCommandResult.summary}\n\nHaz clic en **"Aplicar Solución del Senior"** abajo para confirmar e inyectarlo en el lienzo colaborativo.`,
      providerUsed: engineLabel,
      proposedChange,
      codeSnippet,
      autoApply: false
    };
  }

  // 4.1 Detección inteligente del tema preguntado por el usuario para responder DIRECTAMENTE su duda
  const sampleEnt = selectedEntity || model.entities[0];
  const samplePK = sampleEnt?.attributes.find(a => a.isPrimaryKey)?.name || 'id';
  const sampleRel = model.relationships[0];
  const sampleRelSource = sampleRel ? model.entities.find(e => e.id === sampleRel.sourceEntityId)?.name : undefined;
  const sampleRelTarget = sampleRel ? model.entities.find(e => e.id === sampleRel.targetEntityId)?.name : undefined;
  const normalizedPrompt = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let directTopicAnswer = '';

  if (
    normalizedPrompt.includes('llave primaria') ||
    normalizedPrompt.includes('clave primaria') ||
    /\bpk\b/.test(normalizedPrompt) ||
    normalizedPrompt.includes('primary key')
  ) {
    const roleAngle: Record<SystemRole, string> = {
      Analista: `Para tu rol de **Analista**, representa el **identificador único de negocio** que garantiza que no existan dos registros duplicados de una misma entidad (por ejemplo, que dos \`${sampleEnt?.name || 'Cliente'}\` no compartan el mismo \`${samplePK}\`, o un identificador natural como \`dni\` o \`email\`).`,
      Diseñador: `Para tu rol de **Diseñador**, la PK es el determinante principal (PK → todos los demás atributos) sobre el cual se valida la **2FN, 3FN y BCNF**, y sirve como punto de anclaje para que otras tablas la referencien mediante una **Clave Foránea (FK)**.`,
      Implementador: `Para tu rol de **Implementador**, en PostgreSQL se traduce en una restricción \`PRIMARY KEY\` con índice B-Tree automático y en Spring Boot JPA se anota con \`@Id\` y \`@GeneratedValue(strategy = GenerationType.IDENTITY)\` sobre \`${sampleEnt?.name || 'Entidad'}.${samplePK}\`.`,
      Administrador: `Para tu rol de **Administrador**, asegurar que el 100% de las tablas tengan PK definida (${model.entities.length - audit.entitiesWithoutPK.length}/${model.entities.length} tablas actuales cumplen) garantiza trazabilidad, auditoría y cero inconsistencias al desplegar.`
    };
    directTopicAnswer =
      `🔑 **¿Qué es una Llave Primaria (Primary Key / PK)?**\n` +
      `Es el atributo (o conjunto mínimo de atributos) que **identifica de forma única e irrepetible** cada fila de una tabla. Debe cumplir dos reglas estrictas: ser **única** (no se repite) y **no nula** (\`NOT NULL\`).\n\n` +
      `• **Ejemplo en tu diagrama actual (\`${model.name}\`):** En la entidad **${sampleEnt?.name || 'Principal'}**, el atributo \`${samplePK}\` actúa como llave primaria (\`[PK]\`).\n` +
      `• **Enfoque para ${askingUser.name} (${askingUser.role}):** ${roleAngle[askingUser.role]}`;
  } else if (
    normalizedPrompt.includes('llave foranea') ||
    normalizedPrompt.includes('clave foranea') ||
    normalizedPrompt.includes('clave externa') ||
    /\bfk\b/.test(normalizedPrompt) ||
    normalizedPrompt.includes('foreign key')
  ) {
    const roleAngle: Record<SystemRole, string> = {
      Analista: `Para tu rol de **Analista**, expresa la **dependencia entre reglas de negocio**: por ejemplo, no puede existir un registro hijo sin pertenecer a un registro padre válido.`,
      Diseñador: `Para tu rol de **Diseñador**, materializa las relaciones \`1:N\` y \`1:1\` en el modelo lógico/físico, ubicándose siempre en la tabla del lado **"Muchos" (N)** para mantener la integridad referencial.`,
      Implementador: `Para tu rol de **Implementador**, en JPA se mapea con \`@ManyToOne\` + \`@JoinColumn(name = "...")\` y conviene crear un índice SQL sobre ella para acelerar los \`JOIN\`.`,
      Administrador: `Para tu rol de **Administrador**, evita registros huérfanos en base de datos asegurando integridad referencial (\`ON DELETE\` / \`ON UPDATE\`).`
    };
    directTopicAnswer =
      `🔗 **¿Qué es una Llave Foránea (Foreign Key / FK)?**\n` +
      `Es un atributo en una tabla hija que **apunta a la Llave Primaria (PK)** de otra tabla padre para conectarlas y garantizar **integridad referencial**.\n\n` +
      `• **Ejemplo en tu diagrama (\`${model.name}\`):** ${
        sampleRel && sampleRelSource && sampleRelTarget
          ? `En la relación \`${sampleRelSource} (${sampleRel.cardinality}) → ${sampleRelTarget}\`, **${sampleRelTarget}** recibe la FK \`${sampleRel.foreignKeyAttributeName || `${sampleRelSource.toLowerCase()}_id`}\`.`
          : `Cuando conectas dos entidades en el lienzo con \`1:N\`, la tabla destino recibe automáticamente una columna \`*_id\` marcada como \`[FK]\`.`
      }\n` +
      `• **Enfoque para ${askingUser.name} (${askingUser.role}):** ${roleAngle[askingUser.role]}`;
  } else if (
    normalizedPrompt.includes('normaliz') ||
    normalizedPrompt.includes('1fn') ||
    normalizedPrompt.includes('2fn') ||
    normalizedPrompt.includes('3fn') ||
    normalizedPrompt.includes('bcnf') ||
    normalizedPrompt.includes('dependencia funcional')
  ) {
    directTopicAnswer =
      `📐 **Normalización (1FN, 2FN, 3FN y BCNF) en \`${model.name}\`:**\n` +
      `La normalización organiza tus tablas y **dependencias funcionales** para eliminar redundancias y anomalías de inserción, actualización y borrado:\n` +
      `1. **1FN:** Atributos atómicos sin listas ni grupos repetitivos (todas tus ${model.entities.length} entidades tienen PK definida: ${audit.entitiesWithoutPK.length === 0 ? 'Cumple' : 'Faltan PKs en ' + audit.entitiesWithoutPK.map(e => e.name).join(', ')}).\n` +
      `2. **2FN:** Ningún atributo no clave depende parcialmente de una clave compuesta.\n` +
      `3. **3FN:** Sin dependencias transitivas (PK → A → B).\n` +
      `4. **BCNF:** Todo determinante de una dependencia funcional no trivial es superclave.\n\n` +
      `• **Estado para ${askingUser.name} (${askingUser.role}):** Tienes **${model.functionalDependencies?.length || 0} dependencias funcionales** registradas. ${
        audit.nmRelationships.length > 0
          ? `Ojo: detecté **${audit.nmRelationships.length} relación(es) N:M** que conviene descomponer en tabla intermedia.`
          : 'Puedes abrir el botón **Normalización** arriba para ejecutar el verificador automático.'
      }`;
  } else if (
    normalizedPrompt.includes('cardinalidad') ||
    normalizedPrompt.includes('muchos a muchos') ||
    normalizedPrompt.includes('uno a muchos') ||
    normalizedPrompt.includes('n:m') ||
    normalizedPrompt.includes('1:n') ||
    normalizedPrompt.includes('relacion')
  ) {
    directTopicAnswer =
      `🔀 **Cardinalidades y Relaciones en \`${model.name}\`:**\n` +
      `Definen cuántas instancias de una entidad se asocian con otra:\n` +
      `• **1:1 (Uno a Uno):** Un registro se vincula con máximo uno del otro lado.\n` +
      `• **1:N (Uno a Muchos):** La PK del lado \`1\` migra como **FK** al lado \`N\`.\n` +
      `• **N:M (Muchos a Muchos):** En el modelo físico requiere una **tabla asociativa intermedia** con dos FKs.\n\n` +
      `• **En tu diagrama (${model.relationships.length} relaciones):** ${
        audit.nmRelationships.length > 0
          ? `Actualmente tienes **${audit.nmRelationships.length} relación(es) N:M** (${audit.nmRelationships.map(n => `${n.source?.name} ↔ ${n.target?.name}`).join(', ')}). Como **${askingUser.role}**, ${config.mode === 'mentor' ? 'analiza qué atributos propios tendría la tabla intermedia.' : 'puedo generar esa tabla asociativa por ti.'}`
          : 'Tus relaciones están estructuradas en `1:1` o `1:N`.'
      }`;
  } else if (
    normalizedPrompt.includes('uml') ||
    normalizedPrompt.includes('conceptual') ||
    normalizedPrompt.includes('logico') ||
    normalizedPrompt.includes('fisico')
  ) {
    directTopicAnswer =
      `🧩 **Vistas del Taller de Diseño (Conceptual, Lógico, Físico y Clases UML):**\n` +
      `• **DER Conceptual:** Muestra entidades y relaciones del negocio sin detalles técnicos.\n` +
      `• **DER Lógico:** Incorpora llaves primarias (\`PK\`), foráneas (\`FK\`) y cardinalidades normalizadas.\n` +
      `• **DER Físico:** Muestra nombres de tablas SQL (\`tableName\`), tipos de datos PostgreSQL y nulabilidad.\n` +
      `• **Clases UML:** Representa tus ${model.entities.length} entidades como clases POO con visibilidad, atributos y métodos para **${askingUser.role === 'Implementador' ? 'generar el código Spring Boot' : 'documentar la arquitectura'}**.`;
  }

  if (directTopicAnswer) {
    const modeNote =
      config.mode === 'mentor'
        ? `\n\n🧭 **Pregunta de Mentoría para ${askingUser.name}:** Con base en esto, ¿qué ajuste revisarías en **${sampleEnt?.name || model.name}** desde tu rol de **${askingUser.role}**?`
        : proposedChange
        ? `\n\n✨ **Propuesta lista (${config.mode === 'solver' ? 'Modo Solucionador' : 'Modo Copiloto'}):** Detecté una mejora aplicable sobre tu diagrama (*${proposedChange.summary}*).`
        : '';

    return {
      text: `${roleHeader}\n\n${directTopicAnswer}${modeNote}`,
      providerUsed: engineLabel,
      proposedChange: config.mode === 'mentor' ? undefined : proposedChange,
      codeSnippet,
      autoApply: config.mode === 'solver' && Boolean(proposedChange)
    };
  }

  // 4.2 Análisis específico por rol PUDS cuando pide revisión/diagnóstico general del diagrama
  const topFinding = audit.findings[0];
  let roleSpecificAnalysis = '';

  if (askingUser.role === 'Analista') {
    roleSpecificAnalysis = `📋 **Diagnóstico de Dominio para ti, ${askingUser.name} (Analista):**\n` +
      `1. **Cobertura del Negocio (${model.client || model.name}):** Actualmente modelamos ${model.entities.length} conceptos clave (${model.entities.map(e => `\`${e.name}\``).join(', ')}).\n` +
      `2. **Trazabilidad de Reglas (DFs):** Tienes **${model.functionalDependencies?.length || 0} dependencias funcionales** declaradas. ${
        selectedEntity
          ? `En **${selectedEntity.name}**, el identificador \`${selectedEntity.attributes.find(a => a.isPrimaryKey)?.name || 'id'}\` determina funcionalmente a \`${selectedEntity.attributes.filter(a => !a.isPrimaryKey).map(a => a.name).join(', ')}\`.`
          : ''
      }\n` +
      `3. **Oportunidad detectada en el dominio:** ${topFinding ? topFinding.detail : 'El alcance funcional básico está completo; podrías incorporar una entidad de Auditoría o Facturación para cerrar el ciclo transaccional.'}`;
  } else if (askingUser.role === 'Diseñador') {
    roleSpecificAnalysis = `📐 **Diagnóstico Relacional & UML para ti, ${askingUser.name} (Diseñador):**\n` +
      `1. **Estado de Normalización (1FN-BCNF):** ${
        audit.entitiesWithoutPK.length === 0
          ? 'Todas las entidades cumplen **1FN** con clave primaria definida.'
          : `Atención: ${audit.entitiesWithoutPK.map(e => e.name).join(', ')} no tienen clave primaria.`
      }\n` +
      `2. **Cardinalidades y Claves Foráneas:** De las **${model.relationships.length} relaciones**, ${
        audit.nmRelationships.length > 0
          ? `detecté **${audit.nmRelationships.length} relación(es) N:M** (${audit.nmRelationships.map(n => `${n.source?.name} ↔ ${n.target?.name}`).join(', ')}) que deberíamos transformar en tabla asociativa.`
          : 'todas las relaciones están en `1:1` o `1:N`.'
      } ${
        audit.missingFKEntities.length > 0
          ? `Además, faltan **${audit.missingFKEntities.length} atributo(s) [FK]** explícitos en las tablas hijas.`
          : 'Todas las tablas hijas cuentan con su atributo `[FK]`.'
      }`;
  } else if (askingUser.role === 'Implementador') {
    const targetEnt = selectedEntity || model.entities[0];
    roleSpecificAnalysis = `💻 **Diagnóstico de Implementación Backend para ti, ${askingUser.name} (Implementador):**\n` +
      `1. **Mapeo ORM (Spring Boot 3 + Hibernate):** Para las ${model.entities.length} tablas de **${model.name}**, ${
        audit.nmRelationships.length > 0
          ? `ten cuidado con la relación \`N:M\` en **${audit.nmRelationships[0].source?.name} ↔ ${audit.nmRelationships[0].target?.name}**: en lugar de usar \`@ManyToMany\` plano, te recomiendo mapear una entidad intermedia con \`@OneToMany\` para soportar columnas extra como fecha o subtotal.`
          : `las relaciones \`1:N\` se mapean limpiamente con \`@ManyToOne(fetch = FetchType.LAZY)\` y \`@JoinColumn\`.`
      }\n` +
      `2. **Optimización PostgreSQL en ${targetEnt?.name || 'el esquema'}:** Te sugiero crear índices \`CREATE INDEX\` sobre las columnas foráneas (\`${
        targetEnt?.attributes.filter(a => a.isForeignKey || a.isUnique).map(a => a.name).join(', ') || 'cliente_id, fecha'
      }\`) para acelerar los \`JOIN\` en tus endpoints REST.`;
  } else {
    roleSpecificAnalysis = `🛡️ **Diagnóstico de Gobernanza y Calidad PUDS para ti, ${askingUser.name} (Administrador):**\n` +
      `1. **Estado del Proyecto "${model.name}":** Fase actual **${model.status || 'Diseño'}** (Versión ${model.version}).\n` +
      `2. **Sincronización del Equipo (${collaborators.length} activos):** ${collaborators.map(c => `${c.name} (${c.role})`).join(', ')} están trabajando sobre la misma sala.\n` +
      `3. **Riesgos Técnicos antes de Producción:** ${
        audit.findings.length > 0
          ? `Hay **${audit.findings.length} punto(s) de mejora** (${audit.findings.map(f => f.title).join('; ')}).`
          : 'El modelo cumple con los estándares de calidad PUDS para pasar a generación de código.'
      }`;
  }

  let modeFooter = '';
  if (config.mode === 'mentor') {
    modeFooter = `\n\n🧭 **Pregunta de Mentoría para ${askingUser.name}:** ¿Cómo crees que deberíamos ajustar ${
      selectedEntity ? `la entidad **${selectedEntity.name}**` : `el esquema de **${model.name}**`
    } desde tu rol de **${askingUser.role}** para resolver este punto sin introducir redundancia? *(Modo Mentor activo: te guío sin alterar el diagrama automáticamente).*`;
  } else if (config.mode === 'solver' && proposedChange) {
    modeFooter = `\n\n⚡ **Acción Directa del Senior (Modo Solucionador):** Ya apliqué automáticamente la mejora sobre el diagrama (${proposedChange.summary}) para que tú y el equipo continúen sin bloqueos.`;
  } else if (proposedChange) {
    modeFooter = `\n\n✨ **Solución Lista (Modo Copiloto Senior):** He preparado la solución automática (*${proposedChange.summary}*). Puedes aplicarla al diagrama con el botón de abajo cuando estés de acuerdo.`;
  }

  return {
    text: `${roleHeader}\n\n${selectedContextLine}\n\n${roleSpecificAnalysis}${modeFooter}`,
    providerUsed: engineLabel,
    proposedChange: config.mode === 'mentor' ? undefined : proposedChange,
    codeSnippet,
    autoApply: config.mode === 'solver' && Boolean(proposedChange)
  };
}
