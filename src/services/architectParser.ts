import { XMLParser } from 'fast-xml-parser';
import { Attribute, Cardinality, DataType, DiagramModel, Entity, Relationship } from '../types/case';

/**
 * Mapeo de tipos de datos de CASE-AI a tipos UML estándar de Enterprise Architect
 */
function mapDataTypeToUML(type: DataType): string {
  switch (type) {
    case 'INTEGER':
    case 'BIGINT':
      return 'Integer';
    case 'BOOLEAN':
      return 'Boolean';
    case 'DATE':
    case 'TIMESTAMP':
      return 'DateTime';
    case 'DECIMAL':
    case 'FLOAT':
      return 'Real';
    case 'VARCHAR':
    case 'TEXT':
    default:
      return 'String';
  }
}

function mapUMLToDataType(umlType: string): DataType {
  const lower = (umlType || '').toLowerCase();
  if (lower.includes('int') || lower.includes('bigint') || lower.includes('serial')) return 'INTEGER';
  if (lower.includes('bool')) return 'BOOLEAN';
  if (lower.includes('date') || lower.includes('time')) return 'TIMESTAMP';
  if (lower.includes('real') || lower.includes('float') || lower.includes('double') || lower.includes('decimal') || lower.includes('numeric')) return 'DECIMAL';
  return 'VARCHAR';
}

/**
 * EXPORTAR 1: Genera XMI 2.1 estándar de UML con extensiones nativas de Enterprise Architect (Sparx Systems)
 * Incluye la sección <xmi:Extension extender="Enterprise Architect"> con coordenadas y diagrama visual.
 */
export function exportToEnterpriseArchitectXMI(diagram: DiagramModel): string {
  const timestamp = new Date().toISOString();
  const pkgId = `EAPK_${diagram.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.1" xmlns:uml="http://schema.omg.org/spec/UML/2.1" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1" xmlns:ea="http://www.sparxsystems.com/ea">
  <xmi:Documentation exporter="Enterprise Architect" exporterVersion="6.5"/>
  <uml:Model xmi:type="uml:Model" xmi:id="EA_Model" name="EA_Model">
    <packagedElement xmi:type="uml:Package" xmi:id="${pkgId}" name="${diagram.name || 'Modelo_PUDS'}">
`;

  // 1. Clases UML y sus Atributos
  diagram.entities.forEach((entity, idx) => {
    const classId = `EAID_${entity.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    xml += `      <packagedElement xmi:type="uml:Class" xmi:id="${classId}" name="${entity.name}">
`;
    entity.attributes.forEach((attr, aIdx) => {
      const attrId = `EAID_ATTR_${attr.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      const umlType = mapDataTypeToUML(attr.type);
      xml += `        <ownedAttribute xmi:type="uml:Property" xmi:id="${attrId}" name="${attr.name}" visibility="private">
          <type xmi:type="uml:PrimitiveType" href="http://schema.omg.org/spec/UML/2.1/uml.xml#${umlType}"/>
          <lowerValue xmi:type="uml:LiteralInteger" xmi:id="EAID_LV_${attr.id.replace(/[^a-zA-Z0-9_]/g, '_')}" value="${attr.isNullable ? 0 : 1}"/>
          <upperValue xmi:type="uml:LiteralUnlimitedNatural" xmi:id="EAID_UV_${attr.id.replace(/[^a-zA-Z0-9_]/g, '_')}" value="1"/>
        </ownedAttribute>
`;
    });

    if (entity.methods && entity.methods.length > 0) {
      entity.methods.forEach(method => {
        const methId = `EAID_METH_${method.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
        xml += `        <ownedOperation xmi:type="uml:Operation" xmi:id="${methId}" name="${method.name}" visibility="${method.visibility || 'public'}"/>
`;
      });
    }

    xml += `      </packagedElement>
`;
  });

  // 2. Asociaciones y Relaciones UML
  diagram.relationships.forEach((rel, index) => {
    const source = diagram.entities.find(e => e.id === rel.sourceEntityId);
    const target = diagram.entities.find(e => e.id === rel.targetEntityId);
    if (!source || !target) return;

    const relId = `EAID_REL_${(rel.id || `rel_${index}`).replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const srcClassId = `EAID_${source.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const tgtClassId = `EAID_${target.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;

    let sourceUpper = '1';
    let targetUpper = '1';

    if (rel.cardinality === '1:N') {
      targetUpper = '*';
    } else if (rel.cardinality === 'N:M') {
      sourceUpper = '*';
      targetUpper = '*';
    }

    xml += `      <packagedElement xmi:type="uml:Association" xmi:id="${relId}" name="${rel.name || `${source.name}_${target.name}`}">
        <memberEnd xmi:idref="EAID_END_SRC_${index}"/>
        <memberEnd xmi:idref="EAID_END_TGT_${index}"/>
        <ownedEnd xmi:type="uml:Property" xmi:id="EAID_END_SRC_${index}" name="${source.name.toLowerCase()}" type="${srcClassId}">
          <lowerValue xmi:type="uml:LiteralInteger" value="1"/>
          <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${sourceUpper}"/>
        </ownedEnd>
        <ownedEnd xmi:type="uml:Property" xmi:id="EAID_END_TGT_${index}" name="${target.name.toLowerCase()}" type="${tgtClassId}">
          <lowerValue xmi:type="uml:LiteralInteger" value="1"/>
          <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${targetUpper}"/>
        </ownedEnd>
      </packagedElement>
`;
  });

  xml += `    </packagedElement>
  </uml:Model>
`;

  // 3. Extensiones Específicas de Enterprise Architect (Sparx Systems)
  // Esto es lo que permite que EA dibuje el diagrama automáticamente con posiciones en el lienzo
  xml += `  <xmi:Extension extender="Enterprise Architect" extenderID="6.5">
    <elements>
      <element xmi:idref="${pkgId}" xmi:type="uml:Package" name="${diagram.name || 'Modelo_PUDS'}" scope="public">
        <model package2="EA_Model" ea_eleType="package"/>
        <properties isSpecification="false" sType="Package" nType="0" scope="public"/>
      </element>
`;

  diagram.entities.forEach((entity, idx) => {
    const classId = `EAID_${entity.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    xml += `      <element xmi:idref="${classId}" xmi:type="uml:Class" name="${entity.name}" scope="public">
        <model package="${pkgId}" tpos="0" ea_localid="${idx + 1}" ea_eleType="element"/>
        <properties isSpecification="false" sType="Class" nType="0" scope="public" isRoot="false" isLeaf="false" isAbstract="false"/>
        <attributes>
`;
    entity.attributes.forEach((attr, aIdx) => {
      const attrId = `EAID_ATTR_${attr.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      const umlType = mapDataTypeToUML(attr.type);
      xml += `          <attribute xmi:idref="${attrId}" name="${attr.name}" scope="Private">
            <properties type="${umlType}" derived="0" precision="0" length="0" scale="0" collection="false" duplicates="0" changeability="changeable"/>
            <coords ordered="0"/>
            <containment containment="Not Specified" position="${aIdx}"/>
            <bounds lower="${attr.isNullable ? 0 : 1}" upper="1"/>
            <styleex value="IsLiteral=0;"/>
          </attribute>
`;
    });
    xml += `        </attributes>
      </element>
`;
  });

  xml += `    </elements>
    <connectors>
`;

  diagram.relationships.forEach((rel, index) => {
    const source = diagram.entities.find(e => e.id === rel.sourceEntityId);
    const target = diagram.entities.find(e => e.id === rel.targetEntityId);
    if (!source || !target) return;

    const relId = `EAID_REL_${(rel.id || `rel_${index}`).replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const srcClassId = `EAID_${source.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const tgtClassId = `EAID_${target.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;

    xml += `      <connector xmi:idref="${relId}">
        <source xmi:idref="${srcClassId}">
          <model type="Class" name="${source.name}"/>
          <role visibility="Public" targetScope="instance"/>
          <type multiplicity="${rel.cardinality === 'N:M' ? '0..*' : '1'}"/>
        </source>
        <target xmi:idref="${tgtClassId}">
          <model type="Class" name="${target.name}"/>
          <role visibility="Public" targetScope="instance"/>
          <type multiplicity="${rel.cardinality === '1:N' || rel.cardinality === 'N:M' ? '0..*' : '1'}"/>
        </target>
        <properties ea_type="Association" direction="Unspecified"/>
      </connector>
`;
  });

  xml += `    </connectors>
    <diagrams>
      <diagram xmi:id="EAID_DIAG_${diagram.id.replace(/[^a-zA-Z0-9_]/g, '_')}">
        <model package="${pkgId}" localID="1" ea_localid="1"/>
        <properties name="${diagram.name || 'Diagrama_Clases'}" type="Logical"/>
        <project author="CASE-AI Studio" version="1.0" created="${timestamp}" modified="${timestamp}"/>
        <elements>
`;

  diagram.entities.forEach((entity, idx) => {
    const classId = `EAID_${entity.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const left = Math.round(entity.x || 80 + (idx % 3) * 260);
    const top = Math.round(entity.y || 80 + Math.floor(idx / 3) * 220);
    const right = left + 200;
    const bottom = top + 160;

    xml += `          <element subject="${classId}" seq="${idx + 1}" style="DUID=EA_DUID_${idx + 1};" geometry="Left=${left};Top=${top};Right=${right};Bottom=${bottom};"/>
`;
  });

  xml += `        </elements>
      </diagram>
    </diagrams>
  </xmi:Extension>
</xmi:XMI>`;

  return xml;
}

/**
 * EXPORTAR 2: Genera XMI 1.1 Clásico (Compatible universalmente con cualquier versión antigua o nueva de Enterprise Architect)
 */
export function exportToEnterpriseArchitectXMI11(diagram: DiagramModel): string {
  const timestamp = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<XMI xmi.version="1.1" xmlns:UML="omg.org/UML1.3" timestamp="${timestamp}">
  <XMI.header>
    <XMI.documentation>
      <XMI.exporter>Enterprise Architect</XMI.exporter>
      <XMI.exporterVersion>6.5</XMI.exporterVersion>
    </XMI.documentation>
  </XMI.header>
  <XMI.content>
    <UML:Model xmi.id="EA_MODEL_1" name="${diagram.name || 'Modelo_PUDS'}">
      <UML:Namespace.ownedElement>
`;

  diagram.entities.forEach(entity => {
    const classId = `EA_CLASS_${entity.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    xml += `        <UML:Class xmi.id="${classId}" name="${entity.name}" visibility="public" isAbstract="false">
          <UML:Classifier.feature>
`;
    entity.attributes.forEach(attr => {
      const attrId = `EA_ATTR_${attr.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      const umlType = mapDataTypeToUML(attr.type);
      xml += `            <UML:Attribute xmi.id="${attrId}" name="${attr.name}" visibility="private">
              <UML:StructuralFeature.type>
                <UML:DataType xmi.idref="EA_TYPE_${umlType}" name="${umlType}"/>
              </UML:StructuralFeature.type>
            </UML:Attribute>
`;
    });
    xml += `          </UML:Classifier.feature>
        </UML:Class>
`;
  });

  diagram.relationships.forEach((rel, index) => {
    const source = diagram.entities.find(e => e.id === rel.sourceEntityId);
    const target = diagram.entities.find(e => e.id === rel.targetEntityId);
    if (!source || !target) return;

    const relId = `EA_ASSOC_${index}`;
    const srcClassId = `EA_CLASS_${source.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const tgtClassId = `EA_CLASS_${target.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;

    xml += `        <UML:Association xmi.id="${relId}" name="${rel.name || `${source.name}_${target.name}`}">
          <UML:Association.connection>
            <UML:AssociationEnd xmi.id="${relId}_END1" type="${srcClassId}" multiplicity="1" isNavigable="true"/>
            <UML:AssociationEnd xmi.id="${relId}_END2" type="${tgtClassId}" multiplicity="${rel.cardinality === '1:N' || rel.cardinality === 'N:M' ? '0..*' : '1'}" isNavigable="true"/>
          </UML:Association.connection>
        </UML:Association>
`;
  });

  xml += `      </UML:Namespace.ownedElement>
    </UML:Model>
  </XMI.content>
</XMI>`;

  return xml;
}

/**
 * EXPORTAR 3: Genera XML en formato Open Exchange de ArchiMate (compatible con Archi)
 */
export function exportToArchiXML(diagram: DiagramModel): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://www.opengroup.org/xsd/archimate/3.0/"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       identifier="id-${diagram.id.replace(/[^a-zA-Z0-9_]/g, '_')}">
  <name>${diagram.name || 'ArchiModel'}</name>
  <elements>
`;

  diagram.entities.forEach(entity => {
    xml += `    <element identifier="elem-${entity.id.replace(/[^a-zA-Z0-9_]/g, '_')}" xsi:type="DataObject">
      <name>${entity.name}</name>
      <documentation>Atributos: ${entity.attributes.map(a => `${a.name}${a.isPrimaryKey ? ' [PK]' : ''}: ${a.type}`).join(', ')}</documentation>
    </element>
`;
  });

  xml += `  </elements>
  <relationships>
`;

  diagram.relationships.forEach((rel, index) => {
    xml += `    <relationship identifier="rel-${(rel.id || `rel_${index}`).replace(/[^a-zA-Z0-9_]/g, '_')}" source="elem-${rel.sourceEntityId.replace(/[^a-zA-Z0-9_]/g, '_')}" target="elem-${rel.targetEntityId.replace(/[^a-zA-Z0-9_]/g, '_')}" xsi:type="Association">
      <name>${rel.name || rel.cardinality}</name>
    </relationship>
`;
  });

  xml += `  </relationships>
</model>`;

  return xml;
}

/**
 * IMPORTAR RECURSIVO Y UNIVERSAL: Parsea archivos XMI 2.1, XMI 1.1, EA XML nativo o Archi Open Exchange
 */
export function importFromArchitectXML(xmlContent: string): { success: boolean; model?: DiagramModel; message: string } {
  try {
    if (!xmlContent || xmlContent.trim().length === 0) {
      return { success: false, message: 'El archivo XML/XMI está vacío.' };
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      parseAttributeValue: false
    });

    const parsed = parser.parse(xmlContent);

    // 1. Detectar Archi (ArchiMate Open Exchange XML)
    if (parsed['model'] && (parsed['model']['elements'] || parsed['model']['@_xmlns']?.includes('archimate'))) {
      return parseArchiModel(parsed['model']);
    }

    // 2. Detectar Enterprise Architect (XMI 2.1 / XMI 1.1 / UML Model / Package)
    return parseEnterpriseArchitectRecursive(parsed);
  } catch (error: any) {
    return {
      success: false,
      message: `Error de sintaxis al procesar el archivo XML/XMI: ${error.message}`
    };
  }
}

/**
 * Extractor recursivo para cualquier estructura XMI de Enterprise Architect
 */
function parseEnterpriseArchitectRecursive(root: any): { success: boolean; model?: DiagramModel; message: string } {
  const entities: Entity[] = [];
  const relationships: Relationship[] = [];
  const entityIdMap = new Map<string, string>(); // Original ID -> Generated ID
  const classNodeMap = new Map<string, any>();

  let modelName = 'Modelo Enterprise Architect';

  // Buscar recursivamente todas las clases y paquetes
  function findClassesAndPackages(node: any) {
    if (!node || typeof node !== 'object') return;

    // Detectar nombre del modelo
    if (node['@_name'] && !modelName.includes('(')) {
      if (node['@_xmi:type'] === 'uml:Model' || node['@_xmi:type'] === 'uml:Package') {
        modelName = node['@_name'];
      }
    }

    // Caso XMI 2.1 / UML 2.x (<packagedElement xmi:type="uml:Class">)
    const type = node['@_xmi:type'] || node['@_type'] || '';
    if (type === 'uml:Class' || type === 'Class') {
      const originalId = node['@_xmi:id'] || node['@_id'];
      if (originalId && node['@_name']) {
        classNodeMap.set(originalId, node);
      }
    }

    // Caso XMI 1.1 (<UML:Class xmi.id="...">)
    if (node['@_xmi.id'] && (node['@_name'] || node['name'])) {
      const origId = node['@_xmi.id'];
      classNodeMap.set(origId, {
        '@_name': node['@_name'] || node['name'],
        '@_xmi:id': origId,
        'ownedAttribute': node['UML:Classifier.feature']?.['UML:Attribute'] || node['ownedAttribute']
      });
    }

    // Recorrer arrays y objetos hijos
    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(item => findClassesAndPackages(item));
      } else if (typeof child === 'object') {
        findClassesAndPackages(child);
      }
    }
  }

  findClassesAndPackages(root);

  // Si no encontró clases en la estructura UML estándar, buscar en <xmi:Extension><elements>
  if (classNodeMap.size === 0) {
    const extElements = root?.['xmi:XMI']?.['xmi:Extension']?.['elements']?.['element'] ||
                        root?.['XMI']?.['XMI.content']?.['xmi:Extension']?.['elements']?.['element'];
    if (extElements) {
      const list = Array.isArray(extElements) ? extElements : [extElements];
      list.forEach((elem: any) => {
        if (elem['@_xmi:type'] === 'uml:Class' || elem['@_sType'] === 'Class') {
          const origId = elem['@_xmi:idref'] || elem['@_xmi:id'] || elem['@_name'];
          classNodeMap.set(origId, {
            '@_name': elem['@_name'],
            '@_xmi:id': origId,
            'ownedAttribute': elem['attributes']?.['attribute']
          });
        }
      });
    }
  }

  // Coordenadas de Diagrama (si existen en la extensión de EA)
  const diagramGeometryMap = new Map<string, { x: number; y: number }>();
  const diagElements = root?.['xmi:XMI']?.['xmi:Extension']?.['diagrams']?.['diagram']?.['elements']?.['element'];
  if (diagElements) {
    const dList = Array.isArray(diagElements) ? diagElements : [diagElements];
    dList.forEach((de: any) => {
      const subject = de['@_subject'];
      const geom = de['@_geometry'] || '';
      if (subject && geom) {
        const leftMatch = geom.match(/Left=(\d+)/i);
        const topMatch = geom.match(/Top=(\d+)/i);
        if (leftMatch && topMatch) {
          diagramGeometryMap.set(subject, { x: parseInt(leftMatch[1], 10), y: parseInt(topMatch[1], 10) });
        }
      }
    });
  }

  let gridCol = 0;
  let gridRow = 0;

  // Convertir nodos encontrados en Entidades CASE
  classNodeMap.forEach((classNode, originalId) => {
    const entityId = `ea_ent_${Math.random().toString(36).substr(2, 9)}`;
    entityIdMap.set(originalId, entityId);
    entityIdMap.set(classNode['@_name'], entityId);

    const attributes: Attribute[] = [];

    // Extraer atributos
    let rawAttrs = classNode['ownedAttribute'] || classNode['attribute'] || [];
    if (!Array.isArray(rawAttrs)) rawAttrs = [rawAttrs];

    rawAttrs.forEach((attrNode: any, idx: number) => {
      if (!attrNode || !attrNode['@_name']) return;
      const attrName = attrNode['@_name'];
      const typeRef = attrNode['type'] ? (attrNode['type']['@_href'] || attrNode['type']['@_name'] || '') : (attrNode['properties']?.['@_type'] || '');
      const dataType = mapUMLToDataType(typeRef || attrName);

      attributes.push({
        id: `attr_${Math.random().toString(36).substr(2, 9)}`,
        name: attrName,
        type: dataType,
        isPrimaryKey: idx === 0 || attrName.toLowerCase() === 'id' || attrName.toLowerCase().endsWith('_id'),
        isNullable: false
      });
    });

    if (attributes.length === 0) {
      attributes.push({
        id: `attr_${Math.random().toString(36).substr(2, 9)}`,
        name: 'id',
        type: 'BIGINT',
        isPrimaryKey: true,
        isNullable: false
      });
    }

    const geom = diagramGeometryMap.get(originalId);
    const xPos = geom ? geom.x : 80 + (gridCol % 3) * 320;
    const yPos = geom ? geom.y : 80 + gridRow * 260;

    entities.push({
      id: entityId,
      name: classNode['@_name'],
      tableName: (classNode['@_name']).toLowerCase() + 's',
      x: xPos,
      y: yPos,
      attributes
    });

    gridCol++;
    if (gridCol % 3 === 0) gridRow++;
  });

  // Buscar relaciones y asociaciones
  function findAssociations(node: any) {
    if (!node || typeof node !== 'object') return;

    const type = node['@_xmi:type'] || node['@_type'] || '';
    if (type === 'uml:Association' || type === 'Association') {
      let ownedEnds = node['ownedEnd'] || [];
      if (!Array.isArray(ownedEnds)) ownedEnds = [ownedEnds];

      if (ownedEnds.length >= 2) {
        const srcRef = ownedEnds[0]['@_type'];
        const tgtRef = ownedEnds[1]['@_type'];
        const srcId = entityIdMap.get(srcRef);
        const tgtId = entityIdMap.get(tgtRef);

        if (srcId && tgtId) {
          const tgtUpper = ownedEnds[1]?.['upperValue']?.['@_value'] || '1';
          const srcUpper = ownedEnds[0]?.['upperValue']?.['@_value'] || '1';

          let cardinality: Cardinality = '1:N';
          if (srcUpper === '*' && tgtUpper === '*') cardinality = 'N:M';
          else if (srcUpper === '1' && tgtUpper === '1') cardinality = '1:1';

          relationships.push({
            id: `rel_${Math.random().toString(36).substr(2, 9)}`,
            name: node['@_name'] || '',
            sourceEntityId: srcId,
            targetEntityId: tgtId,
            cardinality
          });
        }
      }
    }

    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) child.forEach(findAssociations);
      else if (typeof child === 'object') findAssociations(child);
    }
  }

  findAssociations(root);

  if (entities.length === 0) {
    return {
      success: false,
      message: 'No se encontraron clases UML válidas en el archivo de Enterprise Architect.'
    };
  }

  const model: DiagramModel = {
    id: `ea_import_${Date.now()}`,
    name: modelName,
    entities,
    relationships,
    functionalDependencies: [],
    updatedAt: Date.now(),
    version: 1
  };

  return {
    success: true,
    model,
    message: `¡Éxito! Se importaron ${entities.length} clases y ${relationships.length} relaciones desde Enterprise Architect.`
  };
}

function parseArchiModel(model: any): { success: boolean; model?: DiagramModel; message: string } {
  const modelName = model['name'] || 'Modelo Archi Importado';
  let elements = model['elements']?.['element'] || [];
  if (!Array.isArray(elements)) elements = [elements];

  const entities: Entity[] = [];
  const elemIdMap = new Map<string, string>();

  let col = 0;
  let row = 0;

  elements.forEach((elem: any) => {
    if (!elem) return;
    const originalId = elem['@_identifier'] || elem['identifier'];
    const name = elem['name'] || 'Elemento';
    const entityId = `archi_${Math.random().toString(36).substr(2, 9)}`;
    elemIdMap.set(originalId, entityId);

    const doc = elem['documentation'] || '';
    const attributes: Attribute[] = [
      {
        id: `attr_${Math.random().toString(36).substr(2, 9)}`,
        name: 'id',
        type: 'BIGINT',
        isPrimaryKey: true,
        isNullable: false
      }
    ];

    if (typeof doc === 'string' && doc.includes('Atributos:')) {
      const parts = doc.replace('Atributos:', '').split(',');
      parts.forEach(p => {
        const clean = p.trim();
        if (clean) {
          const isPK = clean.includes('[PK]');
          const attrClean = clean.replace('[PK]', '').trim();
          const [attrName, typeStr] = attrClean.split(':').map(s => s.trim());
          if (attrName && attrName.toLowerCase() !== 'id') {
            attributes.push({
              id: `attr_${Math.random().toString(36).substr(2, 9)}`,
              name: attrName,
              type: mapUMLToDataType(typeStr || 'VARCHAR'),
              isPrimaryKey: isPK,
              isNullable: false
            });
          }
        }
      });
    }

    entities.push({
      id: entityId,
      name,
      tableName: name.toLowerCase() + 's',
      x: 80 + (col % 3) * 320,
      y: 80 + row * 260,
      attributes
    });

    col++;
    if (col % 3 === 0) row++;
  });

  let relations = model['relationships']?.['relationship'] || [];
  if (!Array.isArray(relations)) relations = [relations];

  const relationships: Relationship[] = [];
  relations.forEach((rel: any) => {
    if (!rel) return;
    const srcRef = rel['@_source'] || rel['source'];
    const tgtRef = rel['@_target'] || rel['target'];
    const srcId = elemIdMap.get(srcRef);
    const tgtId = elemIdMap.get(tgtRef);

    if (srcId && tgtId) {
      relationships.push({
        id: `rel_${Math.random().toString(36).substr(2, 9)}`,
        name: rel['name'] || '',
        sourceEntityId: srcId,
        targetEntityId: tgtId,
        cardinality: '1:N'
      });
    }
  });

  return {
    success: true,
    model: {
      id: `archi_model_${Date.now()}`,
      name: modelName,
      entities,
      relationships,
      functionalDependencies: [],
      updatedAt: Date.now(),
      version: 1
    },
    message: `Se importaron ${entities.length} elementos de datos desde Archi.`
  };
}
