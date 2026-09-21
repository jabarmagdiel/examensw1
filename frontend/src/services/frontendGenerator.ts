import JSZip from 'jszip';
import { DiagramModel, Entity } from '../types/case';

/**
 * Genera el paquete completo de Frontend React para interactuar con la API REST de Spring Boot
 */
export async function generateFrontendProject(diagram: DiagramModel): Promise<Blob> {
  const zip = new JSZip();
  const projectRoot = `frontend-react-${diagram.name.toLowerCase().replace(/\s+/g, '-')}`;

  // package.json
  zip.file(
    `${projectRoot}/package.json`,
    JSON.stringify(
      {
        name: `${diagram.name.toLowerCase().replace(/\s+/g, '-')}-frontend`,
        private: true,
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.359.0'
        },
        devDependencies: {
          '@types/react': '^18.2.66',
          '@types/react-dom': '^18.2.22',
          '@vitejs/plugin-react': '^4.2.1',
          vite: '^5.1.6'
        }
      },
      null,
      2
    )
  );

  // index.html
  zip.file(
    `${projectRoot}/index.html`,
    `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cliente de Pruebas - ${diagram.name}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
</head>
<body style="background-color: #0f172a; color: #f8fafc; padding: 2rem;">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
</body>
</html>`
  );

  // vite.config.js
  zip.file(
    `${projectRoot}/vite.config.js`,
    `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
});`
  );

  // src/main.jsx
  zip.file(
    `${projectRoot}/src/main.jsx`,
    `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
  );

  // src/App.jsx
  zip.file(
    `${projectRoot}/src/App.jsx`,
    generateReactAppSource(diagram)
  );

  // README.md
  zip.file(
    `${projectRoot}/README.md`,
    `# Frontend CRUD - ${diagram.name}

Generado automáticamente para la verificación y pruebas del backend Spring Boot.

## Ejecución
\`\`\`bash
npm install
npm run dev
\`\`\`
Abre tu navegador en http://localhost:3000. Asegúrate de tener corriendo el backend Spring Boot en http://localhost:8080.
`
  );

  return await zip.generateAsync({ type: 'blob' });
}

function generateReactAppSource(diagram: DiagramModel): string {
  return `import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8080/api/v1';

export default function App() {
  const [entities] = useState(${JSON.stringify(diagram.entities.map(e => ({ name: e.name, endpoint: `${e.name.toLowerCase()}s`, attributes: e.attributes })))});
  const [selectedEntity, setSelectedEntity] = useState(entities[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});

  const fetchRecords = async () => {
    if (!selectedEntity) return;
    setLoading(true);
    try {
      const res = await fetch(\`\${API_BASE}/\${selectedEntity.endpoint}\`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.warn('Backend aún no responde en ' + API_BASE, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    setFormData({});
  }, [selectedEntity]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(\`\${API_BASE}/\${selectedEntity.endpoint}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchRecords();
        setFormData({});
      }
    } catch (err) {
      alert('Error creando registro: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar registro ' + id + '?')) return;
    try {
      await fetch(\`\${API_BASE}/\${selectedEntity.endpoint}/\${id}\`, { method: 'DELETE' });
      fetchRecords();
    } catch (err) {
      alert('Error eliminando: ' + err.message);
    }
  };

  return (
    <main className="container" style={{ maxWidth: 1100 }}>
      <header style={{ borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h2>🛠️ Panel de Pruebas Frontend - ${diagram.name}</h2>
        <p style={{ color: '#94a3b8' }}>Conectado a Spring Boot API: <code>{API_BASE}</code></p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {entities.map(ent => (
            <button
              key={ent.name}
              className={selectedEntity?.name === ent.name ? 'contrast' : 'secondary'}
              onClick={() => setSelectedEntity(ent)}
            >
              {ent.name}
            </button>
          ))}
        </div>
      </header>

      {selectedEntity && (
        <section>
          <h3>Gestionar: {selectedEntity.name}</h3>
          
          <form onSubmit={handleCreate} style={{ background: '#1e293b', padding: '1.5rem', borderRadius: 8, marginBottom: '2rem' }}>
            <h4>Nuevo {selectedEntity.name}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {selectedEntity.attributes.filter(a => !a.isPrimaryKey).map(attr => (
                <div key={attr.name}>
                  <label>{attr.name} ({attr.type})</label>
                  <input
                    type={attr.type === 'INTEGER' || attr.type === 'BIGINT' || attr.type === 'DECIMAL' ? 'number' : 'text'}
                    value={formData[attr.name] || ''}
                    onChange={e => setFormData({ ...formData, [attr.name]: e.target.value })}
                    required={!attr.isNullable}
                  />
                </div>
              ))}
            </div>
            <button type="submit" style={{ marginTop: '1rem' }}>Guardar Registro</button>
          </form>

          <h4>Registros ({records.length})</h4>
          {loading ? <p>Cargando registros...</p> : (
            <figure>
              <table>
                <thead>
                  <tr>
                    {selectedEntity.attributes.map(a => <th key={a.name}>{a.name}</th>)}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan={selectedEntity.attributes.length + 1} style={{ textAlign: 'center' }}>No hay registros disponibles.</td></tr>
                  ) : records.map(rec => (
                    <tr key={rec.id}>
                      {selectedEntity.attributes.map(a => <td key={a.name}>{String(rec[a.name] ?? '')}</td>)}
                      <td>
                        <button className="outline secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => handleDelete(rec.id)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
          )}
        </section>
      )}
    </main>
  );
}
`;
}
