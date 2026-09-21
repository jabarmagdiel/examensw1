import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;
let isConnected = false;
let currentConnectionString = process.env.DATABASE_URL || 
  (process.env.PGHOST ? `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'casepassword2026'}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'case_db'}` : null);

// Base de datos simulada en memoria en caso de que no haya conexión a PostgreSQL/Supabase
const fallbackStorage = new Map([
  ['clientes', [
    { id: 1, dni: '74839201', nombre_completo: 'Carlos Mendoza', telefono: '+591 71234567', direccion: 'Av. Las Palmas #420' },
    { id: 2, dni: '78493021', nombre_completo: 'Sofía Reyes', telefono: '+591 71239988', direccion: 'Calle Comercio #102' },
    { id: 3, dni: '84930128', nombre_completo: 'Juan Pablo Gómez', telefono: '+591 70011223', direccion: 'Av. América #890' }
  ]],
  ['veterinarios', [
    { id: 1, matricula: 'VET-8832', nombre: 'Dra. Elena Ramos', especialidad: 'Cirugía Menor', telefono: '+591 79876543' },
    { id: 2, matricula: 'VET-4410', nombre: 'Dr. Martín Cáceres', especialidad: 'Medicina Felina', telefono: '+591 76543210' }
  ]],
  ['mascotas', [
    { id: 1, nombre: 'Rocky', especie: 'Canino', raza: 'Golden Retriever', fecha_nacimiento: '2023-04-10', cliente_id: 1 },
    { id: 2, nombre: 'Toby', especie: 'Canino', raza: 'Beagle', fecha_nacimiento: '2022-08-15', cliente_id: 2 },
    { id: 3, nombre: 'Luna', especie: 'Felino', raza: 'Siamés', fecha_nacimiento: '2024-01-20', cliente_id: 3 }
  ]],
  ['citas_medicas', [
    { id: 1, fecha: '2026-09-18', motivo: 'Control anual y vacunación', diagnostico: 'Paciente sano', costo: 120.00, mascota_id: 1, veterinario_id: 1 },
    { id: 2, fecha: '2026-09-19', motivo: 'Revisión dental', diagnostico: 'Limpieza dental recomendada', costo: 85.00, mascota_id: 2, veterinario_id: 2 }
  ]],
  ['system_users', [
    { id: 'usr_migue', name: 'Migue', email: 'migue.director@case-enterprise.com', role: 'Administrador', color: '#f59e0b', status: 'active' },
    { id: 'usr_sofia', name: 'Lic. Sofía Reyes', email: 'sofia.analista@case-enterprise.com', role: 'Analista', color: '#3b82f6', status: 'active' },
    { id: 'usr_alex', name: 'Ing. Alex Rivera', email: 'alex.desarrollador@case-enterprise.com', role: 'Implementador', color: '#10b981', status: 'active' },
    { id: 'usr_carlos', name: 'Arq. Carlos Mendoza', email: 'carlos.disenador@case-enterprise.com', role: 'Diseñador', color: '#a855f7', status: 'active' }
  ]]
]);

export async function connectToDatabase(connStr) {
  if (pool) {
    try { await pool.end(); } catch (e) {}
  }

  currentConnectionString = connStr;
  const isSupabase = connStr.includes('supabase') || connStr.includes('pooler');

  pool = new Pool({
    connectionString: connStr,
    ssl: isSupabase || process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000
  });

  try {
    const res = await pool.query('SELECT NOW()');
    isConnected = true;
    console.log(`🐘 [PostgreSQL] Conexión establecida con éxito (${isSupabase ? 'Supabase Cloud' : 'PostgreSQL Local'}). Servidor:`, res.rows[0].now);
    return { success: true, isSupabase, time: res.rows[0].now };
  } catch (err) {
    isConnected = false;
    console.warn('⚠️ [PostgreSQL] Falló conexión:', err.message);
    throw err;
  }
}

export async function executeInitSql() {
  if (!pool || !isConnected) throw new Error('No hay conexión activa a la base de datos.');

  const sqlPath = path.join(__dirname, '../../init.sql');
  if (!fs.existsSync(sqlPath)) throw new Error('No se encontró archivo init.sql');

  const sql = fs.readFileSync(sqlPath, 'utf-8');
  await pool.query(sql);
  return { success: true, message: 'Esquema y seeders inicializados en la base de datos con éxito.' };
}

// Inicialización automática si hay connection string
if (currentConnectionString) {
  connectToDatabase(currentConnectionString).catch(e => {
    console.warn('ℹ️ Operando con persistencia en memoria.');
  });
}

export const db = {
  query: async (text, params) => {
    if (pool && isConnected) {
      return pool.query(text, params);
    }
    return { rows: [] };
  },
  isConnected: () => isConnected,
  isSupabase: () => Boolean(currentConnectionString && (currentConnectionString.includes('supabase') || currentConnectionString.includes('pooler'))),
  getCurrentUrl: () => currentConnectionString ? currentConnectionString.replace(/:([^:@]+)@/, ':****@') : null,
  fallbackStorage,
  pool
};
