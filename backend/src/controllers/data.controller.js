import { db, connectToDatabase, executeInitSql } from '../config/db.config.js';

export const dataController = {
  // Estado de la base de datos
  async getStatus(req, res) {
    try {
      const connected = db.isConnected();
      const isSupabase = db.isSupabase();
      const currentUrl = db.getCurrentUrl();

      let tables = ['clientes', 'mascotas', 'veterinarios', 'citas_medicas', 'system_users'];
      let counts = {};

      if (connected) {
        for (const tbl of tables) {
          try {
            const countRes = await db.query(`SELECT COUNT(*) FROM ${tbl}`);
            counts[tbl] = parseInt(countRes.rows[0].count, 10);
          } catch (e) {
            counts[tbl] = 0;
          }
        }
      } else {
        tables.forEach(tbl => {
          counts[tbl] = (db.fallbackStorage.get(tbl) || []).length;
        });
      }

      res.json({
        connected,
        provider: isSupabase ? 'Supabase (PostgreSQL Cloud)' : (connected ? 'PostgreSQL Local / AWS' : 'Simulador Reactivo en Memoria'),
        isSupabase,
        urlMasked: currentUrl,
        tables,
        counts
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Conectar dinámicamente a Supabase o PostgreSQL
  async connect(req, res) {
    const { connectionString, runInit } = req.body;
    if (!connectionString) {
      return res.status(400).json({ error: 'Debes proporcionar una cadena de conexión válida (ej: postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres)' });
    }

    try {
      const result = await connectToDatabase(connectionString);
      let initResult = null;
      if (runInit) {
        initResult = await executeInitSql();
      }

      res.json({
        success: true,
        message: `¡Conexión exitosa a ${result.isSupabase ? 'Supabase Cloud' : 'PostgreSQL'}!`,
        serverTime: result.time,
        initResult
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: `Error conectando a la base de datos: ${err.message}`
      });
    }
  },

  // Ejecutar el DDL / Seeders
  async initSchema(req, res) {
    try {
      const result = await executeInitSql();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Listar registros de una tabla
  async listTableRecords(req, res) {
    const { table } = req.params;
    const safeTable = table.replace(/[^a-zA-Z0-9_]/g, '');

    try {
      if (db.isConnected()) {
        const queryRes = await db.query(`SELECT * FROM ${safeTable} ORDER BY id DESC LIMIT 100`);
        return res.json({ table: safeTable, records: queryRes.rows, source: 'postgresql' });
      }

      // Fallback
      const records = db.fallbackStorage.get(safeTable) || [];
      res.json({ table: safeTable, records, source: 'fallback_memory' });
    } catch (err) {
      res.status(500).json({ error: `Error consultando tabla ${safeTable}: ${err.message}` });
    }
  },

  // Crear nuevo registro (C de CRUD)
  async createRecord(req, res) {
    const { table } = req.params;
    const safeTable = table.replace(/[^a-zA-Z0-9_]/g, '');
    const data = req.body;

    try {
      if (db.isConnected()) {
        const keys = Object.keys(data).filter(k => k !== 'id' && data[k] !== undefined && data[k] !== '');
        if (keys.length === 0) return res.status(400).json({ error: 'No se enviaron campos válidos' });

        const columns = keys.join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const values = keys.map(k => data[k]);

        const query = `INSERT INTO ${safeTable} (${columns}) VALUES (${placeholders}) RETURNING *`;
        const insertRes = await db.query(query, values);
        return res.status(201).json({ success: true, record: insertRes.rows[0], source: 'postgresql' });
      }

      // Fallback
      const currentList = db.fallbackStorage.get(safeTable) || [];
      const newId = currentList.length > 0 ? Math.max(...currentList.map(r => Number(r.id) || 0)) + 1 : 1;
      const newRec = { id: newId, ...data };
      currentList.unshift(newRec);
      db.fallbackStorage.set(safeTable, currentList);

      res.status(201).json({ success: true, record: newRec, source: 'fallback_memory' });
    } catch (err) {
      res.status(500).json({ error: `Error insertando en ${safeTable}: ${err.message}` });
    }
  },

  // Actualizar registro (U de CRUD)
  async updateRecord(req, res) {
    const { table, id } = req.params;
    const safeTable = table.replace(/[^a-zA-Z0-9_]/g, '');
    const data = req.body;

    try {
      if (db.isConnected()) {
        const keys = Object.keys(data).filter(k => k !== 'id');
        if (keys.length === 0) return res.status(400).json({ error: 'Sin campos para actualizar' });

        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const values = [...keys.map(k => data[k]), id];

        const query = `UPDATE ${safeTable} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
        const updateRes = await db.query(query, values);
        if (updateRes.rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });

        return res.json({ success: true, record: updateRes.rows[0], source: 'postgresql' });
      }

      // Fallback
      const currentList = db.fallbackStorage.get(safeTable) || [];
      const index = currentList.findIndex(r => String(r.id) === String(id));
      if (index === -1) return res.status(404).json({ error: 'Registro no encontrado' });

      currentList[index] = { ...currentList[index], ...data, id: currentList[index].id };
      db.fallbackStorage.set(safeTable, currentList);

      res.json({ success: true, record: currentList[index], source: 'fallback_memory' });
    } catch (err) {
      res.status(500).json({ error: `Error actualizando ${safeTable}: ${err.message}` });
    }
  },

  // Eliminar registro (D de CRUD)
  async deleteRecord(req, res) {
    const { table, id } = req.params;
    const safeTable = table.replace(/[^a-zA-Z0-9_]/g, '');

    try {
      if (db.isConnected()) {
        await db.query(`DELETE FROM ${safeTable} WHERE id = $1`, [id]);
        return res.json({ success: true, message: `Registro ${id} eliminado de ${safeTable}.` });
      }

      // Fallback
      const currentList = db.fallbackStorage.get(safeTable) || [];
      const filtered = currentList.filter(r => String(r.id) !== String(id));
      db.fallbackStorage.set(safeTable, filtered);

      res.json({ success: true, message: `Registro ${id} eliminado.` });
    } catch (err) {
      res.status(500).json({ error: `Error eliminando de ${safeTable}: ${err.message}` });
    }
  }
};
