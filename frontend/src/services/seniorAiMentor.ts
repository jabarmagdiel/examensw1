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
import { executeVoiceCommand, processDiagramPhoto } from './aiAssistant';

const SENIOR_CONFIG_KEY = 'case_ai_senior_config_v1';
const GROUP_CHAT_STORAGE_KEY = 'case_ai_group_chat_v1';

export const DEFAULT_SENIOR_AI_CONFIG: SeniorAIConfig = {
  mode: 'hybrid',
  provider: 'local_llm',
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
    const parsed = { ...DEFAULT_SENIOR_AI_CONFIG, ...JSON.parse(raw) };
    // Priorizar siempre IA 100% Local salvo que el usuario haya ingresado explícitamente una API key externa
    if (parsed.provider === 'google_gemini' && !parsed.googleApiKey?.trim()) {
      parsed.provider = 'local_llm';
    }
    return parsed;
  } catch {
    return DEFAULT_SENIOR_AI_CONFIG;
  }
}

export async function checkLocalOllamaStatus(endpoint = 'http://localhost:11434/api/chat'): Promise<{
  online: boolean;
  models: string[];
}> {
  try {
    const base = endpoint.replace(/\/api\/chat.*$/, '').replace(/\/v1\/.*$/, '');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${base}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { online: false, models: [] };
    const data = await res.json();
    const models: string[] = (data?.models || []).map((m: any) => m.name || m.model).filter(Boolean);
    return { online: true, models };
  } catch {
    return { online: false, models: [] };
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
      text: `¡Qué tal equipo! Ya estoy conectado en la sala viendo el diagrama en tiempo real. Cualquier duda de dominio, diseño relacional, normalización o código Spring Boot me escriben por acá y lo vemos juntos.\n\nArriba pueden elegir si quieren que solo los **guíe** (*Mentor*), les **proponga cambios listos para aprobar** (*Copiloto*) o los **aplique directo en el lienzo** (*Solucionador*).`,
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

export interface MissingAttributeRecommendation {
  entity: Entity;
  currentCount: number;
  suggestedAttributes: {
    attribute: Attribute;
    reason: string;
  }[];
}

/**
 * Analiza clase por clase qué atributos de negocio/técnicos faltan aumentar
 * según el dominio y las entidades actuales del lienzo.
 */
export function analyzeMissingAttributesPerEntity(
  model: DiagramModel,
  filterEntityIds?: string[]
): {
  recommendations: MissingAttributeRecommendation[];
  proposedEntities: Entity[];
  totalAdded: number;
  summary: string;
} {
  type CandidateAttr = {
    name: string;
    type: Attribute['type'];
    length?: number;
    isUnique?: boolean;
    isNullable?: boolean;
    reason: string;
  };

  const catalog: Record<string, CandidateAttr[]> = {
    cliente: [
      { name: 'email', type: 'VARCHAR', length: 120, isUnique: true, isNullable: false, reason: 'Correo único para envío de recordatorios y facturación electrónica' },
      { name: 'fechaRegistro', type: 'DATE', isNullable: false, reason: 'Trazabilidad de antigüedad del propietario en la clínica' }
    ],
    mascota: [
      { name: 'pesoKg', type: 'DECIMAL', isNullable: false, reason: 'Indispensable para calcular dosis exactas de medicamentos y anestesia' },
      { name: 'sexo', type: 'VARCHAR', length: 15, isNullable: false, reason: 'Control clínico y diferenciación biológica del paciente' },
      { name: 'esterilizado', type: 'BOOLEAN', isNullable: false, reason: 'Dato médico base para historial reproductivo y cirugías' }
    ],
    veterinario: [
      { name: 'email', type: 'VARCHAR', length: 120, isUnique: true, isNullable: false, reason: 'Identificación corporativa y notificaciones de agenda médica' },
      { name: 'turnoAtencion', type: 'VARCHAR', length: 50, isNullable: false, reason: 'Control de disponibilidad horaria para asignar citas sin solapamiento' }
    ],
    citamedica: [
      { name: 'costoConsulta', type: 'DECIMAL', isNullable: false, reason: 'Permite registrar el importe económico de la atención y liquidar caja' },
      { name: 'observaciones', type: 'TEXT', isNullable: true, reason: 'Notas previas de recepción o síntomas reportados al agendar' }
    ],
    historialclinico: [
      { name: 'pesoRegistrado', type: 'DECIMAL', isNullable: false, reason: 'Control evolutivo del peso del paciente en cada consulta' },
      { name: 'temperatura', type: 'DECIMAL', isNullable: true, reason: 'Signo vital crítico en la revisión física veterinaria' },
      { name: 'proximoControl', type: 'DATE', isNullable: true, reason: 'Programación de seguimiento clínico o próxima vacuna' }
    ],
    proveedor: [
      { name: 'emailContacto', type: 'VARCHAR', length: 120, isUnique: true, isNullable: false, reason: 'Canal oficial para órdenes de compra de laboratorio' },
      { name: 'direccionFiscal', type: 'VARCHAR', length: 200, isNullable: false, reason: 'Requisito tributario y logístico de recepción' }
    ],
    medicamento: [
      { name: 'principioActivo', type: 'VARCHAR', length: 120, isNullable: false, reason: 'Permite buscar equivalentes farmacológicos en mostrador' },
      { name: 'requiereReceta', type: 'BOOLEAN', isNullable: false, reason: 'Control regulatorio para expendio de antibióticos/psicotrópicos' }
    ],
    lote: [
      { name: 'costoUnitario', type: 'DECIMAL', isNullable: false, reason: 'Cálculo de margen de ganancia por lote ingresado' },
      { name: 'ubicacionEstante', type: 'VARCHAR', length: 50, isNullable: true, reason: 'Localización rápida en almacén bajo método FEFO' }
    ],
    venta: [
      { name: 'metodoPago', type: 'VARCHAR', length: 40, isNullable: false, reason: 'Arqueo de caja (Efectivo, QR, Tarjeta)' },
      { name: 'descuento', type: 'DECIMAL', isNullable: false, reason: 'Registro de promociones o convenios aplicados' }
    ],
    usuario: [
      { name: 'telefono', type: 'VARCHAR', length: 30, isNullable: true, reason: 'Contacto directo para coordinación de entregas' },
      { name: 'direccionEnvio', type: 'VARCHAR', length: 200, isNullable: false, reason: 'Destino logístico predeterminado del comprador' }
    ],
    producto: [
      { name: 'sku', type: 'VARCHAR', length: 50, isUnique: true, isNullable: false, reason: 'Código único de inventario para almacén y catálogo' },
      { name: 'categoria', type: 'VARCHAR', length: 80, isNullable: false, reason: 'Clasificación comercial y filtros de búsqueda' }
    ],
    pedido: [
      { name: 'metodoPago', type: 'VARCHAR', length: 40, isNullable: false, reason: 'Trazabilidad de pasarela de pago utilizada' },
      { name: 'costoEnvio', type: 'DECIMAL', isNullable: false, reason: 'Desglose financiero entre subtotal de productos y flete' }
    ],
    detallepedido: [
      { name: 'descuentoLinea', type: 'DECIMAL', isNullable: false, reason: 'Soporte para ofertas por volumen en cada ítem del carrito' }
    ]
  };

  const recommendations: MissingAttributeRecommendation[] = [];
  let totalAdded = 0;

  const proposedEntities = model.entities.map(ent => {
    if (filterEntityIds && filterEntityIds.length > 0 && !filterEntityIds.includes(ent.id)) {
      return ent;
    }

    const normalizedName = ent.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    const existingNames = new Set(ent.attributes.map(a => a.name.toLowerCase()));
    const candidates: CandidateAttr[] = catalog[normalizedName] || [
      { name: 'estado', type: 'VARCHAR', length: 30, isNullable: false, reason: `Control del ciclo de vida del registro en ${ent.name}` },
      { name: 'fechaActualizacion', type: 'TIMESTAMP', isNullable: true, reason: `Auditoría temporal de cambios sobre ${ent.name}` }
    ];

    const missingForEntity = candidates.filter(c => !existingNames.has(c.name.toLowerCase()));

    // Si ya tiene todos los candidatos primarios, sugerir atributos de auditoría de segundo nivel
    const auditTier: CandidateAttr[] = [
      { name: 'activo', type: 'BOOLEAN', isNullable: false, reason: `Borrado lógico (soft-delete) para no perder historial en ${ent.name}` },
      { name: 'updatedAt', type: 'TIMESTAMP', isNullable: true, reason: `Timestamp de última modificación para auditoría en ${ent.name}` }
    ];
    const finalMissing: CandidateAttr[] =
      missingForEntity.length > 0
        ? missingForEntity
        : auditTier.filter(c => !existingNames.has(c.name.toLowerCase()));

    if (finalMissing.length === 0) {
      return ent;
    }

    const suggestedAttributes = finalMissing.map((item, idx) => ({
      attribute: {
        id: `attr_sen_${ent.id}_${Date.now()}_${idx}`,
        name: item.name,
        type: item.type,
        length: item.length,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: item.isUnique,
        isNullable: item.isNullable ?? false
      } as Attribute,
      reason: item.reason
    }));

    totalAdded += suggestedAttributes.length;
    recommendations.push({
      entity: ent,
      currentCount: ent.attributes.length,
      suggestedAttributes
    });

    // Insertar los nuevos atributos antes de las llaves foráneas para mantener orden limpio (PK -> Atributos -> FK)
    const pkAndNormal = ent.attributes.filter(a => !a.isForeignKey);
    const fkAttrs = ent.attributes.filter(a => a.isForeignKey);

    return {
      ...ent,
      attributes: [...pkAndNormal, ...suggestedAttributes.map(s => s.attribute), ...fkAttrs]
    };
  });

  const summary =
    recommendations.length > 0
      ? `Aumentar ${totalAdded} atributo(s) recomendado(s) en ${recommendations.map(r => `${r.entity.name} (+${r.suggestedAttributes.length})`).join(', ')}`
      : 'Todas las clases ya cuentan con sus atributos de dominio y auditoría completos';

  return {
    recommendations,
    proposedEntities,
    totalAdded,
    summary
  };
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

  return `Eres el Desarrollador Senior del equipo (Arq. IA Senior) dentro de la plataforma CASE Enterprise Studio.
Participas en el chat grupal como **un compañero técnico más del equipo** trabajando codo a codo sobre el mismo diagrama.

ESTILO DE COMUNICACIÓN (MUY IMPORTANTE):
- Habla de forma natural, cercana y directa, como un desarrollador Senior real en el chat del equipo (ej: "Buena pregunta, ${askingUser.name}...", "Mira, en nuestro diagrama...", "Para esto te conviene...").
- PROHIBIDO usar encabezados robóticos o de plantilla como "Hola X — Te respondo desde la visión de..." o repetir el resumen completo del proyecto si no viene al caso.
- Quien escribe ahora es **${askingUser.name}** (rol **${askingUser.role}**). ${roleInstruction}
- Usa ejemplos concretos de las entidades y atributos reales de "${model.name}" cuando ayude a explicar.

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

  const candidateModels = Array.from(
    new Set([
      config.googleModel || 'gemini-2.5-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-flash-latest'
    ])
  );

  let lastError: Error | null = null;
  for (const modelName of candidateModels) {
    try {
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
            maxOutputTokens: 1100
          }
        })
      });

      if (!response.ok) {
        lastError = new Error(`Gemini API HTTP ${response.status} (${modelName})`);
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e: any) {
      lastError = e;
    }
  }

  if (lastError) throw lastError;
  return null;
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
  imageDataUrl?: string;
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
  const { prompt, imageDataUrl, model, askingUser, collaborators, selectedEntityId, config, recentMessages } = params;
  const selectedEntity = model.entities.find(e => e.id === selectedEntityId) || null;
  const audit = analyzeDiagramContext(model);
  const lower = prompt.toLowerCase();
  const normalizedPrompt = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const shortName = askingUser.name.split(' ')[0] || askingUser.name;

  // 0. Si el usuario adjuntó una imagen de un diagrama en el chat colaborativo, leer la imagen con Ollama Vision / Gemini / OCR Local y ejecutar la acción exacta solicitada
  if (imageDataUrl) {
    const scanResult = await processDiagramPhoto(imageDataUrl, prompt, model.entities, {
      engine: config.provider === 'google_gemini' ? 'gemini' : 'auto',
      customGeminiApiKey: config.googleApiKey
    });
    const matchedOnCanvas = scanResult.matchedExistingEntities;
    const primaryTarget = matchedOnCanvas[0] || (scanResult.entities[0] ? model.entities.find(e => e.name.toLowerCase() === scanResult.entities[0].name.toLowerCase()) : undefined);

    const wantsDeleteClass =
      /\b(borra|borrar|elimina|eliminar|quita|quitar|remueve|remover|saca|sacar|delete)\b/.test(normalizedPrompt) &&
      !normalizedPrompt.includes('atributo') &&
      !normalizedPrompt.includes('campo') &&
      !normalizedPrompt.includes('columna');

    const wantsEditClass =
      /\b(agrega|agregar|aumenta|aumentar|anade|anadir|pon|ponle|edita|editar|modifica|modificar|cambia|cambiar|renombra|renombrar)\b/.test(normalizedPrompt) &&
      !normalizedPrompt.includes('al lienzo') &&
      !normalizedPrompt.includes('nuevo');

    const wantsOnlyInspection =
      /\b(que ves|que dice|que clase|explica|revisa|analiza|falta|falten|recomienda)\b/.test(normalizedPrompt) &&
      !normalizedPrompt.includes('export') &&
      !normalizedPrompt.includes('pasa al lienzo') &&
      !normalizedPrompt.includes('carga al lienzo');

    // A. Caso: "borra esa clase" / "elimina la clase de la foto"
    if (wantsDeleteClass) {
      const targetsToDelete =
        matchedOnCanvas.length > 0
          ? matchedOnCanvas
          : primaryTarget
          ? [primaryTarget]
          : selectedEntity
          ? [selectedEntity]
          : [];

      if (targetsToDelete.length === 0) {
        const ocrDetectedNames = scanResult.entities.map(e => `**\`${e.name}\`**`).join(', ');
        return {
          text:
            ocrDetectedNames
              ? `Leí ${ocrDetectedNames} en tu imagen (**${shortName}**), pero no encontré esa clase en el lienzo actual de **${model.name}**, así que no borré nada.`
              : `No logré identificar en el lienzo actual de **${model.name}** qué clase quieres borrar con esa captura (${scanResult.summary}). Dime el nombre exacto (ej. *"borra la clase Reserva"*) y la quito al instante.`,
          providerUsed: scanResult.providerUsed,
          autoApply: false
        };
      }

      const deleteIds = new Set(targetsToDelete.map(t => t.id));
      const remainingEntities = model.entities.filter(e => !deleteIds.has(e.id));
      const remainingRelationships = model.relationships.filter(
        r => !deleteIds.has(r.sourceEntityId) && !deleteIds.has(r.targetEntityId)
      );
      const deletedNames = targetsToDelete.map(t => `\`${t.name}\``).join(', ');
      const deleteProposal = {
        entities: remainingEntities,
        relationships: remainingRelationships,
        summary: `Eliminar clase(s) ${targetsToDelete.map(t => t.name).join(', ')} detectada(s) en la captura`
      };

      if (config.mode === 'mentor') {
        return {
          text: `Identifiqué ${deletedNames} en la imagen, **${shortName}**. Estás en **Modo Mentor**, así que no la borré automáticamente; si confirmas que no afecta tus relaciones actuales, pásame a **Copiloto** o **Solucionador Directo**.`,
          providerUsed: scanResult.providerUsed,
          autoApply: false
        };
      }

      return {
        text:
          config.mode === 'solver'
            ? `Listo **${shortName}**, reconocí ${deletedNames} en tu imagen y ya la eliminé del diagrama junto con sus relaciones.`
            : `Identifiqué ${deletedNames} en la captura, **${shortName}**. Dale al botón verde de abajo para confirmar y borrarla del diagrama.`,
        providerUsed: scanResult.providerUsed,
        proposedChange: deleteProposal,
        autoApply: config.mode === 'solver'
      };
    }

    // B. Caso: Editar una clase que YA existe en el lienzo y mostraron en la captura (ej. "agrega email a esa clase")
    if (wantsEditClass && primaryTarget) {
      const resolvedPrompt = prompt.replace(/\b(esa clase|esta clase|la clase de la foto|la foto|esa tabla|esta tabla)\b/gi, primaryTarget.name);
      const editAttempt = executeVoiceCommand(resolvedPrompt, model);
      if (editAttempt.actionType !== 'UNKNOWN') {
        return {
          text:
            config.mode === 'solver'
              ? `Listo **${shortName}**, reconocí **\`${primaryTarget.name}\`** en la imagen y ya apliqué el cambio: ${editAttempt.summary}.`
              : `Reconocí **\`${primaryTarget.name}\`** en tu captura, **${shortName}**, y preparé la edición: **${editAttempt.summary}**. Confírmala abajo para aplicarla al lienzo.`,
          providerUsed: scanResult.providerUsed,
          proposedChange:
            config.mode === 'mentor'
              ? undefined
              : {
                  entities: editAttempt.model.entities,
                  relationships: editAttempt.model.relationships,
                  summary: editAttempt.summary
                },
          autoApply: config.mode === 'solver'
        };
      }
    }

    // C. Caso: Solo consultar/revisar qué aparece en la captura sin crear copias falsas
    if (wantsOnlyInspection) {
      const targetList = matchedOnCanvas.length > 0 ? matchedOnCanvas : scanResult.entities;
      if (targetList.length === 0) {
        return {
          text: `Revisé la captura, **${shortName}**, pero no detecté bloques UML legibles (${scanResult.summary}).`,
          providerUsed: scanResult.providerUsed,
          autoApply: false
        };
      }
      const missingAnalysis = analyzeMissingAttributesPerEntity(
        { ...model, entities: targetList },
        targetList.map(e => e.id)
      );
      const details = targetList
        .map(e => `• **\`${e.name}\`**: ${e.attributes.map(a => `\`${a.name}\``).join(', ')}`)
        .join('\n');
      const suggestionLine =
        missingAnalysis.recommendations.length > 0
          ? `\n\n• **Sugerencias de atributos para aumentar:** ${missingAnalysis.recommendations
              .map(r => `${r.entity.name} (+${r.suggestedAttributes.map(s => `\`${s.attribute.name}\``).join(', ')})`)
              .join('; ')}.`
          : '';
      return {
        text: `Esto es lo que leí de tu imagen, **${shortName}**:\n\n${details}${suggestionLine}`,
        providerUsed: scanResult.providerUsed,
        proposedChange:
          config.mode !== 'mentor' && matchedOnCanvas.length > 0 && missingAnalysis.totalAdded > 0
            ? {
                entities: model.entities.map(ent => missingAnalysis.proposedEntities.find(p => p.id === ent.id) || ent),
                relationships: model.relationships,
                summary: missingAnalysis.summary
              }
            : undefined,
        autoApply: false
      };
    }

    // D. Caso: Digitalizar / Exportar diagrama nuevo desde foto al lienzo general
    if (scanResult.entities.length === 0) {
      return {
        text: `Analicé la imagen, **${shortName}**, pero no pude extraer clases UML completas (${scanResult.summary}). Si tienes Ollama local, activa un modelo de visión como \`llama3.2-vision\` o dime qué clases contiene para ayudarte a crearlas.`,
        providerUsed: scanResult.providerUsed,
        autoApply: false
      };
    }

    let workingEntities = scanResult.entities;
    let workingRels = scanResult.relationships;
    let editNote = '';

    if (prompt.trim()) {
      const tempDiagram: DiagramModel = {
        ...model,
        entities: workingEntities,
        relationships: workingRels
      };
      const editAttempt = executeVoiceCommand(prompt, tempDiagram);
      if (editAttempt.actionType !== 'UNKNOWN') {
        workingEntities = editAttempt.model.entities;
        workingRels = editAttempt.model.relationships;
        editNote = `\n• **Edición IA aplicada:** ${editAttempt.summary}`;
      }
    }

    // Evitar duplicar clases que ya están en el lienzo con el mismo nombre
    const existingNamesLower = new Set(model.entities.map(e => e.name.toLowerCase()));
    const newEntities = workingEntities.filter(e => !existingNamesLower.has(e.name.toLowerCase()));
    const entitiesToInsert = newEntities.length > 0 ? newEntities : workingEntities;

    const offsetY = model.entities.length > 0 ? 320 : 0;
    const shiftedEntities = entitiesToInsert.map(e => ({ ...e, y: e.y + offsetY }));
    const replaceMode =
      normalizedPrompt.includes('reemplaza') ||
      normalizedPrompt.includes('nuevo lienzo') ||
      normalizedPrompt.includes('solo este');

    const finalEntities = replaceMode ? workingEntities : [...model.entities, ...shiftedEntities];
    const finalRels = replaceMode ? workingRels : [...model.relationships, ...workingRels];

    const imageProposedChange = {
      entities: finalEntities,
      relationships: finalRels,
      summary: `Exportar al lienzo general ${entitiesToInsert.length} clase(s) UML desde imagen`
    };

    const classListText = workingEntities
      .map(e => `• **\`${e.name}\`**: ${e.attributes.map(a => `\`${a.name}\``).join(', ')}`)
      .join('\n');

    return {
      text:
        `Listo **${shortName}**, esto fue lo que leí en tu imagen:\n\n` +
        `${classListText}\n\n` +
        `• **Relaciones detectadas:** ${workingRels.length}${editNote}\n\n` +
        (config.mode === 'solver'
          ? `⚡ Ya pasé estas **${entitiesToInsert.length} clase(s) UML 2.5** al lienzo general.`
          : `✨ Dale al botón **"Aplicar Solución del Senior al Diagrama"** abajo si quieres pasarlas al lienzo general (o dime qué quieres editarles primero).`),
      providerUsed: scanResult.providerUsed,
      proposedChange: config.mode === 'mentor' ? undefined : imageProposedChange,
      autoApply: config.mode === 'solver'
    };
  }

  // Detectar si el usuario menciona una o varias clases específicas en su pregunta
  const mentionedEntities = model.entities.filter(e => {
    const cleanName = e.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalizedPrompt.includes(cleanName);
  });

  const isAskingAboutMissingAttributes =
    normalizedPrompt.includes('atributo') ||
    normalizedPrompt.includes('campo') ||
    normalizedPrompt.includes('columna') ||
    normalizedPrompt.includes('propiedad') ||
    ((normalizedPrompt.includes('falta') ||
      normalizedPrompt.includes('aumentar') ||
      normalizedPrompt.includes('agregar') ||
      normalizedPrompt.includes('anadir') ||
      normalizedPrompt.includes('recomienda') ||
      normalizedPrompt.includes('sugiere')) &&
      !normalizedPrompt.includes('nueva tabla') &&
      !normalizedPrompt.includes('nueva clase'));

  const isAskingAboutMissingClasses =
    (normalizedPrompt.includes('que clase') ||
      normalizedPrompt.includes('que tabla') ||
      normalizedPrompt.includes('que entidad') ||
      normalizedPrompt.includes('otra clase') ||
      normalizedPrompt.includes('otra tabla') ||
      normalizedPrompt.includes('otra entidad') ||
      normalizedPrompt.includes('falta alguna clase') ||
      normalizedPrompt.includes('falta alguna tabla') ||
      normalizedPrompt.includes('falta alguna entidad')) &&
    !normalizedPrompt.includes('atributo');

  const missingAttributesAnalysis = analyzeMissingAttributesPerEntity(
    model,
    mentionedEntities.length > 0 ? mentionedEntities.map(e => e.id) : undefined
  );

  // 1. Verificar si la instrucción del usuario pide una modificación directa al diagrama (crear, editar o eliminar clase)
  let directCommandResult = executeVoiceCommand(prompt, model);

  // Soporte directo para eliminar una clase mencionada o seleccionada (ej. "borra la clase Reserva", "elimina Reserva")
  const wantsTextDelete =
    /\b(borra|borrar|elimina|eliminar|quita|quitar|remueve|remover|delete)\b/.test(normalizedPrompt) &&
    !normalizedPrompt.includes('atributo') &&
    !normalizedPrompt.includes('campo') &&
    !normalizedPrompt.includes('columna');

  if (directCommandResult.actionType === 'UNKNOWN' && wantsTextDelete) {
    const targetToDelete = mentionedEntities[0] || selectedEntity;
    if (targetToDelete) {
      const remainingEntities = model.entities.filter(e => e.id !== targetToDelete.id);
      const remainingRels = model.relationships.filter(
        r => r.sourceEntityId !== targetToDelete.id && r.targetEntityId !== targetToDelete.id
      );
      directCommandResult = {
        model: { ...model, entities: remainingEntities, relationships: remainingRels, updatedAt: Date.now() },
        summary: `Clase "${targetToDelete.name}" eliminada del diagrama junto con sus relaciones.`,
        actionType: 'DELETE_ENTITY' as any
      };
    }
  }

  let proposedChange: { entities: Entity[]; relationships: Relationship[]; summary: string } | undefined;

  if (directCommandResult.actionType !== 'UNKNOWN') {
    proposedChange = {
      entities: directCommandResult.model.entities,
      relationships: directCommandResult.model.relationships,
      summary: directCommandResult.summary
    };
  } else if (isAskingAboutMissingAttributes && missingAttributesAnalysis.totalAdded > 0) {
    proposedChange = {
      entities: missingAttributesAnalysis.proposedEntities,
      relationships: model.relationships,
      summary: missingAttributesAnalysis.summary
    };
  } else if (
    isAskingAboutMissingClasses ||
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

  // 4. Respuesta del Motor Senior Contextual Integrado (Tono natural de compañero Senior del equipo)
  const engineLabel =
    config.provider === 'local_llm'
      ? `IA Local PUDS (100% Local Offline • Ollama ${config.localModel} opcional)`
      : config.provider === 'builtin_senior'
      ? 'IA Local PUDS (100% Local Offline)'
      : 'Motor Senior PUDS Local (Fallback)';

  // Si fue un comando directo sobre el diagrama
  if (directCommandResult.actionType !== 'UNKNOWN' && proposedChange) {
    if (config.mode === 'mentor') {
      return {
        text: `Buen punto, **${shortName}**. Antes de aplicar ese cambio (*${directCommandResult.summary}*), revisemos cómo nos impacta en **${model.name}**:\n\n• ${
          askingUser.role === 'Analista'
            ? `Verifica si hay alguna regla de negocio del cliente (${model.client || 'el proyecto'}) o dependencia funcional que lo respalde.`
            : askingUser.role === 'Diseñador'
            ? `Fíjate bien en la cardinalidad y si la clave foránea debería quedar \`NOT NULL\` para no romper **BCNF**.`
            : askingUser.role === 'Implementador'
            ? `Asegúrate de que el tipo de dato mapee limpio a \`@Column\` en JPA sin romper migraciones existentes.`
            : `Coordina con el equipo (${collaborators.map(c => c.name.split(' ')[0]).join(', ')}) si todos están de acuerdo antes de modificar el esquema.`
        }\n\n*(Estoy en **Modo Mentor**, así que no toqué el lienzo todavía. Si quieres que lo aplique, pásame a **Copiloto** o **Solucionador Directo**).*`,
        providerUsed: engineLabel,
        proposedChange: undefined,
        codeSnippet,
        autoApply: false
      };
    }

    if (config.mode === 'solver') {
      return {
        text: `Listo **${shortName}**, ya lo apliqué directo en el lienzo para todo el equipo:\n• **Cambio realizado:** ${directCommandResult.summary}.`,
        providerUsed: engineLabel,
        proposedChange,
        codeSnippet,
        autoApply: true
      };
    }

    return {
      text: `Dale **${shortName}**, ya armé el cambio sobre **${model.name}**:\n• ${directCommandResult.summary}\n\nSi te parece bien, dale al botón verde de abajo para aplicarlo al diagrama.`,
      providerUsed: engineLabel,
      proposedChange,
      codeSnippet,
      autoApply: false
    };
  }

  // 4.1 Detección inteligente del tema preguntado para responder como un compañero Senior directo al grano
  const sampleEnt = mentionedEntities[0] || selectedEntity || model.entities[0];
  const samplePK = sampleEnt?.attributes.find(a => a.isPrimaryKey)?.name || 'id';
  const sampleAttrList = sampleEnt?.attributes.filter(a => !a.isPrimaryKey && !a.isForeignKey).slice(0, 3).map(a => `\`${a.name}\``).join(', ') || '`nombre`, `estado`';
  const sampleRel = model.relationships[0];
  const sampleRelSource = sampleRel ? model.entities.find(e => e.id === sampleRel.sourceEntityId)?.name : undefined;
  const sampleRelTarget = sampleRel ? model.entities.find(e => e.id === sampleRel.targetEntityId)?.name : undefined;

  let directTopicAnswer = '';

  const isGreeting = /^(hola|buenas|hey|que tal|como estan|buenos dias|buenas tardes|buenas noches|saludos)\b/.test(normalizedPrompt.trim());

  if (isGreeting && normalizedPrompt.length < 40) {
    directTopicAnswer =
      `¡Qué tal **${shortName}**! Aquí ando revisando el diagrama de **${model.name}** (${model.entities.length} clases: ${model.entities.map(e => `\`${e.name}\``).join(', ')}).\n\n¿En qué nos enfocamos ahora? Puedo revisar atributos que falten, validar normalización, explicar relaciones o generar entidades JPA.`;
  } else if (isAskingAboutMissingAttributes) {
    if (missingAttributesAnalysis.recommendations.length > 0) {
      const perClassLines = missingAttributesAnalysis.recommendations
        .map(rec => {
          const currentAttrNames = rec.entity.attributes.map(a => `\`${a.name}\``).join(', ');
          const suggestedLines = rec.suggestedAttributes
            .map(
              s =>
                `   ◦ **\`+ ${s.attribute.name}\`** (\`${s.attribute.type}${s.attribute.length ? `(${s.attribute.length})` : ''}${
                  s.attribute.isUnique ? ', UNIQUE' : ''
                }\`): ${s.reason}.`
            )
            .join('\n');
          return `• **\`${rec.entity.name}\`** *(ya tiene: ${currentAttrNames})*:\n${suggestedLines}`;
        })
        .join('\n\n');

      const roleNote: Record<SystemRole, string> = {
        Analista: `Con esto dejamos cubiertas las reglas del negocio que normalmente piden en auditoría funcional.`,
        Diseñador: `Todos dependen directo de la \`PK\` de su propia clase, así que seguimos limpios en **3FN / BCNF**.`,
        Implementador: `Ya los dejé tipados para PostgreSQL/JPA (\`VARCHAR\`, \`DECIMAL\`, \`DATE\`, \`BOOLEAN\`) listos para generar tus \`@Entity\`.`,
        Administrador: `Con estos **${missingAttributesAnalysis.totalAdded} campos** el modelo queda mucho más sólido antes de pasar a producción.`
      };

      directTopicAnswer =
        `Estuve revisando las clases de **${model.name}**, **${shortName}**, y sí veo **${missingAttributesAnalysis.totalAdded} atributos** que nos convendría aumentar:\n\n` +
        `${perClassLines}\n\n` +
        `${roleNote[askingUser.role]}`;
    } else {
      directTopicAnswer =
        `Ya revisé todas las clases de **${model.name}** (**${shortName}**) y están bastante completas: ya tienen sus atributos clave de negocio y campos de auditoría.`;
    }
  } else if (isAskingAboutMissingClasses) {
    const domainFinding = audit.findings.find(f => f.category === 'dominio') || audit.findings[0];
    if (domainFinding) {
      directTopicAnswer =
        `Mirando **${model.name}**, **${shortName}**, nos vendría bien agregar **${domainFinding.title}**.\n\n` +
        `${domainFinding.detail} Así cerramos el circuito completo junto con ${model.entities.map(e => `\`${e.name}\``).join(', ')}.`;
    } else {
      directTopicAnswer =
        `Con las ${model.entities.length} clases que tenemos (${model.entities.map(e => `\`${e.name}\``).join(', ')}) el núcleo ya está cubierto, **${shortName}**. Si quieres llevar el proyecto a producción, lo único que sumaría sería una clase \`ComprobantePago\` o \`AuditoriaEvento\`.`;
    }
  } else if (
    normalizedPrompt.includes('que es una clase') ||
    normalizedPrompt.includes('que es clase') ||
    normalizedPrompt.includes('que son las clases') ||
    normalizedPrompt.includes('que es una entidad') ||
    normalizedPrompt.includes('que es entidad') ||
    normalizedPrompt.includes('que es una tabla')
  ) {
    const roleExample: Record<SystemRole, string> = {
      Analista: `Desde negocio, cada clase representa un **concepto real del sistema** con reglas propias (por ejemplo, \`${sampleEnt?.name || 'Producto'}\` guarda ${sampleAttrList}).`,
      Diseñador: `En nuestro diagrama, cada clase UML se transforma en una **tabla relacional** (\`${sampleEnt?.tableName || sampleEnt?.name.toLowerCase() || 'tabla'}\`) con su PK \`${samplePK}\` y sus llaves foráneas para conectar con las demás.`,
      Implementador: `En Java / Spring Boot cada clase del lienzo se convierte directo en un \`@Entity public class ${sampleEnt?.name || 'Entidad'}\` mapeado con JPA/Hibernate a PostgreSQL.`,
      Administrador: `Para el equipo, las clases son los **bloques base de la arquitectura**: si están bien definidas desde el inicio (como \`${sampleEnt?.name || 'Usuario'}\`), evitamos retrabajo en backend y base de datos.`
    };
    directTopicAnswer =
      `Claro **${shortName}**: en nuestro diagrama, una **clase** (o **entidad**) es el molde que representa un objeto o concepto importante del negocio y agrupa sus datos (atributos).\n\n` +
      `• **Ejemplo aquí mismo:** \`${sampleEnt?.name || 'Cliente'}\` es una clase que tiene su identificador \`${samplePK}\` y sus datos propios (${sampleAttrList}). Cada instancia real (un registro en BD o un objeto en código) nace de esa clase.\n` +
      `• ${roleExample[askingUser.role]}`;
  } else if (
    normalizedPrompt.includes('que es un atributo') ||
    normalizedPrompt.includes('que es atributo') ||
    normalizedPrompt.includes('que son los atributos') ||
    normalizedPrompt.includes('que es una columna') ||
    normalizedPrompt.includes('que es un campo')
  ) {
    directTopicAnswer =
      `Un **atributo**, **${shortName}**, es cada dato específico o característica que describe a una clase (en la base de datos termina siendo una **columna**).\n\n` +
      `• **Ejemplo en nuestro diagrama:** En \`${sampleEnt?.name || 'Producto'}\` tienes atributos como ${sampleAttrList}, además de \`${samplePK}\` como llave primaria.\n` +
      `• Cada atributo lleva su tipo de dato (\`VARCHAR\`, \`INTEGER\`, \`DECIMAL\`, \`DATE\`, \`BOOLEAN\`) y si permite nulos o es único.`;
  } else if (
    normalizedPrompt.includes('llave primaria') ||
    normalizedPrompt.includes('clave primaria') ||
    /\bpk\b/.test(normalizedPrompt) ||
    normalizedPrompt.includes('primary key')
  ) {
    const roleAngle: Record<SystemRole, string> = {
      Analista: `En negocio nos asegura que nunca haya dos \`${sampleEnt?.name || 'Cliente'}\` duplicados sin forma de distinguirlos.`,
      Diseñador: `Es el determinante base (\`${samplePK} → todos los atributos\`) para validar **2FN/3FN** y que otras tablas puedan apuntarle mediante FKs.`,
      Implementador: `En Spring Boot se mapea con \`@Id\` + \`@GeneratedValue\` sobre \`${sampleEnt?.name || 'Entidad'}.${samplePK}\` y en PostgreSQL crea su índice único automático.`,
      Administrador: `Ahora mismo **${model.entities.length - audit.entitiesWithoutPK.length} de ${model.entities.length}** tablas la tienen definida correctamente.`
    };
    directTopicAnswer =
      `La **Llave Primaria (PK)**, **${shortName}**, es el atributo que identifica de forma **única e irrepetible** cada registro de una tabla (nunca se repite ni puede ser \`NULL\`).\n\n` +
      `• Por ejemplo, en \`${sampleEnt?.name || 'Principal'}\` usamos \`${samplePK}\` como \`[PK]\`.\n` +
      `• ${roleAngle[askingUser.role]}`;
  } else if (
    normalizedPrompt.includes('llave foranea') ||
    normalizedPrompt.includes('clave foranea') ||
    normalizedPrompt.includes('clave externa') ||
    /\bfk\b/.test(normalizedPrompt) ||
    normalizedPrompt.includes('foreign key')
  ) {
    const roleAngle: Record<SystemRole, string> = {
      Analista: `Asegura la regla de negocio de que un registro hijo no quede huérfano sin su padre.`,
      Diseñador: `Siempre va en la tabla del lado **Muchos (\`N\`)** en las relaciones \`1:N\`.`,
      Implementador: `En JPA lo mapeamos con \`@ManyToOne(fetch = FetchType.LAZY)\` y \`@JoinColumn\`, y conviene indexarla en SQL.`,
      Administrador: `Mantiene la integridad referencial entre tablas al borrar o actualizar.`
    };
    directTopicAnswer =
      `Una **Llave Foránea (FK)**, **${shortName}**, es el campo que conecta dos tablas apuntando desde una tabla hija a la **PK** de la tabla padre.\n\n` +
      `• ${
        sampleRel && sampleRelSource && sampleRelTarget
          ? `Aquí lo puedes ver entre \`${sampleRelSource}\` y \`${sampleRelTarget}\` con \`${sampleRel.foreignKeyAttributeName || `${sampleRelSource.toLowerCase()}_id`}\`.`
          : `Cuando unes dos clases \`1:N\` en el lienzo, se crea automáticamente el campo \`*_id [FK]\` en la clase destino.`
      }\n` +
      `• ${roleAngle[askingUser.role]}`;
  } else if (
    normalizedPrompt.includes('normaliz') ||
    normalizedPrompt.includes('1fn') ||
    normalizedPrompt.includes('2fn') ||
    normalizedPrompt.includes('3fn') ||
    normalizedPrompt.includes('bcnf') ||
    normalizedPrompt.includes('dependencia funcional')
  ) {
    directTopicAnswer =
      `Revisemos cómo vamos con la **normalización** en **${model.name}**, **${shortName}**:\n\n` +
      `1. **1FN:** Campos atómicos y PK en cada tabla (${audit.entitiesWithoutPK.length === 0 ? 'todas cumplen ✅' : 'ojo, falta PK en ' + audit.entitiesWithoutPK.map(e => e.name).join(', ')}).\n` +
      `2. **2FN y 3FN:** Que ningún atributo dependa solo de parte de una clave ni transitivamente de otro atributo no clave.\n` +
      `3. **BCNF:** Que todo determinante sea superclave.\n\n` +
      `Ahora tenemos **${model.functionalDependencies?.length || 0} dependencias funcionales** cargadas. ${
        audit.nmRelationships.length > 0
          ? `Lo único a corregir es que hay **${audit.nmRelationships.length} relación(es) N:M** sin tabla intermedia.`
          : 'Puedes abrir **Normalización** arriba si quieres correr el chequeo formal completo.'
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
      `Sobre las **cardinalidades**, **${shortName}**:\n` +
      `• **\`1:1\`:** Un registro se relaciona con máximo uno del otro lado.\n` +
      `• **\`1:N\`:** El lado \`1\` pasa su PK como **FK** al lado \`N\`.\n` +
      `• **\`N:M\`:** Necesita una **tabla asociativa intermedia** con ambas FKs para poder llevarlo a SQL.\n\n` +
      `En **${model.name}** tenemos ${model.relationships.length} relaciones: ${
        audit.nmRelationships.length > 0
          ? `ojo con ${audit.nmRelationships.map(n => `\`${n.source?.name} ↔ ${n.target?.name}\``).join(', ')} que está en \`N:M\` directo y nos conviene descomponerla.`
          : 'todas están limpias en `1:1` o `1:N`.'
      }`;
  } else if (
    normalizedPrompt.includes('uml') ||
    normalizedPrompt.includes('conceptual') ||
    normalizedPrompt.includes('logico') ||
    normalizedPrompt.includes('fisico')
  ) {
    directTopicAnswer =
      `Las vistas del taller te muestran el mismo modelo en 4 niveles, **${shortName}**:\n` +
      `• **Conceptual:** Solo entidades y relaciones del negocio.\n` +
      `• **Lógico:** Ya incluye \`PK\`, \`FK\` y cardinalidades normalizadas.\n` +
      `• **Físico:** Nombres de tablas PostgreSQL, tipos de columna y \`NOT NULL\`.\n` +
      `• **Clases UML:** Tus ${model.entities.length} entidades como clases POO listas para ${askingUser.role === 'Implementador' ? 'generar el proyecto Spring Boot' : 'revisar arquitectura'}.`;
  } else if (mentionedEntities.length > 0) {
    const ent = mentionedEntities[0];
    const relsOfEnt = model.relationships
      .filter(r => r.sourceEntityId === ent.id || r.targetEntityId === ent.id)
      .map(r => {
        const s = model.entities.find(e => e.id === r.sourceEntityId)?.name || '';
        const t = model.entities.find(e => e.id === r.targetEntityId)?.name || '';
        return `\`${s} (${r.cardinality}) → ${t}\``;
      });
    const recForEnt = missingAttributesAnalysis.recommendations.find(r => r.entity.id === ent.id);

    directTopicAnswer =
      `Viéndola en el lienzo, **${shortName}**, la clase **\`${ent.name}\`** (tabla \`${ent.tableName || ent.name.toLowerCase()}\`) tiene **${ent.attributes.length} atributos**: ${ent.attributes
        .map(a => `\`${a.name}\`${a.isPrimaryKey ? ' (PK)' : a.isForeignKey ? ' (FK)' : ''}`)
        .join(', ')}.\n\n` +
      `• **Relaciones:** ${relsOfEnt.length > 0 ? relsOfEnt.join(', ') : 'Todavía está suelta sin relaciones conectadas.'}\n` +
      (recForEnt
        ? `• **Sugerencia rápida:** Yo le sumaría ${recForEnt.suggestedAttributes.map(s => `\`${s.attribute.name}\` (\`${s.attribute.type}\`)`).join(' y ')} para dejarla completa.`
        : `• Estructuralmente se ve consistente para su rol en **${model.name}**.`);
  }

  if (directTopicAnswer) {
    const modeNote =
      config.mode === 'mentor' && !isGreeting
        ? `\n\n¿Cómo lo ves tú desde **${askingUser.role}**, **${shortName}**?`
        : proposedChange
        ? `\n\n✨ *Si quieres, ya dejé lista la propuesta (${proposedChange.summary}) en el botón de abajo para aplicarla al diagrama.*`
        : '';

    return {
      text: `${directTopicAnswer}${modeNote}`,
      providerUsed: engineLabel,
      proposedChange: config.mode === 'mentor' ? undefined : proposedChange,
      codeSnippet,
      autoApply: config.mode === 'solver' && Boolean(proposedChange)
    };
  }

  // 4.2 Revisión general / código / diagnóstico del diagrama cuando el usuario pide opinión o revisión abierta
  const topFinding = audit.findings[0];
  let roleSpecificAnalysis = '';

  if (askingUser.role === 'Analista') {
    roleSpecificAnalysis =
      `Si lo revisamos desde negocio, **${shortName}**, en **${model.name}** ya cubrimos ${model.entities.map(e => `\`${e.name}\``).join(', ')} con **${model.functionalDependencies?.length || 0} dependencias funcionales**.\n\n` +
      `${topFinding ? `Lo que sí mejoraría es esto: ${topFinding.detail}` : 'El dominio base se ve bien cubierto; si quieres refinar algo, dime qué clase o regla de negocio quieres validar.'}`;
  } else if (askingUser.role === 'Diseñador') {
    roleSpecificAnalysis =
      `A nivel de diseño relacional, **${shortName}**:\n` +
      `• **PKs / 1FN:** ${audit.entitiesWithoutPK.length === 0 ? 'Todas las tablas tienen PK definida ✅.' : `Ojo: falta PK en ${audit.entitiesWithoutPK.map(e => e.name).join(', ')}.`}\n` +
      `• **Relaciones y FKs:** ${
        audit.nmRelationships.length > 0
          ? `Hay ${audit.nmRelationships.length} relación(es) \`N:M\` (${audit.nmRelationships.map(n => `${n.source?.name} ↔ ${n.target?.name}`).join(', ')}) que conviene bajar a tabla asociativa.`
          : 'Las cardinalidades `1:1` y `1:N` están limpias.'
      } ${audit.missingFKEntities.length > 0 ? `Faltan ${audit.missingFKEntities.length} FKs explícitas en las tablas hijas.` : ''}`;
  } else if (askingUser.role === 'Implementador') {
    const targetEnt = selectedEntity || model.entities[0];
    roleSpecificAnalysis =
      `Pensando ya en el backend, **${shortName}**:\n` +
      `• Para **${targetEnt?.name || 'las entidades'}**, el mapeo con Spring Boot JPA y PostgreSQL sale limpio con \`@ManyToOne(fetch = FetchType.LAZY)\` y te dejé abajo un avance de \`${targetEnt?.name || 'Entidad'}.java\`.\n` +
      `• Acuérdate de indexar las FKs (\`${targetEnt?.attributes.filter(a => a.isForeignKey || a.isUnique).map(a => a.name).join(', ') || 'id'}\`) para no penalizar los \`JOIN\`.`;
  } else {
    roleSpecificAnalysis =
      `Echándole un vistazo general a **${model.name}** (fase **${model.status || 'Diseño'}**, v${model.version}), **${shortName}**:\n` +
      `${
        audit.findings.length > 0
          ? `Detecté ${audit.findings.length} punto(s) que vale la pena pulir: ${audit.findings.map(f => f.title).join('; ')}.`
          : `Las ${model.entities.length} clases y ${model.relationships.length} relaciones están consistentes.`
      }\n\nSi quieres que revise una clase puntual, atributos que falten, normalización o cómo quedaría en SQL/Java, pregúntame directo por esa parte.`;
  }

  let modeFooter = '';
  if (config.mode === 'solver' && proposedChange) {
    modeFooter = `\n\n⚡ Ya apliqué el ajuste directo al diagrama (${proposedChange.summary}) para que sigamos avanzando.`;
  } else if (proposedChange && config.mode !== 'mentor') {
    modeFooter = `\n\n✨ Ya te armé la solución (*${proposedChange.summary}*) abajo por si quieres aplicarla con un clic.`;
  }

  return {
    text: `${roleSpecificAnalysis}${modeFooter}`,
    providerUsed: engineLabel,
    proposedChange: config.mode === 'mentor' ? undefined : proposedChange,
    codeSnippet,
    autoApply: config.mode === 'solver' && Boolean(proposedChange)
  };
}
