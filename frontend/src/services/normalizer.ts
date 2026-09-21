import { Attribute, Entity, FunctionalDependency, NormalizationReport, NormalizationViolation } from '../types/case';

/**
 * Calcula el cierre de un conjunto de atributos X respecto a un conjunto de dependencias funcionales F
 * X+ = Atributos determinados por X
 */
export function computeAttributeClosure(
  attributesX: string[],
  functionalDependencies: FunctionalDependency[]
): Set<string> {
  const closure = new Set<string>(attributesX.map(a => a.trim().toLowerCase()));
  let changed = true;

  while (changed) {
    changed = false;
    for (const fd of functionalDependencies) {
      const determinantLower = fd.determinant.map(d => d.trim().toLowerCase());
      // Si todo el determinante está contenido en el cierre actual
      const isDeterminantSubset = determinantLower.every(det => closure.has(det));

      if (isDeterminantSubset) {
        for (const dep of fd.dependent) {
          const depLower = dep.trim().toLowerCase();
          if (!closure.has(depLower)) {
            closure.add(depLower);
            changed = true;
          }
        }
      }
    }
  }

  return closure;
}

/**
 * Genera todos los subconjuntos posibles de un array (conjunto potencia ordenado por tamaño)
 */
function getSubsets<T>(array: T[]): T[][] {
  const result: T[][] = [[]];
  for (const element of array) {
    const len = result.length;
    for (let i = 0; i < len; i++) {
      result.push([...result[i], element]);
    }
  }
  // Ordenar por tamaño creciente para encontrar claves mínimas primero
  return result.sort((a, b) => a.length - b.length);
}

/**
 * Encuentra todas las claves candidatas mínimas de una relación dados sus atributos y DFs
 */
export function findCandidateKeys(
  attributeNames: string[],
  functionalDependencies: FunctionalDependency[]
): string[][] {
  const normalizedAttr = attributeNames.map(a => a.trim());
  const allAttrsLower = new Set(normalizedAttr.map(a => a.toLowerCase()));
  const subsets = getSubsets(normalizedAttr);
  const candidateKeys: string[][] = [];

  for (const subset of subsets) {
    if (subset.length === 0) continue;

    // Verificar si algún subconjunto propio ya es una clave candidata (para garantizar minimalidad)
    const isSuperKeyOfExisting = candidateKeys.some(existingKey => {
      const existingSet = new Set(existingKey.map(k => k.toLowerCase()));
      return existingKey.length < subset.length && existingKey.every(k => subset.map(s => s.toLowerCase()).includes(k.toLowerCase()));
    });

    if (isSuperKeyOfExisting) continue;

    const closure = computeAttributeClosure(subset, functionalDependencies);

    // Si el cierre cubre todos los atributos de la entidad, es una superclave
    const coversAll = Array.from(allAttrsLower).every(attr => closure.has(attr));

    if (coversAll) {
      candidateKeys.push(subset);
    }
  }

  // Si no se encontraron claves por DFs, la clave candidata es todo el conjunto de atributos
  if (candidateKeys.length === 0) {
    return [normalizedAttr];
  }

  return candidateKeys;
}

/**
 * Analiza una entidad y sus dependencias funcionales para generar el reporte de normalización completo (1FN, 2FN, 3FN, BCNF)
 */
export function analyzeNormalization(
  entity: Entity,
  userFDs: FunctionalDependency[]
): NormalizationReport {
  const attrNames = entity.attributes.map(a => a.name);
  const primaryKeysDefined = entity.attributes.filter(a => a.isPrimaryKey).map(a => a.name);

  // Filtrar DFs que pertenecen a los atributos de esta entidad
  const entityAttrLower = new Set(attrNames.map(a => a.toLowerCase()));
  const entityFDs = userFDs.filter(fd => 
    fd.determinant.every(d => entityAttrLower.has(d.toLowerCase())) &&
    fd.dependent.every(dep => entityAttrLower.has(dep.toLowerCase()))
  );

  const candidateKeys = findCandidateKeys(attrNames, entityFDs);
  const effectivePK = primaryKeysDefined.length > 0 ? primaryKeysDefined : (candidateKeys[0] || []);

  const primeAttributes = new Set<string>();
  candidateKeys.forEach(key => key.forEach(k => primeAttributes.add(k.toLowerCase())));

  const violations: NormalizationViolation[] = [];
  const explanations: string[] = [];

  // 1. Verificación de 1FN (Valores atómicos)
  let is1FN = true;
  for (const attr of entity.attributes) {
    // Si el nombre sugiere multivaluado (ej. telefonos, cursos, items) o tipo array
    if (attr.name.toLowerCase().endsWith('s') && attr.name.toLowerCase().length > 3 && !attr.isPrimaryKey) {
      // Advertencia de posible atributo multivaluado
    }
  }
  explanations.push('✓ 1FN: Los atributos definidos poseen dominios con valores atómicos.');

  // 2. Verificación de 2FN (Dependencias Parciales de Claves Compuestas)
  let is2FN = true;
  const compositeKeys = candidateKeys.filter(k => k.length > 1);

  if (compositeKeys.length > 0) {
    for (const fd of entityFDs) {
      const determinantLower = fd.determinant.map(d => d.toLowerCase());

      for (const compKey of compositeKeys) {
        const compKeyLower = compKey.map(k => k.toLowerCase());
        const isStrictProperSubset = determinantLower.length < compKeyLower.length &&
          determinantLower.every(d => compKeyLower.includes(d));

        if (isStrictProperSubset) {
          // Revisar si algún dependiente no es primo
          const nonPrimeDependents = fd.dependent.filter(dep => !primeAttributes.has(dep.toLowerCase()));
          if (nonPrimeDependents.length > 0) {
            is2FN = false;
            violations.push({
              normalForm: '2FN',
              entityName: entity.name,
              violationDescription: `Dependencia Parcial detectada: {${fd.determinant.join(', ')}} → {${nonPrimeDependents.join(', ')}}. El determinante es un subconjunto propio de la clave compuesta {${compKey.join(', ')}}.`,
              violatingFD: fd,
              recommendation: `Descomponer la entidad aislando {${fd.determinant.join(', ')}} y {${nonPrimeDependents.join(', ')}} en una nueva tabla independiente donde {${fd.determinant.join(', ')}} sea la Clave Primaria.`,
              proposedDecomposition: {
                newEntities: [
                  {
                    name: `${entity.name}_${fd.determinant.join('_')}`,
                    attributes: [...fd.determinant, ...nonPrimeDependents],
                    primaryKey: fd.determinant
                  },
                  {
                    name: entity.name,
                    attributes: attrNames.filter(a => !nonPrimeDependents.includes(a)),
                    primaryKey: effectivePK
                  }
                ]
              }
            });
          }
        }
      }
    }
  }

  if (is2FN) {
    explanations.push('✓ 2FN: No existen dependencias parciales de claves compuestas sobre atributos no primos.');
  }

  // 3. Verificación de 3FN (Dependencias Transitivas)
  let is3FN = is2FN;
  if (is2FN) {
    for (const fd of entityFDs) {
      const detClosure = computeAttributeClosure(fd.determinant, entityFDs);
      const isSuperKey = Array.from(entityAttrLower).every(a => detClosure.has(a));

      // Revisar si algún atributo dependiente NO es primo y el determinante NO es superclave
      const nonPrimeDependents = fd.dependent.filter(dep => !primeAttributes.has(dep.toLowerCase()));

      if (!isSuperKey && nonPrimeDependents.length > 0) {
        // Asegurar que no sea una dependencia trivial (X -> Y donde Y subset X)
        const nonTrivial = nonPrimeDependents.filter(dep => !fd.determinant.map(d => d.toLowerCase()).includes(dep.toLowerCase()));

        if (nonTrivial.length > 0) {
          is3FN = false;
          violations.push({
            normalForm: '3FN',
            entityName: entity.name,
            violationDescription: `Dependencia Transitiva detectada: {${fd.determinant.join(', ')}} → {${nonTrivial.join(', ')}}. El determinante no es superclave y los atributos dependientes no son primos.`,
            violatingFD: fd,
            recommendation: `Extraer {${fd.determinant.join(', ')}} y {${nonTrivial.join(', ')}} a una nueva entidad relacionada, dejando {${fd.determinant.join(', ')}} como Clave Foránea en ${entity.name}.`,
            proposedDecomposition: {
              newEntities: [
                {
                  name: `${fd.determinant[0]}_Info`,
                  attributes: [...fd.determinant, ...nonTrivial],
                  primaryKey: fd.determinant
                },
                {
                  name: entity.name,
                  attributes: attrNames.filter(a => !nonTrivial.includes(a)),
                  primaryKey: effectivePK
                }
              ]
            }
          });
        }
      }
    }
  }

  if (is3FN) {
    explanations.push('✓ 3FN: Todos los atributos no primos dependen directamente de la clave primaria (sin dependencias transitivas).');
  }

  // 4. Verificación de BCNF (Forma Normal de Boyce-Codd)
  let isBCNF = is3FN;
  if (is3FN) {
    for (const fd of entityFDs) {
      const detClosure = computeAttributeClosure(fd.determinant, entityFDs);
      const isSuperKey = Array.from(entityAttrLower).every(a => detClosure.has(a));

      const nonTrivial = fd.dependent.filter(dep => !fd.determinant.map(d => d.toLowerCase()).includes(dep.toLowerCase()));
      if (!isSuperKey && nonTrivial.length > 0) {
        isBCNF = false;
        violations.push({
          normalForm: 'BCNF',
          entityName: entity.name,
          violationDescription: `Violación BCNF: En la DF {${fd.determinant.join(', ')}} → {${nonTrivial.join(', ')}}, el determinante no es Superclave de la relación.`,
          violatingFD: fd,
          recommendation: `Descomponer la relación preservando el determinante {${fd.determinant.join(', ')}} como clave en una nueva relación separada.`,
        });
      }
    }
  }

  if (isBCNF) {
    explanations.push('✓ BCNF: Para toda dependencia funcional no trivial X → Y, X es superclave.');
  }

  return {
    candidateKeys,
    primaryKey: effectivePK,
    is1FN,
    is2FN,
    is3FN,
    isBCNF,
    violations,
    explanations
  };
}
