import JSZip from 'jszip';
import { Attribute, DataType, DiagramModel, Entity, Relationship } from '../types/case';

function mapDataTypeToJava(type: DataType): string {
  switch (type) {
    case 'INTEGER':
      return 'Integer';
    case 'BIGINT':
      return 'Long';
    case 'BOOLEAN':
      return 'Boolean';
    case 'DATE':
      return 'LocalDate';
    case 'TIMESTAMP':
      return 'LocalDateTime';
    case 'DECIMAL':
      return 'BigDecimal';
    case 'FLOAT':
      return 'Double';
    case 'VARCHAR':
    case 'TEXT':
    default:
      return 'String';
  }
}

function getImportsForEntity(entity: Entity): string[] {
  const imports = new Set<string>();
  imports.add('import jakarta.persistence.*;');
  imports.add('import lombok.*;');

  for (const attr of entity.attributes) {
    if (attr.type === 'DATE') imports.add('import java.time.LocalDate;');
    if (attr.type === 'TIMESTAMP') imports.add('import java.time.LocalDateTime;');
    if (attr.type === 'DECIMAL') imports.add('import java.math.BigDecimal;');
  }

  return Array.from(imports);
}

function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export interface GeneratedFile {
  path: string;
  name: string;
  category: 'Configuration' | 'Model (JPA)' | 'Repository' | 'Service' | 'Controller' | 'DTO' | 'Testing';
  content: string;
  language: 'java' | 'xml' | 'yaml' | 'json' | 'markdown';
}

/**
 * Genera la lista de todos los archivos de código fuente del backend Spring Boot en memoria
 */
export function getSpringBootFiles(
  diagram: DiagramModel,
  basePackage: string = 'com.caseai.backend'
): GeneratedFile[] {
  const packagePath = basePackage.replace(/\./g, '/');
  const files: GeneratedFile[] = [];

  // 1. pom.xml
  files.push({
    path: 'pom.xml',
    name: 'pom.xml',
    category: 'Configuration',
    content: generatePomXml(diagram, basePackage),
    language: 'xml'
  });

  // 2. application.yml
  files.push({
    path: 'src/main/resources/application.yml',
    name: 'application.yml',
    category: 'Configuration',
    content: generateApplicationYml(diagram),
    language: 'yaml'
  });

  // 3. Application.java
  files.push({
    path: `src/main/java/${packagePath}/Application.java`,
    name: 'Application.java',
    category: 'Configuration',
    content: generateMainClass(basePackage),
    language: 'java'
  });

  // 4. Modelos / Entidades JPA
  diagram.entities.forEach(entity => {
    const relationshipsOfEntity = diagram.relationships.filter(
      r => r.sourceEntityId === entity.id || r.targetEntityId === entity.id
    );
    const className = toPascalCase(entity.name);
    files.push({
      path: `src/main/java/${packagePath}/model/${className}.java`,
      name: `${className}.java`,
      category: 'Model (JPA)',
      content: generateEntityClass(entity, relationshipsOfEntity, diagram.entities, basePackage),
      language: 'java'
    });
  });

  // 5. Repositorios
  diagram.entities.forEach(entity => {
    const className = toPascalCase(entity.name);
    files.push({
      path: `src/main/java/${packagePath}/repository/${className}Repository.java`,
      name: `${className}Repository.java`,
      category: 'Repository',
      content: generateRepositoryClass(entity, basePackage),
      language: 'java'
    });
  });

  // 6. DTOs
  diagram.entities.forEach(entity => {
    const className = toPascalCase(entity.name);
    files.push({
      path: `src/main/java/${packagePath}/dto/${className}DTO.java`,
      name: `${className}DTO.java`,
      category: 'DTO',
      content: generateDTOClass(entity, basePackage),
      language: 'java'
    });
  });

  // 7. Services
  diagram.entities.forEach(entity => {
    const className = toPascalCase(entity.name);
    files.push({
      path: `src/main/java/${packagePath}/service/${className}Service.java`,
      name: `${className}Service.java`,
      category: 'Service',
      content: generateServiceClass(entity, basePackage),
      language: 'java'
    });
  });

  // 8. REST Controllers
  diagram.entities.forEach(entity => {
    const className = toPascalCase(entity.name);
    files.push({
      path: `src/main/java/${packagePath}/controller/${className}Controller.java`,
      name: `${className}Controller.java`,
      category: 'Controller',
      content: generateControllerClass(entity, basePackage),
      language: 'java'
    });
  });

  // 9. Postman Collection
  files.push({
    path: 'postman_collection.json',
    name: 'postman_collection.json',
    category: 'Testing',
    content: JSON.stringify(generatePostmanCollection(diagram), null, 2),
    language: 'json'
  });

  // 10. README.md
  files.push({
    path: 'README.md',
    name: 'README.md',
    category: 'Configuration',
    content: generateReadme(diagram),
    language: 'markdown'
  });

  return files;
}

/**
 * Genera el paquete completo de Spring Boot comprimido en un archivo ZIP
 */
export async function generateSpringBootProject(
  diagram: DiagramModel,
  basePackage: string = 'com.caseai.backend'
): Promise<Blob> {
  const zip = new JSZip();
  const projectRoot = `backend-springboot-${diagram.name.toLowerCase().replace(/\s+/g, '-')}`;
  const files = getSpringBootFiles(diagram, basePackage);

  files.forEach(f => {
    zip.file(`${projectRoot}/${f.path}`, f.content);
  });

  return await zip.generateAsync({ type: 'blob' });
}

function generatePomXml(diagram: DiagramModel, basePackage: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.3</version>
        <relativePath/>
    </parent>
    <groupId>${basePackage}</groupId>
    <artifactId>${diagram.name.toLowerCase().replace(/\s+/g, '-')}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>${diagram.name}</name>
    <description>Backend generado automáticamente por CASE-AI Studio (PUDS)</description>
    <properties>
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`;
}

function generateApplicationYml(diagram: DiagramModel): string {
  return `server:
  port: 8080

spring:
  application:
    name: ${diagram.name.toLowerCase().replace(/\s+/g, '-')}
  datasource:
    url: jdbc:h2:mem:caseaidb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driverClassName: org.h2.Driver
    username: sa
    password: 
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
`;
}

function generateMainClass(basePackage: string): string {
  return `package ${basePackage};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("=================================================");
        System.out.println("🚀 Backend CASE-AI iniciado en: http://localhost:8080");
        System.out.println("📁 H2 Database Console en: http://localhost:8080/h2-console");
        System.out.println("=================================================");
    }
}
`;
}

function generateEntityClass(
  entity: Entity,
  relationships: Relationship[],
  allEntities: Entity[],
  basePackage: string
): string {
  const className = toPascalCase(entity.name);
  const tableName = entity.tableName || entity.name.toLowerCase() + 's';
  const imports = getImportsForEntity(entity);

  let fieldsStr = '';

  // Atributos directos
  for (const attr of entity.attributes) {
    const javaType = mapDataTypeToJava(attr.type);
    const fieldName = toCamelCase(attr.name);

    if (attr.isPrimaryKey) {
      fieldsStr += `    @Id\n`;
      if (javaType === 'Long' || javaType === 'Integer') {
        fieldsStr += `    @GeneratedValue(strategy = GenerationType.IDENTITY)\n`;
      }
    } else {
      fieldsStr += `    @Column(name = "${attr.name.toLowerCase()}", nullable = ${attr.isNullable})\n`;
    }

    fieldsStr += `    private ${javaType} ${fieldName};\n\n`;
  }

  // Relaciones
  for (const rel of relationships) {
    const isSource = rel.sourceEntityId === entity.id;
    const otherEntity = allEntities.find(e => e.id === (isSource ? rel.targetEntityId : rel.sourceEntityId));
    if (!otherEntity) continue;

    const otherClassName = toPascalCase(otherEntity.name);
    const otherFieldName = toCamelCase(otherEntity.name);

    if (rel.cardinality === '1:1') {
      if (isSource) {
        fieldsStr += `    @OneToOne\n    @JoinColumn(name = "${otherFieldName}_id")\n    private ${otherClassName} ${otherFieldName};\n\n`;
      } else {
        fieldsStr += `    @OneToOne(mappedBy = "${toCamelCase(entity.name)}")\n    private ${otherClassName} ${otherFieldName};\n\n`;
      }
    } else if (rel.cardinality === '1:N') {
      if (isSource) {
        // El source tiene muchos target
        fieldsStr += `    @OneToMany(mappedBy = "${toCamelCase(entity.name)}", cascade = CascadeType.ALL)\n    private java.util.List<${otherClassName}> ${otherFieldName}List;\n\n`;
      } else {
        // El target pertenece a un source
        fieldsStr += `    @ManyToOne\n    @JoinColumn(name = "${otherFieldName}_id")\n    private ${otherClassName} ${otherFieldName};\n\n`;
      }
    } else if (rel.cardinality === 'N:M') {
      if (isSource) {
        fieldsStr += `    @ManyToMany\n    @JoinTable(\n        name = "${entity.name.toLowerCase()}_${otherEntity.name.toLowerCase()}",\n        joinColumns = @JoinColumn(name = "${toCamelCase(entity.name)}_id"),\n        inverseJoinColumns = @JoinColumn(name = "${otherFieldName}_id")\n    )\n    private java.util.List<${otherClassName}> ${otherFieldName}List;\n\n`;
      } else {
        fieldsStr += `    @ManyToMany(mappedBy = "${toCamelCase(entity.name)}List")\n    private java.util.List<${otherClassName}> ${otherFieldName}List;\n\n`;
      }
    }
  }

  return `package ${basePackage}.model;

${imports.join('\n')}

@Entity
@Table(name = "${tableName}")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ${className} {

${fieldsStr}}
`;
}

function generateRepositoryClass(entity: Entity, basePackage: string): string {
  const className = toPascalCase(entity.name);
  const pkAttr = entity.attributes.find(a => a.isPrimaryKey);
  const pkType = pkAttr ? mapDataTypeToJava(pkAttr.type) : 'Long';

  return `package ${basePackage}.repository;

import ${basePackage}.model.${className};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${className}Repository extends JpaRepository<${className}, ${pkType}> {
}
`;
}

function generateDTOClass(entity: Entity, basePackage: string): string {
  const className = toPascalCase(entity.name);
  let fields = '';

  for (const attr of entity.attributes) {
    const javaType = mapDataTypeToJava(attr.type);
    const fieldName = toCamelCase(attr.name);
    fields += `    private ${javaType} ${fieldName};\n`;
  }

  return `package ${basePackage}.dto;

import lombok.Data;

@Data
public class ${className}DTO {
${fields}}
`;
}

function generateServiceClass(entity: Entity, basePackage: string): string {
  const className = toPascalCase(entity.name);
  const varName = toCamelCase(entity.name);
  const pkAttr = entity.attributes.find(a => a.isPrimaryKey);
  const pkType = pkAttr ? mapDataTypeToJava(pkAttr.type) : 'Long';
  const pkFieldName = pkAttr ? toCamelCase(pkAttr.name) : 'id';

  return `package ${basePackage}.service;

import ${basePackage}.model.${className};
import ${basePackage}.repository.${className}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ${className}Service {

    @Autowired
    private ${className}Repository repository;

    public List<${className}> findAll() {
        return repository.findAll();
    }

    public Optional<${className}> findById(${pkType} id) {
        return repository.findById(id);
    }

    public ${className} save(${className} entity) {
        return repository.save(entity);
    }

    public ${className} update(${pkType} id, ${className} updated) {
        return repository.findById(id).map(existing -> {
            updated.set${toPascalCase(pkFieldName)}(id);
            return repository.save(updated);
        }).orElseThrow(() -> new RuntimeException("${className} no encontrado con ID: " + id));
    }

    public void deleteById(${pkType} id) {
        repository.deleteById(id);
    }
}
`;
}

function generateControllerClass(entity: Entity, basePackage: string): string {
  const className = toPascalCase(entity.name);
  const varName = toCamelCase(entity.name);
  const pkAttr = entity.attributes.find(a => a.isPrimaryKey);
  const pkType = pkAttr ? mapDataTypeToJava(pkAttr.type) : 'Long';
  const endpoint = `/api/v1/${entity.name.toLowerCase()}s`;

  return `package ${basePackage}.controller;

import ${basePackage}.model.${className};
import ${basePackage}.service.${className}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${endpoint}")
@CrossOrigin(origins = "*")
public class ${className}Controller {

    @Autowired
    private ${className}Service service;

    @GetMapping
    public List<${className}> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<${className}> getById(@PathVariable ${pkType} id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<${className}> create(@RequestBody ${className} ${varName}) {
        return new ResponseEntity<>(service.save(${varName}), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<${className}> update(@PathVariable ${pkType} id, @RequestBody ${className} ${varName}) {
        try {
            return ResponseEntity.ok(service.update(id, ${varName}));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable ${pkType} id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
`;
}

function generatePostmanCollection(diagram: DiagramModel): any {
  const items = diagram.entities.map(entity => {
    const endpoint = `http://localhost:8080/api/v1/${entity.name.toLowerCase()}s`;
    const sampleBody: Record<string, any> = {};

    entity.attributes.forEach(attr => {
      if (!attr.isPrimaryKey) {
        if (attr.type === 'INTEGER' || attr.type === 'BIGINT') sampleBody[toCamelCase(attr.name)] = 1;
        else if (attr.type === 'BOOLEAN') sampleBody[toCamelCase(attr.name)] = true;
        else if (attr.type === 'DATE') sampleBody[toCamelCase(attr.name)] = '2026-03-19';
        else if (attr.type === 'DECIMAL' || attr.type === 'FLOAT') sampleBody[toCamelCase(attr.name)] = 99.99;
        else sampleBody[toCamelCase(attr.name)] = `Ejemplo ${attr.name}`;
      }
    });

    return {
      name: `${entity.name} API`,
      item: [
        {
          name: `Listar ${entity.name}s`,
          request: {
            method: 'GET',
            url: { raw: endpoint, host: ['http://localhost:8080'], path: ['api', 'v1', `${entity.name.toLowerCase()}s`] }
          }
        },
        {
          name: `Crear ${entity.name}`,
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: JSON.stringify(sampleBody, null, 2) },
            url: { raw: endpoint, host: ['http://localhost:8080'], path: ['api', 'v1', `${entity.name.toLowerCase()}s`] }
          }
        },
        {
          name: `Obtener ${entity.name} por ID`,
          request: {
            method: 'GET',
            url: { raw: `${endpoint}/1`, host: ['http://localhost:8080'], path: ['api', 'v1', `${entity.name.toLowerCase()}s`, '1'] }
          }
        },
        {
          name: `Eliminar ${entity.name}`,
          request: {
            method: 'DELETE',
            url: { raw: `${endpoint}/1`, host: ['http://localhost:8080'], path: ['api', 'v1', `${entity.name.toLowerCase()}s`, '1'] }
          }
        }
      ]
    };
  });

  return {
    info: {
      name: `CASE-AI - ${diagram.name} API Collection`,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: items
  };
}

function generateReadme(diagram: DiagramModel): string {
  return `# Backend ${diagram.name} (Generado con CASE-AI Studio)

Proyecto generado automáticamente cubriendo el ciclo de diseño e implementación de software bajo metodología PUDS.

## Requisitos
- Java 17 o superior
- Maven 3.8+

## Instrucciones para ejecutar
\`\`\`bash
mvn spring-boot:run
\`\`\`

## Acceso
- API REST Base: http://localhost:8080/api/v1/...
- Consola de Base de Datos H2: http://localhost:8080/h2-console
  - JDBC URL: \`jdbc:h2:mem:caseaidb\`
  - User: \`sa\`
  - Password: *(vacío)*

## Pruebas
Importar el archivo \`postman_collection.json\` en Postman para probar todos los endpoints REST generados.
`;
}
