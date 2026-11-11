import { Attribute, Cardinality, DataType, DiagramModel, Entity, FunctionalDependency, Relationship, RelationshipType, VoiceCommandQueueItem } from '../types/case';

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
 * Busca una entidad por nombre tolerando mayúsculas, acentos, plurales o tableName.
 */
export function findEntityFlexible(searchName: string, entities: Entity[]): Entity | undefined {
  const norm = stripAccents(searchName).trim().toLowerCase();
  let found = entities.find(e => stripAccents(e.name).toLowerCase() === norm || (e.tableName && stripAccents(e.tableName).toLowerCase() === norm));
  if (found) return found;

  const singular = norm.endsWith('es') ? norm.slice(0, -2) : norm.endsWith('s') ? norm.slice(0, -1) : norm;
  found = entities.find(e => {
    const eNorm = stripAccents(e.name).toLowerCase();
    const eSingular = eNorm.endsWith('es') ? eNorm.slice(0, -2) : eNorm.endsWith('s') ? eNorm.slice(0, -1) : eNorm;
    return eNorm === singular || eSingular === singular || eSingular === norm || eNorm === norm + 's' || eNorm === norm + 'es';
  });
  return found;
}

/**
 * Busca un atributo dentro de una entidad tolerando mayúsculas, acentos y plurales.
 */
export function findAttributeFlexible(searchName: string, attributes: Attribute[]): Attribute | undefined {
  const norm = cleanIdentifier(stripAccents(searchName)).toLowerCase();
  let found = attributes.find(a => cleanIdentifier(stripAccents(a.name)).toLowerCase() === norm);
  if (found) return found;

  const singular = norm.endsWith('es') ? norm.slice(0, -2) : norm.endsWith('s') ? norm.slice(0, -1) : norm;
  return attributes.find(a => {
    const aNorm = cleanIdentifier(stripAccents(a.name)).toLowerCase();
    const aSingular = aNorm.endsWith('es') ? aNorm.slice(0, -2) : aNorm.endsWith('s') ? aNorm.slice(0, -1) : aNorm;
    return aNorm === singular || aSingular === singular || aSingular === norm || aNorm === norm + 's' || aNorm === norm + 'es';
  });
}

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
  // Ej: "editar atributo telefono a celular en Proveedor", "cambiar atributo nombre a razon_social en Proveedor", "modificar campo costo por precio en Proveedor"
  const editAttrMatch = cleanText.match(/(?:editar|cambiar|modificar|renombrar)\s+(?:el\s+|la\s+)?(?:nombre\s+de\s+|nombre\s+del\s+)?(?:atributo|campo|columna)?\s*([a-zA-Z0-9_]+)\s+(?:a|por)\s+([a-zA-Z0-9_]+)\s+(?:en|de|para)\s+(?:la\s+|el\s+)?(?:entidad\s+|clase\s+|tabla\s+)?([a-zA-Z0-9_]+)/i);
  if (editAttrMatch) {
    const oldAttrName = cleanIdentifier(editAttrMatch[1]).toLowerCase();
    const newAttrName = cleanIdentifier(editAttrMatch[2]).toLowerCase();
    const entityName = editAttrMatch[3].toLowerCase();

    const targetEntity = findEntityFlexible(entityName, entities);
    if (!targetEntity) {
      return {
        model,
        summary: `No se encontró la tabla "${editAttrMatch[3]}" para editar el atributo.`,
        actionType: 'UNKNOWN'
      };
    }

    const attr = findAttributeFlexible(oldAttrName, targetEntity.attributes);
    if (!attr) {
      return {
        model,
        summary: `No se encontró el atributo "${oldAttrName}" en la tabla ${targetEntity.name}.`,
        actionType: 'UNKNOWN'
      };
    }

    const prevName = attr.name;
    attr.name = newAttrName;
    return {
      model: { ...model, entities, updatedAt: Date.now() },
      summary: `Atributo "${prevName}" renombrado exitosamente a "${newAttrName}" en ${targetEntity.name}.`,
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

    const targetEntity = findEntityFlexible(entityName, entities);
    if (targetEntity) {
      const attr = findAttributeFlexible(attrName, targetEntity.attributes);
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
  // Acepta: "eliminar atributo telefono en Proveedor", "borrar campo direccion de Cliente",
  // "eliminar de la tabla Proveedor el atributo telefono", "eliminar telefono de Proveedor", "borrar email en Cliente"
  const delAttrInvMatch = cleanText.match(/(?:eliminar|borrar|quitar|remover)\s+(?:de|en|para)\s+(?:la\s+|el\s+)?(?:entidad\s+|clase\s+|tabla\s+)?(?:de\s+)?([a-zA-Z0-9_]+)\s+(?:el\s+|la\s+)?(?:atributo|campo|columna)?\s*([a-zA-Z0-9_]+)/i);
  const delAttrStdMatch = cleanText.match(/(?:eliminar|borrar|quitar|remover)\s+(?:el\s+|la\s+)?(?:atributo|campo|columna)?\s*([a-zA-Z0-9_]+)\s+(?:de|en|para)\s+(?:la\s+|el\s+)?(?:entidad\s+|clase\s+|tabla\s+)?(?:de\s+)?([a-zA-Z0-9_]+)/i);

  let rawDelAttr: string | null = null;
  let rawDelEntity: string | null = null;

  if (delAttrInvMatch && !['tabla', 'entidad', 'clase'].includes(delAttrInvMatch[2])) {
    rawDelEntity = delAttrInvMatch[1];
    rawDelAttr = delAttrInvMatch[2];
  } else if (delAttrStdMatch && !['tabla', 'entidad', 'clase'].includes(delAttrStdMatch[1])) {
    rawDelAttr = delAttrStdMatch[1];
    rawDelEntity = delAttrStdMatch[2];
  }

  if (rawDelAttr && rawDelEntity) {
    const targetEntity = findEntityFlexible(rawDelEntity, entities);
    if (!targetEntity) {
      return {
        model,
        summary: `No se encontró la tabla "${rawDelEntity}" para eliminar el atributo "${rawDelAttr}".`,
        actionType: 'UNKNOWN'
      };
    }

    const targetAttr = findAttributeFlexible(rawDelAttr, targetEntity.attributes);
    if (!targetAttr) {
      return {
        model,
        summary: `No se encontró el atributo "${rawDelAttr}" en la tabla ${targetEntity.name}.`,
        actionType: 'UNKNOWN'
      };
    }

    targetEntity.attributes = targetEntity.attributes.filter(a => a.id !== targetAttr.id);
    return {
      model: { ...model, entities, updatedAt: Date.now() },
      summary: `Atributo "${targetAttr.name}" eliminado exitosamente de la tabla ${targetEntity.name}.`,
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
  // Acepta: "eliminar tabla Proveedor", "borrar la tabla de proveedores", "quitar entidad Cliente", "eliminar clase Factura", "borrar Proveedor"
  const delEntityExplicitMatch = cleanText.match(/(?:eliminar|borrar|quitar|remover)\s+(?:la\s+|el\s+)?(?:entidad|clase|tabla)\s+(?:de\s+)?([a-zA-Z0-9_]+)/i);
  const delEntityDirectMatch = cleanText.match(/(?:eliminar|borrar|quitar|remover)\s+(?:la\s+|el\s+)?([a-zA-Z0-9_]+)/i);

  let rawTargetEntName: string | null = null;
  let isExplicitTableDelete = false;

  if (delEntityExplicitMatch) {
    rawTargetEntName = delEntityExplicitMatch[1];
    isExplicitTableDelete = true;
  } else if (delEntityDirectMatch) {
    const cand = delEntityDirectMatch[1];
    if (findEntityFlexible(cand, entities)) {
      rawTargetEntName = cand;
    }
  }

  if (rawTargetEntName) {
    const target = findEntityFlexible(rawTargetEntName, entities);
    if (!target) {
      if (isExplicitTableDelete) {
        return {
          model,
          summary: `No se encontró la tabla "${rawTargetEntName}" en el diagrama para eliminar.`,
          actionType: 'UNKNOWN'
        };
      }
    } else {
      const filteredEntities = entities.filter(e => e.id !== target.id);
      const filteredRels = relationships.filter(r => r.sourceEntityId !== target.id && r.targetEntityId !== target.id);
      return {
        model: { ...model, entities: filteredEntities, relationships: filteredRels, updatedAt: Date.now() },
        summary: `Se eliminó la tabla "${target.name}" y sus relaciones del diagrama.`,
        actionType: 'DELETE_ENTITY'
      };
    }
  }

  // 8. COMANDO: Crear Nueva Entidad / Clase
  const addEntityMatch = cleanText.match(
    /(?:crea(?:r|me)?|agrega(?:r|me|le)?|aumenta(?:r|me|le)?|anad(?:ir|e)|inserta(?:r)?|pon(?:er|me|le)?|genera(?:r)?)\s+(?:(?:la|una|el|un)\s+)?(?:entidad|clase|tabla)\s+(?:llamada\s+|llamado\s+|de\s+)?([a-zA-Z0-9_]+)(?:\s+(?:con\s+atributos?|con\s+campos?|con)\s+(.+))?/i
  );
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
export function createFarmaciaDomain(): {
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
export function createVeterinariaDomain(): {
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

export function createEcommerceDomain(): {
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
 * Procesa la foto del diagrama usando Google Gemini 1.5 Flash Vision (IA Real)
 * Requiere VITE_GEMINI_API_KEY en el archivo .env
 */
function buildParsedDiagramResult(
  parsed: {
    entities: Array<{
      name: string;
      tableName?: string;
      attributes: Array<{ name: string; type: string; isPrimaryKey?: boolean; isForeignKey?: boolean; isNullable?: boolean }>;
    }>;
    relationships: Array<{ sourceName: string; targetName: string; cardinality: string; type?: string; name: string }>;
    summary?: string;
  },
  fallbackLabel: string
): {
  entities: Entity[];
  relationships: Relationship[];
  summary: string;
} {
  const now = Date.now();
  const entityMap = new Map<string, string>();
  const entities: Entity[] = (parsed.entities ?? []).map((e, idx) => {
    const id = `photo_ent_${now}_${idx}`;
    entityMap.set(e.name, id);
    entityMap.set(e.name.toLowerCase(), id);
    const cols = 3;
    const x = 80 + (idx % cols) * 320;
    const y = 80 + Math.floor(idx / cols) * 230;
    return {
      id,
      name: e.name,
      tableName: e.tableName || e.name.toLowerCase().replace(/\s+/g, '_'),
      x,
      y,
      attributes: (e.attributes ?? []).map((a, ai) => ({
        id: `photo_attr_${now}_${idx}_${ai}`,
        name: a.name,
        type: (a.type as DataType) || 'VARCHAR',
        isPrimaryKey: a.isPrimaryKey ?? a.name.toLowerCase() === 'id',
        isForeignKey: a.isForeignKey ?? a.name.toLowerCase().endsWith('_id'),
        isNullable: a.isNullable ?? false
      }))
    };
  });

  const relationships: Relationship[] = (parsed.relationships ?? [])
    .filter(r => (entityMap.has(r.sourceName) || entityMap.has(r.sourceName.toLowerCase())) && (entityMap.has(r.targetName) || entityMap.has(r.targetName.toLowerCase())))
    .map((r, ri) => ({
      id: `photo_rel_${now}_${ri}`,
      name: r.name || `rel_${ri}`,
      sourceEntityId: (entityMap.get(r.sourceName) || entityMap.get(r.sourceName.toLowerCase()))!,
      targetEntityId: (entityMap.get(r.targetName) || entityMap.get(r.targetName.toLowerCase()))!,
      cardinality: (r.cardinality as Cardinality) || '1:N',
      type: (r.type as RelationshipType) || 'association'
    }));

  return {
    entities,
    relationships,
    summary: parsed.summary || `${fallbackLabel}: ${entities.length} clases y ${relationships.length} relaciones UML 2.5.`
  };
}

/**
 * Ejecuta OCR 100% local en el navegador con Tesseract.js sobre la imagen,
 * invirtiendo automáticamente capturas oscuras y aumentando el contraste para leer texto UML real.
 */
async function runLocalImageOCR(imageDataUrl: string): Promise<string> {
  let processedUrl = imageDataUrl;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = imageDataUrl;
    });

    const scale = img.width < 900 ? 2 : 1.5;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let totalLum = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgLum = totalLum / Math.max(1, pixelCount);
      const isDarkBg = avgLum < 128;

      for (let i = 0; i < data.length; i += 4) {
        let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (isDarkBg) gray = 255 - gray;
        // Aumentar contraste para OCR limpio
        const contrasted = gray < 150 ? Math.max(0, gray * 0.65) : Math.min(255, gray * 1.15 + 25);
        data[i] = contrasted;
        data[i + 1] = contrasted;
        data[i + 2] = contrasted;
      }
      ctx.putImageData(imageData, 0, 0);
      processedUrl = canvas.toDataURL('image/png');
    }
  } catch {
    processedUrl = imageDataUrl;
  }

  try {
    const tesseractMod: any = await import('tesseract.js');
    const recognizeFn = tesseractMod.recognize || tesseractMod.default?.recognize;
    if (typeof recognizeFn === 'function') {
      const result = await recognizeFn(processedUrl, 'eng');
      return result?.data?.text || '';
    }
  } catch (err) {
    console.warn('Error en OCR local Tesseract:', err);
  }
  return '';
}

function normalizeOcrToken(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Encuentra qué entidades reales del lienzo actual aparecen en el texto OCR o en la respuesta de visión.
 */
export function matchEntitiesInImageText(ocrText: string, existingEntities: Entity[]): Entity[] {
  const normalizedText = normalizeOcrToken(ocrText);
  const ocrLines = ocrText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const scored = existingEntities.map(ent => {
    const cleanName = normalizeOcrToken(ent.name);
    let score = 0;
    if (cleanName.length >= 3 && normalizedText.includes(cleanName)) {
      score += 12;
    }
    // Coincidencia por línea exacta o parcial
    ocrLines.forEach(line => {
      const normLine = normalizeOcrToken(line);
      if (cleanName.length >= 3 && normLine === cleanName) score += 10;
    });
    // Coincidencia de atributos propios (evitando 'id' genérico)
    ent.attributes.forEach(attr => {
      const cleanAttr = normalizeOcrToken(attr.name);
      if (cleanAttr.length >= 4 && normalizedText.includes(cleanAttr)) {
        score += 3;
      }
    });
    return { entity: ent, score };
  });

  return scored
    .filter(s => s.score >= 10)
    .sort((a, b) => b.score - a.score)
    .map(s => s.entity);
}

/**
 * Parsea texto OCR extraído de una foto/captura de diagrama UML en entidades y atributos reales.
 */
function parseEntitiesFromOcrText(ocrText: string): {
  entities: Array<{
    name: string;
    tableName: string;
    attributes: Array<{ name: string; type: string; isPrimaryKey: boolean; isForeignKey?: boolean; isNullable: boolean }>;
  }>;
  relationships: Array<{ sourceName: string; targetName: string; cardinality: string; type?: string; name: string }>;
} {
  const rawLines = ocrText
    .split(/\r?\n/)
    .map(l => l.replace(/[|©®™•●◆◇▷]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(l => l.length >= 2);

  const entities: Array<{
    name: string;
    tableName: string;
    attributes: Array<{ name: string; type: string; isPrimaryKey: boolean; isForeignKey?: boolean; isNullable: boolean }>;
  }> = [];

  let currentEntity: (typeof entities)[number] | null = null;

  const ignoredTokens = new Set([
    'pk', 'fk', 'uk', 'id', 'class', 'entity', 'table', 'tabla',
    'uml', 'association', 'aggregation', 'composition', 'void', 'boolean', 'string', 'integer', 'long'
  ]);

  const inferTypeFromNameAndLine = (attrName: string, lineLower: string): DataType => {
    if (lineLower.includes('bigint') || lineLower.includes('long') || attrName.toLowerCase() === 'id' || attrName.toLowerCase().endsWith('_id')) return 'BIGINT';
    if (lineLower.includes('int')) return 'INTEGER';
    if (lineLower.includes('decimal') || lineLower.includes('float') || lineLower.includes('real') || /monto|precio|costo|total|peso|saldo/.test(attrName.toLowerCase())) return 'DECIMAL';
    if (lineLower.includes('bool') || /^(es|is|activo|esterilizado)/.test(attrName.toLowerCase())) return 'BOOLEAN';
    if (lineLower.includes('timestamp') || lineLower.includes('datetime') || /fechaactualizacion|createdat|updatedat|fechahora/.test(attrName.toLowerCase())) return 'TIMESTAMP';
    if (lineLower.includes('date') || /fecha/.test(attrName.toLowerCase())) return 'DATE';
    if (lineLower.includes('text') || /descripcion|observacion|diagnostico|tratamiento/.test(attrName.toLowerCase())) return 'TEXT';
    return 'VARCHAR';
  };

  for (const line of rawLines) {
    const cleanAlphaNum = line.replace(/[^a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ:+\-# ]/g, '').trim();
    if (!cleanAlphaNum || /^1:N|1:1|N:M|\*$/i.test(cleanAlphaNum)) continue;
    // Saltar líneas de estereotipos o botones de UI
    if (/^(class\s*\/\s*entity|class|entity)$/i.test(cleanAlphaNum)) continue;

    // Detectar atributo explícito: "PK id", "- nombre : VARCHAR", "+ id: Long [PK]", "fechaActualizacion"
    const pkMatch = cleanAlphaNum.match(/^(?:pk|\[pk\]|ap\s*pk|p\s*k)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    const fkMatch = cleanAlphaNum.match(/^(?:fk|\[fk\])\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    const umlAttrMatch = cleanAlphaNum.match(/^[-+#~]\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?::\s*([a-zA-Z0-9_()]+))?/);

    if (pkMatch) {
      if (!currentEntity) {
        currentEntity = { name: 'ClaseDetectada', tableName: 'clase_detectada', attributes: [] };
        entities.push(currentEntity);
      }
      const attrName = pkMatch[1];
      if (!currentEntity.attributes.some(a => a.name.toLowerCase() === attrName.toLowerCase())) {
        currentEntity.attributes.push({ name: attrName, type: 'BIGINT', isPrimaryKey: true, isNullable: false });
      }
      continue;
    }

    if (fkMatch && currentEntity) {
      const attrName = fkMatch[1];
      if (!currentEntity.attributes.some(a => a.name.toLowerCase() === attrName.toLowerCase())) {
        currentEntity.attributes.push({ name: attrName, type: 'BIGINT', isPrimaryKey: false, isForeignKey: true, isNullable: false });
      }
      continue;
    }

    if (umlAttrMatch) {
      const attrName = umlAttrMatch[1];
      if (cleanAlphaNum.includes('(')) continue; // Es método/operación, no atributo
      if (!currentEntity) {
        currentEntity = { name: 'ClaseDetectada', tableName: 'clase_detectada', attributes: [] };
        entities.push(currentEntity);
      }
      const isPK = /\[pk\]|\{id\}|^id$/i.test(cleanAlphaNum) || attrName.toLowerCase() === 'id';
      const isFK = /\[fk\]|\{fk\}|_id$/i.test(cleanAlphaNum) && !isPK;
      if (!currentEntity.attributes.some(a => a.name.toLowerCase() === attrName.toLowerCase())) {
        currentEntity.attributes.push({
          name: attrName,
          type: inferTypeFromNameAndLine(attrName, cleanAlphaNum.toLowerCase()),
          isPrimaryKey: isPK,
          isForeignKey: isFK,
          isNullable: /\[0\.\.1\]|\?/.test(cleanAlphaNum)
        });
      }
      continue;
    }

    // Token simple sin espacios ni símbolos (ej. "Reserva", "nombre", "estado", "fechaActualizacion")
    const singleTokenMatch = cleanAlphaNum.match(/^([a-zA-ZÁÉÍÓÚÑáéíóúñ][a-zA-Z0-9_]*)$/);
    if (singleTokenMatch) {
      const word = singleTokenMatch[1];
      const lowerWord = word.toLowerCase();
      if (ignoredTokens.has(lowerWord)) {
        if (lowerWord === 'id' && currentEntity && !currentEntity.attributes.some(a => a.name === 'id')) {
          currentEntity.attributes.push({ name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false });
        }
        continue;
      }

      const startsUpper = /^[A-ZÁÉÍÓÚÑ]/.test(word);
      const isNewClassHeader = startsUpper && (!currentEntity || currentEntity.attributes.length >= 1 || entities.length === 0);

      if (isNewClassHeader && word.length >= 3) {
        currentEntity = {
          name: word,
          tableName: word.toLowerCase(),
          attributes: []
        };
        entities.push(currentEntity);
      } else if (currentEntity) {
        const isFK = lowerWord.endsWith('_id');
        if (!currentEntity.attributes.some(a => a.name.toLowerCase() === lowerWord)) {
          currentEntity.attributes.push({
            name: word,
            type: inferTypeFromNameAndLine(word, lowerWord),
            isPrimaryKey: lowerWord === 'id',
            isForeignKey: isFK,
            isNullable: false
          });
        }
      }
    }
  }

  // Asegurar que ninguna clase quede sin id si tiene atributos y limpiar clases vacías si hay otras válidas
  const validEntities = entities
    .filter(e => e.name !== 'ClaseDetectada' || e.attributes.length > 0)
    .map(e => {
      if (e.attributes.length === 0) {
        return {
          ...e,
          attributes: [{ name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false }]
        };
      }
      return e;
    });

  return { entities: validEntities, relationships: [] };
}

/**
 * Digitaliza una foto o captura de diagrama de clases UML.
 * Soporta selector de motor:
 * - 'auto': Ollama Vision Local -> Gemini Vision (si hay API Key) -> OCR Local Tesseract.js
 * - 'gemini': Google Gemini Vision (usa customGeminiApiKey, localStorage o VITE_GEMINI_API_KEY)
 * - 'local': 100% Local (Ollama Vision Local -> OCR Local Tesseract.js)
 */
export async function processDiagramPhoto(
  imageDataUrl: string,
  hintText?: string,
  existingEntities: Entity[] = [],
  options?: { engine?: 'auto' | 'gemini' | 'local'; customGeminiApiKey?: string }
): Promise<{
  entities: Entity[];
  relationships: Relationship[];
  matchedExistingEntities: Entity[];
  ocrText: string;
  summary: string;
  providerUsed: string;
}> {
  const engine = options?.engine || 'auto';
  const base64Image = imageDataUrl.split(',')[1] || '';
  const mimeType = imageDataUrl.split(';')[0]?.split(':')[1] || 'image/png';

  const visionPrompt = `Analiza esta imagen de un diagrama de clases UML 2.5 (dibujado a mano, pizarra o captura).
Extrae todas las clases/entidades, atributos, métodos y relaciones UML exactamente como aparecen en la imagen (NO inventes clases que no estén en la imagen).
${hintText ? `Contexto o petición del usuario: "${hintText}"` : ''}
Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown):
{
  "entities": [
    {
      "name": "NombreClase",
      "tableName": "nombre_tabla",
      "attributes": [
        { "name": "id", "type": "BIGINT", "isPrimaryKey": true, "isNullable": false }
      ]
    }
  ],
  "relationships": [
    { "sourceName": "ClaseA", "targetName": "ClaseB", "cardinality": "1:N", "type": "association", "name": "posee" }
  ],
  "summary": "Resumen breve en español"
}`;

  // 1. Intentar Ollama Vision Local si engine es 'auto' o 'local'
  if (engine === 'auto' || engine === 'local') {
    try {
      let localEndpoint = 'http://localhost:11434';
      try {
        const cfgRaw = localStorage.getItem('case_ai_senior_config_v1');
        if (cfgRaw) {
          const parsedCfg = JSON.parse(cfgRaw);
          if (parsedCfg.localEndpoint) {
            localEndpoint = String(parsedCfg.localEndpoint).replace(/\/api\/chat.*$/, '').replace(/\/v1\/.*$/, '');
          }
        }
      } catch {}

      const tagsRes = await fetch(`${localEndpoint}/api/tags`, { method: 'GET' });
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        const installedModels: string[] = (tagsData?.models || []).map((m: any) => m.name || m.model || '');
        const visionModel = installedModels.find(m => /vision|llava|vl|minicpm|moondream|gemma3/i.test(m));

        if (visionModel) {
          const ollamaRes = await fetch(`${localEndpoint}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: visionModel,
              stream: false,
              format: 'json',
              options: { temperature: 0.1 },
              messages: [
                {
                  role: 'user',
                  content: visionPrompt,
                  images: [base64Image]
                }
              ]
            })
          });

          if (ollamaRes.ok) {
            const oData = await ollamaRes.json();
            const rawText: string = oData?.message?.content || oData?.response || '';
            let clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            const f = clean.indexOf('{');
            const l = clean.lastIndexOf('}');
            if (f !== -1 && l > f) {
              clean = clean.slice(f, l + 1);
              const parsed = JSON.parse(clean);
              if (Array.isArray(parsed?.entities) && parsed.entities.length > 0) {
                const built = buildParsedDiagramResult(parsed, `Ollama Vision Local (${visionModel})`);
                const namesText = parsed.entities.map((e: any) => e.name).join(' ');
                return {
                  ...built,
                  matchedExistingEntities: matchEntitiesInImageText(namesText, existingEntities),
                  ocrText: namesText,
                  providerUsed: `Ollama Vision Local (${visionModel})`
                };
              }
            }
          }
        }
      }
    } catch {
      // Ollama Vision no disponible -> continuar
    }
  }

  // 2. Intentar Gemini Vision si engine es 'gemini' o 'auto'
  let storedGeminiKey = '';
  try {
    const cfgRaw = localStorage.getItem('case_ai_senior_config_v1');
    if (cfgRaw) storedGeminiKey = JSON.parse(cfgRaw)?.googleApiKey?.trim() || '';
  } catch {}

  const envGeminiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined)?.trim() || '';
  const effectiveGeminiKey =
    options?.customGeminiApiKey?.trim() ||
    storedGeminiKey ||
    (envGeminiKey && envGeminiKey !== 'PEGA_TU_API_KEY_AQUI' ? envGeminiKey : '');

  if (engine === 'gemini' && !effectiveGeminiKey) {
    throw new Error(
      'No hay una Gemini API Key configurada. Pégala arriba en el campo de Gemini API Key o cambia al motor "100% Local (Ollama / OCR)".'
    );
  }

  if ((engine === 'gemini' || engine === 'auto') && effectiveGeminiKey) {
    const MODELS_TO_TRY = [
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-3.6-flash'
    ];
    let lastGeminiError = '';

    for (const model of MODELS_TO_TRY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(effectiveGeminiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: visionPrompt },
                    { inline_data: { mime_type: mimeType, data: base64Image } }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
                topP: 0.8,
                maxOutputTokens: 8192
              }
            })
          }
        );

        if (response.ok) {
          const geminiData = await response.json();
          const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          let jsonText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          const f = jsonText.indexOf('{');
          const l = jsonText.lastIndexOf('}');
          if (f !== -1 && l > f) jsonText = jsonText.slice(f, l + 1);
          const parsed = JSON.parse(jsonText);
          if (Array.isArray(parsed?.entities) && parsed.entities.length > 0) {
            const built = buildParsedDiagramResult(parsed, `Gemini Vision (${model})`);
            const namesText = parsed.entities.map((e: any) => e.name).join(' ');
            return {
              ...built,
              matchedExistingEntities: matchEntitiesInImageText(namesText, existingEntities),
              ocrText: namesText,
              providerUsed: `Gemini Vision (${model})`
            };
          }
        } else {
          const errBody = await response.text();
          lastGeminiError = `HTTP ${response.status} (${model}): ${errBody.slice(0, 180)}`;
        }
      } catch (err: any) {
        lastGeminiError = err?.message || String(err);
      }
    }

    if (engine === 'gemini') {
      throw new Error(
        `Gemini Vision no pudo responder (${lastGeminiError || 'error de API'}). Verifica tu API Key de Google AI Studio o cambia al motor "100% Local (Ollama / OCR)".`
      );
    }
  }

  // 3. OCR 100% Local en navegador (Tesseract.js) — Lee el texto real de la imagen sin inventar clases falsas
  const ocrText = await runLocalImageOCR(imageDataUrl);
  const matchedExistingEntities = matchEntitiesInImageText(ocrText, existingEntities);
  const ocrParsed = parseEntitiesFromOcrText(ocrText);

  if (ocrParsed.entities.length > 0) {
    const built = buildParsedDiagramResult(
      {
        entities: ocrParsed.entities,
        relationships: ocrParsed.relationships,
        summary: `OCR Local leyó ${ocrParsed.entities.length} clase(s) de la imagen: ${ocrParsed.entities.map(e => e.name).join(', ')}.`
      },
      'OCR Local PUDS'
    );
    return {
      ...built,
      matchedExistingEntities,
      ocrText,
      providerUsed: 'OCR Visual Local (Tesseract.js)'
    };
  }

  if (matchedExistingEntities.length > 0) {
    return {
      entities: matchedExistingEntities,
      relationships: [],
      matchedExistingEntities,
      ocrText,
      summary: `OCR Local identificó la(s) clase(s) del lienzo en tu captura: ${matchedExistingEntities.map(e => e.name).join(', ')}.`,
      providerUsed: 'OCR Visual Local (Tesseract.js)'
    };
  }

  return {
    entities: [],
    relationships: [],
    matchedExistingEntities: [],
    ocrText,
    summary: ocrText.trim()
      ? `Leí este texto en la imagen pero no reconocí bloques de clases completos: "${ocrText.trim().slice(0, 140)}".`
      : 'No pude leer texto legible en esta imagen. Prueba cambiar a "Gemini Vision" (con una API Key válida) o usar Ollama Vision local (llama3.2-vision).',
    providerUsed: 'OCR Visual Local (Tesseract.js)'
  };
}
