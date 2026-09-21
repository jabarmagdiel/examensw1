import { Attribute, Cardinality, DataType, DiagramModel, Entity, FunctionalDependency, Relationship, VoiceCommandQueueItem } from '../types/case';

// Almacenamiento local para la cola offline del móvil
const OFFLINE_QUEUE_KEY = 'caseai_mobile_offline_voice_queue';

export function getOfflineVoiceQueue(): VoiceCommandQueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineVoiceQueue(queue: VoiceCommandQueueItem[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error guardando cola de voz offline', e);
  }
}

export function enqueueVoiceCommand(transcript: string): VoiceCommandQueueItem {
  const queue = getOfflineVoiceQueue();
  const newItem: VoiceCommandQueueItem = {
    id: `vcmd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    transcript,
    timestamp: Date.now(),
    status: 'pending'
  };
  queue.push(newItem);
  saveOfflineVoiceQueue(queue);
  return newItem;
}

function parseDataType(typeStr?: string): DataType {
  if (!typeStr) return 'VARCHAR';
  const lower = typeStr.toLowerCase();
  if (lower.includes('entero') || lower.includes('int') || lower.includes('numero') || lower.includes('id')) return 'BIGINT';
  if (lower.includes('decimal') || lower.includes('precio') || lower.includes('monto') || lower.includes('total') || lower.includes('double') || lower.includes('float')) return 'DECIMAL';
  if (lower.includes('fecha') || lower.includes('date')) return 'DATE';
  if (lower.includes('hora') || lower.includes('timestamp') || lower.includes('tiempo')) return 'TIMESTAMP';
  if (lower.includes('booleano') || lower.includes('bool') || lower.includes('activo') || lower.includes('estado')) return 'BOOLEAN';
  if (lower.includes('texto largo') || lower.includes('descripcion') || lower.includes('text')) return 'TEXT';
  return 'VARCHAR';
}

function stripAccents(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function cleanIdentifier(str: string): string {
  if (!str) return '';
  return stripAccents(str)
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '');
}

export interface VoiceCommandGuideItem {
  action: string;
  syntax: string;
  parameters: string;
  example: string;
}

export const VOICE_COMMANDS_GUIDE: VoiceCommandGuideItem[] = [
  {
    action: 'Crear Tabla',
    syntax: 'Crear tabla <Nombre>',
    parameters: '<Nombre>: Nombre de la clase (ej: Proveedor, Factura)',
    example: 'Crear tabla Proveedor'
  },
  {
    action: 'Crear con Campos',
    syntax: 'Crear tabla <Nombre> con <Campo1> y <Campo2>',
    parameters: '<Nombre>, lista de campos separados por "y" o coma',
    example: 'Crear tabla Factura con total y fecha'
  },
  {
    action: 'Añadir Atributo',
    syntax: 'Añadir atributo <Campo> a <Tabla>',
    parameters: '<Campo>: nombre del atributo, <Tabla>: entidad destino',
    example: 'Añadir atributo telefono a Proveedor'
  },
  {
    action: 'Añadir con Tipo',
    syntax: 'Añadir <Campo> de tipo <Tipo> a <Tabla>',
    parameters: '<Tipo>: texto, entero, decimal, fecha, booleano',
    example: 'Añadir precio de tipo decimal a Producto'
  },
  {
    action: 'Editar Atributo',
    syntax: 'Editar atributo <Actual> a <Nuevo> en <Tabla>',
    parameters: '<Actual>: nombre actual, <Nuevo>: nuevo nombre, <Tabla>: entidad',
    example: 'Editar atributo telefono a celular en Proveedor'
  },
  {
    action: 'Cambiar Tipo',
    syntax: 'Cambiar tipo de <Campo> a <NuevoTipo> en <Tabla>',
    parameters: '<Campo>: atributo, <NuevoTipo>: tipo dato, <Tabla>: entidad',
    example: 'Cambiar tipo de precio a decimal en Producto'
  },
  {
    action: 'Eliminar Atributo',
    syntax: 'Eliminar atributo <Campo> en <Tabla>',
    parameters: '<Campo>: nombre a borrar, <Tabla>: entidad',
    example: 'Eliminar atributo direccion en Proveedor'
  },
  {
    action: 'Relacionar Tablas',
    syntax: 'Relacionar <Origen> con <Destino> [de 1 a muchos]',
    parameters: '<Origen>: tabla 1, <Destino>: tabla 2, cardinalidad opcional',
    example: 'Relacionar Proveedor con Producto de uno a muchos'
  },
  {
    action: 'Clave Primaria (PK)',
    syntax: 'Hacer <Campo> clave primaria en <Tabla>',
    parameters: '<Campo>: atributo que será PK, <Tabla>: entidad',
    example: 'Hacer codigo clave primaria en Proveedor'
  },
  {
    action: 'Eliminar Tabla',
    syntax: 'Eliminar tabla <Nombre>',
    parameters: '<Nombre>: nombre de la entidad a remover',
    example: 'Eliminar tabla Factura'
  }
];

/**
 * MOTOR DE GRAFICADO POR VOZ EN TIEMPO REAL:
 * Interpreta instrucciones granulares para manipular directamente el diagrama sobre el canvas.
 */
export function executeVoiceCommand(
  transcript: string,
  model: DiagramModel
): {
  model: DiagramModel;
  summary: string;
  actionType: 'ADD_ENTITY' | 'ADD_ATTRIBUTE' | 'SET_PK' | 'ADD_RELATIONSHIP' | 'DELETE_ENTITY' | 'GENERATE_DOMAIN' | 'UNKNOWN';
} {
  const rawText = transcript.trim().replace(/[.,;!?]+$/, '');
  const cleanText = stripAccents(rawText).toLowerCase();
  const entities = [...model.entities.map(e => ({ ...e, attributes: [...e.attributes] }))];
  const relationships = [...model.relationships];
  const functionalDependencies = [...model.functionalDependencies];

  // 1. COMANDO: Editar o Renombrar Atributo
  // Ej: "editar atributo telefono a celular en Proveedor", "cambiar atributo nombre a razon_social en Proveedor"
  const editAttrMatch = cleanText.match(/(?:editar|cambiar|modificar|renombrar)\s+(?:el\s+)?(?:atributo|campo|columna)?\s*([a-zA-Z0-9_]+)\s+(?:a|por)\s+([a-zA-Z0-9_]+)\s+(?:en|de|para)\s+(?:la\s+)?(?:entidad\s+|clase\s+|tabla\s+)?([a-zA-Z0-9_]+)/i);
  if (editAttrMatch) {
    const oldAttrName = cleanIdentifier(editAttrMatch[1]).toLowerCase();
    const newAttrName = cleanIdentifier(editAttrMatch[2]).toLowerCase();
    const entityName = editAttrMatch[3].toLowerCase();

    const targetEntity = entities.find(e => stripAccents(e.name).toLowerCase() === entityName);
    if (!targetEntity) {
      return {
        model,
        summary: `No se encontró la tabla "${editAttrMatch[3]}" para editar el atributo.`,
        actionType: 'UNKNOWN'
      };
    }

    const attr = targetEntity.attributes.find(a => cleanIdentifier(a.name).toLowerCase() === oldAttrName);
    if (!attr) {
      return {
        model,
        summary: `No se encontró el atributo "${oldAttrName}" en la tabla ${targetEntity.name}.`,
        actionType: 'UNKNOWN'
      };
    }

    attr.name = newAttrName;
    return {
      model: { ...model, entities, updatedAt: Date.now() },
      summary: `Atributo "${oldAttrName}" renombrado exitosamente a "${newAttrName}" en ${targetEntity.name}.`,
      actionType: 'ADD_ATTRIBUTE'
    };
  }

  // 2. COMANDO: Cambiar Tipo de Atributo
  // Ej: "cambiar tipo de precio a decimal en Producto", "cambiar tipo de telefono a varchar en Proveedor"
  const changeTypeMatch = cleanText.match(/cambiar\s+tipo\s+(?:de\s+)?(?:el\s+)?(?:atributo|campo)?\s*([a-zA-Z0-9_]+)\s+a\s+([a-zA-Z0-9_]+)\s+(?:en|de|para)\s+(?:la\s+)?(?:entidad\s+|clase\s+|tabla\s+)?([a-zA-Z0-9_]+)/i);
  if (changeTypeMatch) {
    const attrName = cleanIdentifier(changeTypeMatch[1]).toLowerCase();
    const newTypeStr = changeTypeMatch[2].toLowerCase();
    const entityName = changeTypeMatch[3].toLowerCase();

    const targetEntity = entities.find(e => stripAccents(e.name).toLowerCase() === entityName);
    if (targetEntity) {
      const attr = targetEntity.attributes.find(a => cleanIdentifier(a.name).toLowerCase() === attrName);
      if (attr) {
        attr.type = parseDataType(newTypeStr);
        return {
          model: { ...model, entities, updatedAt: Date.now() },
          summary: `Tipo del atributo "${attr.name}" actualizado a ${attr.type} en ${targetEntity.name}.`,
          actionType: 'ADD_ATTRIBUTE'
        };
      }
    }
  }

  // 3. COMANDO: Eliminar Atributo
  // Ej: "eliminar atributo telefono en Proveedor", "borrar campo direccion de Cliente"
  const delAttrMatch = cleanText.match(/(?:eliminar|borrar|quitar)\s+(?:el\s+)?(?:atributo|campo|columna)\s+([a-zA-Z0-9_]+)\s+(?:de|en|para)\s+(?:la\s+)?(?:entidad\s+|clase\s+|tabla\s+)?([a-zA-Z0-9_]+)/i);
  if (delAttrMatch) {
    const attrName = cleanIdentifier(delAttrMatch[1]).toLowerCase();
    const entityName = delAttrMatch[2].toLowerCase();

    const targetEntity = entities.find(e => stripAccents(e.name).toLowerCase() === entityName);
    if (!targetEntity) {
      return {
        model,
        summary: `No se encontró la tabla "${delAttrMatch[2]}" para eliminar el atributo.`,
        actionType: 'UNKNOWN'
      };
    }

    const initialCount = targetEntity.attributes.length;
    targetEntity.attributes = targetEntity.attributes.filter(a => cleanIdentifier(a.name).toLowerCase() !== attrName);

    if (targetEntity.attributes.length === initialCount) {
      return {
        model,
        summary: `No se encontró el atributo "${attrName}" en ${targetEntity.name}.`,
        actionType: 'UNKNOWN'
      };
    }

    return {
      model: { ...model, entities, updatedAt: Date.now() },
      summary: `Atributo "${attrName}" eliminado de ${targetEntity.name}.`,
      actionType: 'ADD_ATTRIBUTE'
    };
  }

  // 4. COMANDO: Añadir Atributo a Entidad
  // Acepta: "añadir atributo teléfono a proveedor", "agregar campo precio de tipo decimal a Producto", "poner telefono en Cliente", "añadir telefono a proveedor"
  const addAttrMatch = cleanText.match(/(?:agrega(?:r)?|anad(?:ir|e)|crea(?:r)?|inserta(?:r)?|pon(?:er)?)\s+(?:el\s+)?(?:atributo|campo|propiedad|columna)?\s*([a-zA-Z0-9_]+)(?:\s+de\s+tipo\s+([a-zA-Z0-9_]+))?\s+(?:a|en|para)\s+(?:la\s+)?(?:entidad\s+|clase\s+|tabla\s+)?([a-zA-Z0-9_]+)/i);

  if (addAttrMatch) {
    const rawAttrName = addAttrMatch[1];
    const typeStr = addAttrMatch[2];
    const rawEntityName = addAttrMatch[3];
    const attrName = cleanIdentifier(rawAttrName).toLowerCase();
    const entityName = rawEntityName.toLowerCase();

    // Buscar entidad coincidente (ignorando acentos y mayúsculas)
    let targetEntity = entities.find(e => stripAccents(e.name).toLowerCase() === entityName);

    if (!targetEntity) {
      // Auto-crear la entidad si no existe previamente
      const cleanEntityTitle = rawEntityName.charAt(0).toUpperCase() + rawEntityName.slice(1);
      const inferredType = parseDataType(typeStr || attrName);
      targetEntity = {
        id: `ent_${Date.now()}`,
        name: cleanEntityTitle,
        tableName: cleanEntityTitle.toLowerCase() + 's',
        x: 120 + (entities.length % 3) * 280,
        y: 120 + Math.floor(entities.length / 3) * 240,
        attributes: [
          { id: `attr_${Date.now()}_id`, name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { id: `attr_${Date.now()}_attr`, name: attrName, type: inferredType, isPrimaryKey: false, isNullable: true }
        ]
      };
      entities.push(targetEntity);

      return {
        model: { ...model, entities, updatedAt: Date.now() },
        summary: `Se creó la clase "${cleanEntityTitle}" y se añadió el atributo "${attrName}" (${inferredType}).`,
        actionType: 'ADD_ENTITY'
      };
    }

    // Si ya existe la entidad, verificar si el atributo existe
    const existingAttr = targetEntity.attributes.find(a => cleanIdentifier(a.name).toLowerCase() === attrName);
    if (existingAttr) {
      return {
        model,
        summary: `El atributo "${attrName}" ya existe en la entidad ${targetEntity.name}.`,
        actionType: 'UNKNOWN'
      };
    }

    const inferredType = parseDataType(typeStr || attrName);
    targetEntity.attributes.push({
      id: `attr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: attrName,
      type: inferredType,
      isPrimaryKey: false,
      isNullable: true
    });

    const updatedModel: DiagramModel = {
      ...model,
      entities,
      updatedAt: Date.now()
    };

    return {
      model: updatedModel,
      summary: `Atributo "${attrName}" (${inferredType}) añadido exitosamente a la clase ${targetEntity.name}.`,
      actionType: 'ADD_ATTRIBUTE'
    };
  }

  // 5. COMANDO: Establecer Clave Primaria (PK)
  const pkMatch = cleanText.match(/(?:hacer\s+que|poner|marcar)\s+([a-zA-Z0-9_]+)\s+como\s+(?:clave|llave)\s+primaria\s+en\s+(?:la\s+)?(?:entidad\s+|clase\s+|tabla\s+)?([a-zA-Z0-9_]+)/i) ||
                  cleanText.match(/hacer\s+([a-zA-Z0-9_]+)\s+(?:clave|llave)\s+primaria\s+en\s+(?:la\s+)?(?:entidad\s+|clase\s+|tabla\s+)?([a-zA-Z0-9_]+)/i);
  if (pkMatch) {
    const attrName = cleanIdentifier(pkMatch[1]).toLowerCase();
    const entityName = pkMatch[2].toLowerCase();

    const target = entities.find(e => stripAccents(e.name).toLowerCase() === entityName);
    if (target) {
      const attr = target.attributes.find(a => cleanIdentifier(a.name).toLowerCase() === attrName);
      if (attr) {
        attr.isPrimaryKey = true;
        attr.isNullable = false;
        return {
          model: { ...model, entities, updatedAt: Date.now() },
          summary: `El atributo "${attr.name}" ahora es Clave Primaria (PK) de ${target.name}.`,
          actionType: 'SET_PK'
        };
      }
    }
  }

  // 6. COMANDO: Crear Relación entre Dos Entidades
  const relMatch = cleanText.match(/(?:crear?\s+relacion|relacionar|conectar)(?:\s+de\s+(uno\s+a\s+uno|uno\s+a\s+muchos|muchos\s+a\s+muchos))?\s+(?:entre\s+)?(?:la\s+)?(?:entidad\s+|clase\s+|tabla\s+)?([a-zA-Z0-9_]+)\s+(?:y|con)\s+(?:la\s+)?(?:entidad\s+|clase\s+|tabla\s+)?([a-zA-Z0-9_]+)/i);
  if (relMatch) {
    const cardStr = (relMatch[1] || '').toLowerCase();
    const srcName = relMatch[2].toLowerCase();
    const tgtName = relMatch[3].toLowerCase();

    const src = entities.find(e => stripAccents(e.name).toLowerCase() === srcName);
    const tgt = entities.find(e => stripAccents(e.name).toLowerCase() === tgtName);

    if (src && tgt) {
      let cardinality: Cardinality = '1:N';
      if (cardStr.includes('uno a uno')) cardinality = '1:1';
      else if (cardStr.includes('muchos a muchos')) cardinality = 'N:M';

      const newRel: Relationship = {
        id: `rel_${Date.now()}`,
        name: 'relaciona',
        sourceEntityId: src.id,
        targetEntityId: tgt.id,
        cardinality
      };

      relationships.push(newRel);

      return {
        model: { ...model, entities, relationships, updatedAt: Date.now() },
        summary: `Relación graficada: ${src.name} (${cardinality}) → ${tgt.name}.`,
        actionType: 'ADD_RELATIONSHIP'
      };
    }
  }

  // 7. COMANDO: Eliminar Entidad / Tabla
  const delEntityMatch = cleanText.match(/(?:eliminar|borrar|quitar)\s+(?:la\s+)?(?:entidad|clase|tabla)\s+([a-zA-Z0-9_]+)/i);
  if (delEntityMatch) {
    const entName = delEntityMatch[1].toLowerCase();
    const target = entities.find(e => stripAccents(e.name).toLowerCase() === entName);
    if (target) {
      const filteredEntities = entities.filter(e => e.id !== target.id);
      const filteredRels = relationships.filter(r => r.sourceEntityId !== target.id && r.targetEntityId !== target.id);
      return {
        model: { ...model, entities: filteredEntities, relationships: filteredRels, updatedAt: Date.now() },
        summary: `Se eliminó la entidad "${target.name}" y sus relaciones del diagrama.`,
        actionType: 'DELETE_ENTITY'
      };
    }
  }

  // 8. COMANDO: Crear Nueva Entidad / Clase
  const addEntityMatch = cleanText.match(/(?:crear?|agrega(?:r)?|anad(?:ir|e)|inserta(?:r)?)\s+(?:la\s+)?(?:entidad|clase|tabla)\s+([a-zA-Z0-9_]+)(?:\s+(?:con\s+atributos?|con\s+campos?|con)\s+(.+))?/i);
  if (addEntityMatch) {
    const rawName = addEntityMatch[1];
    const entityName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const existing = entities.find(e => stripAccents(e.name).toLowerCase() === entityName.toLowerCase());

    if (!existing) {
      const newEntity: Entity = {
        id: `ent_${Date.now()}`,
        name: entityName,
        tableName: entityName.toLowerCase() + 's',
        x: 120 + (entities.length % 3) * 280,
        y: 120 + Math.floor(entities.length / 3) * 240,
        attributes: [
          { id: `attr_${Date.now()}_id`, name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false }
        ]
      };

      if (addEntityMatch[2]) {
        const rawAttrs = addEntityMatch[2].split(/,| y | e /);
        rawAttrs.forEach((raw, idx) => {
          const clean = cleanIdentifier(raw).toLowerCase();
          if (clean && clean !== 'id') {
            newEntity.attributes.push({
              id: `attr_${Date.now()}_${idx}`,
              name: clean,
              type: parseDataType(clean),
              isPrimaryKey: false,
              isNullable: true
            });
          }
        });
      } else {
        newEntity.attributes.push({
          id: `attr_${Date.now()}_nom`,
          name: 'nombre',
          type: 'VARCHAR',
          isPrimaryKey: false,
          isNullable: false
        });
      }

      entities.push(newEntity);

      return {
        model: { ...model, entities, updatedAt: Date.now() },
        summary: `Clase "${entityName}" graficada exitosamente en el lienzo con ${newEntity.attributes.length} atributos.`,
        actionType: 'ADD_ENTITY'
      };
    } else {
      return {
        model,
        summary: `La clase "${entityName}" ya existe en el diagrama.`,
        actionType: 'UNKNOWN'
      };
    }
  }

  // 9. COMANDO: Plantillas completas (Solo si se pide EXPLÍCITAMENTE la plantilla completa)
  if (cleanText.includes('generar plantilla') || cleanText.includes('cargar plantilla') || cleanText.includes('cargar ejemplo completo')) {
    if (cleanText.includes('veterinaria')) {
      const res = createVeterinariaDomain();
      return {
        model: { ...model, entities: res.entities, relationships: res.relationships, functionalDependencies: res.functionalDependencies, updatedAt: Date.now() },
        summary: res.summary,
        actionType: 'GENERATE_DOMAIN'
      };
    }
    if (cleanText.includes('farmacia')) {
      const res = createFarmaciaDomain();
      return {
        model: { ...model, entities: res.entities, relationships: res.relationships, functionalDependencies: res.functionalDependencies, updatedAt: Date.now() },
        summary: res.summary,
        actionType: 'GENERATE_DOMAIN'
      };
    }
    if (cleanText.includes('tienda') || cleanText.includes('e-commerce') || cleanText.includes('comercio')) {
      const res = createEcommerceDomain();
      return {
        model: { ...model, entities: res.entities, relationships: res.relationships, functionalDependencies: res.functionalDependencies, updatedAt: Date.now() },
        summary: res.summary,
        actionType: 'GENERATE_DOMAIN'
      };
    }
  }

  return {
    model,
    summary: `No entendí el comando "${transcript}". Di por ejemplo: "Crear tabla Proveedor", "Añadir atributo telefono a Proveedor", o "Editar atributo telefono a celular en Proveedor".`,
    actionType: 'UNKNOWN'
  };
}

/**
 * Motor de IA para procesar descripciones en lenguaje natural
 */
export function processNaturalLanguagePrompt(
  prompt: string,
  currentModel?: DiagramModel
): {
  entities: Entity[];
  relationships: Relationship[];
  functionalDependencies: FunctionalDependency[];
  summary: string;
} {
  const p = prompt.toLowerCase();
  const baseModel: DiagramModel = currentModel || {
    id: 'base_1',
    name: 'Modelo Base',
    entities: [],
    relationships: [],
    functionalDependencies: [],
    updatedAt: Date.now(),
    version: 1
  };

  const result = executeVoiceCommand(prompt, baseModel);
  return {
    entities: result.model.entities,
    relationships: result.model.relationships,
    functionalDependencies: result.model.functionalDependencies,
    summary: result.summary
  };
}

/**
 * Genera el dominio del sistema de Farmacia
 */
function createFarmaciaDomain(): {
  entities: Entity[];
  relationships: Relationship[];
  functionalDependencies: FunctionalDependency[];
  summary: string;
} {
  const medId = 'ent_medicamento';
  const provId = 'ent_proveedor';
  const lotId = 'ent_lote';
  const venId = 'ent_venta';

  const entities: Entity[] = [
    {
      id: provId,
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
      id: medId,
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
      id: lotId,
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
      id: venId,
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
  ];

  const relationships: Relationship[] = [
    { id: 'rel_pr_m', name: 'suministra', sourceEntityId: provId, targetEntityId: medId, cardinality: '1:N' },
    { id: 'rel_m_l', name: 'clasifica', sourceEntityId: medId, targetEntityId: lotId, cardinality: '1:N' },
    { id: 'rel_m_v', name: 'incluye', sourceEntityId: medId, targetEntityId: venId, cardinality: 'N:M' }
  ];

  const functionalDependencies: FunctionalDependency[] = [
    { id: 'fd_pr1', determinant: ['nit'], dependent: ['razonSocial', 'telefono'] },
    { id: 'fd_m1', determinant: ['codigoBarras'], dependent: ['nombreComercial', 'principioActivo', 'precio'] }
  ];

  return {
    entities,
    relationships,
    functionalDependencies,
    summary: 'Se graficó el sistema de Farmacia con 4 entidades (Proveedor, Medicamento, Lote, Venta) y sus relaciones.'
  };
}

/**
 * Genera el dominio del sistema de Veterinaria (Escenario explícito del examen)
 */
function createVeterinariaDomain(): {
  entities: Entity[];
  relationships: Relationship[];
  functionalDependencies: FunctionalDependency[];
  summary: string;
} {
  const clienteId = 'ent_cliente';
  const pacienteId = 'ent_paciente';
  const veterinarioId = 'ent_veterinario';
  const citaId = 'ent_cita';
  const historialId = 'ent_historial';

  const entities: Entity[] = [
    {
      id: clienteId,
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
      id: pacienteId,
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
      id: veterinarioId,
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
      id: citaId,
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
      id: historialId,
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
  ];

  const relationships: Relationship[] = [
    {
      id: 'rel_cli_mas',
      name: 'posee',
      sourceEntityId: clienteId,
      targetEntityId: pacienteId,
      cardinality: '1:N'
    },
    {
      id: 'rel_mas_cit',
      name: 'agenda',
      sourceEntityId: pacienteId,
      targetEntityId: citaId,
      cardinality: '1:N'
    },
    {
      id: 'rel_vet_cit',
      name: 'atiende',
      sourceEntityId: veterinarioId,
      targetEntityId: citaId,
      cardinality: '1:N'
    },
    {
      id: 'rel_mas_his',
      name: 'registra',
      sourceEntityId: pacienteId,
      targetEntityId: historialId,
      cardinality: '1:1'
    }
  ];

  const functionalDependencies: FunctionalDependency[] = [
    { id: 'fd_cli_1', determinant: ['dni'], dependent: ['nombreCompleto', 'telefono', 'direccion'] },
    { id: 'fd_vet_1', determinant: ['matricula'], dependent: ['nombre', 'especialidad'] },
    { id: 'fd_mas_1', determinant: ['id'], dependent: ['nombre', 'especie', 'raza', 'fechaNacimiento', 'cliente_id'] }
  ];

  return {
    entities,
    relationships,
    functionalDependencies,
    summary: 'Se generó exitosamente el modelo de datos de Veterinaria con 5 entidades (Cliente, Mascota, Veterinario, CitaMedica, HistorialClinico) y sus 4 relaciones.'
  };
}

function createEcommerceDomain(): {
  entities: Entity[];
  relationships: Relationship[];
  functionalDependencies: FunctionalDependency[];
  summary: string;
} {
  const usrId = 'ent_usr';
  const prodId = 'ent_prod';
  const ordId = 'ent_ord';
  const detId = 'ent_det';

  const entities: Entity[] = [
    {
      id: usrId,
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
      id: prodId,
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
      id: ordId,
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
      id: detId,
      name: 'DetallePedido',
      tableName: 'detalles_pedidos',
      x: 420,
      y: 360,
      attributes: [
        { id: 'd_1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
        { id: 'd_2', name: 'cantidad', type: 'INTEGER', isPrimaryKey: false, isNullable: false },
        { id: 'd_3', name: 'precioUnitario', type: 'DECIMAL', isPrimaryKey: false, isNullable: false },
        { id: 'd_4', name: 'pedido_id', type: 'BIGINT', isPrimaryKey: false, isForeignKey: true, isNullable: false },
        { id: 'd_5', name: 'producto_id', type: 'BIGINT', isPrimaryKey: false, isForeignKey: true, isNullable: false }
      ]
    }
  ];

  const relationships: Relationship[] = [
    { id: 'rel_u_o', name: 'realiza', sourceEntityId: usrId, targetEntityId: ordId, cardinality: '1:N' },
    { id: 'rel_o_d', name: 'contiene', sourceEntityId: ordId, targetEntityId: detId, cardinality: '1:N' },
    { id: 'rel_p_d', name: 'referencia', sourceEntityId: prodId, targetEntityId: detId, cardinality: '1:N' }
  ];

  const functionalDependencies: FunctionalDependency[] = [
    { id: 'fd_u1', determinant: ['email'], dependent: ['nombre'] },
    { id: 'fd_p1', determinant: ['sku'], dependent: ['precio'] }
  ];

  return {
    entities,
    relationships,
    functionalDependencies,
    summary: 'Se generó el modelo E-Commerce (Usuario, Producto, Pedido, DetallePedido).'
  };
}

/**
 * Simula y procesa la foto del diagrama (Visión IA)
 */
export async function processDiagramPhoto(imageDataUrl: string): Promise<{
  entities: Entity[];
  relationships: Relationship[];
  summary: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const entA: Entity = {
    id: `photo_ent_${Date.now()}_1`,
    name: 'Paciente',
    tableName: 'pacientes',
    x: 100,
    y: 120,
    attributes: [
      { id: 'p1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
      { id: 'p2', name: 'nombre', type: 'VARCHAR', isPrimaryKey: false, isNullable: false },
      { id: 'p3', name: 'historia_clinica', type: 'VARCHAR', isPrimaryKey: false, isNullable: false }
    ]
  };

  const entB: Entity = {
    id: `photo_ent_${Date.now()}_2`,
    name: 'Doctor',
    tableName: 'doctores',
    x: 480,
    y: 120,
    attributes: [
      { id: 'd1', name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
      { id: 'd2', name: 'nombre', type: 'VARCHAR', isPrimaryKey: false, isNullable: false },
      { id: 'd3', name: 'colegiatura', type: 'VARCHAR', isPrimaryKey: false, isNullable: false }
    ]
  };

  const rel: Relationship = {
    id: `photo_rel_${Date.now()}`,
    name: 'consulta',
    sourceEntityId: entB.id,
    targetEntityId: entA.id,
    cardinality: '1:N'
  };

  return {
    entities: [entA, entB],
    relationships: [rel],
    summary: 'Visión IA reconoció exitosamente 2 entidades (Paciente y Doctor) con sus atributos y relación 1:N.'
  };
}
