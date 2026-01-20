const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Helper function to parse connection string
function parseConnectionString(connectionString) {
  const match = connectionString.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) return null;
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5]
  };
}

async function setup() {
  let adminConfig;
  
  if (process.env.DATABASE_URL) {
    const config = parseConnectionString(process.env.DATABASE_URL);
    if (config) {
      adminConfig = {
        ...config,
        database: 'postgres' // Override to connect to default DB first
      };
    }
  }

  // Fallback if no env var
  if (!adminConfig) {
    adminConfig = {
      user: 'postgres',
      password: 'postgres', 
      host: 'localhost',
      port: 5432,
      database: 'postgres',
    };
  }

  const adminClient = new Client(adminConfig);

  try {
    console.log('Intentando conectar a PostgreSQL...');
    await adminClient.connect();
    
    // Verificar si existe la base de datos
    const res = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = 'billforge'");
    if (res.rowCount === 0) {
      console.log("Creando base de datos 'billforge'...");
      await adminClient.query('CREATE DATABASE billforge');
      console.log("Base de datos creada.");
    } else {
      console.log("La base de datos 'billforge' ya existe.");
    }
  } catch (err) {
    console.error('Error conectando a PostgreSQL o creando DB:', err.message);
    if (err.code === '28P01') {
      console.error('❌ Error de autenticación. Por favor verifica tu contraseña de PostgreSQL en el archivo .env o créala manualmente en pgAdmin.');
    }
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // Ahora conectar a la nueva base de datos para ejecutar schema y seeds
  const dbConfig = {
    ...adminConfig,
    database: 'billforge',
  };

  const client = new Client(dbConfig);

  try {
    console.log("Conectando a 'billforge' para aplicar esquema...");
    await client.connect();

    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const seedPath = path.join(__dirname, '../db/seed_demo.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('Ejecutando schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('Esquema aplicado.');
    }

    // Verificar si ya hay datos para evitar duplicados masivos (opcional, pero buena práctica)
    // Simplemente ejecutaremos el seed, asumiendo que es idempotente o para desarrollo inicial
    if (fs.existsSync(seedPath)) {
      console.log('Ejecutando seed_demo.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await client.query(seedSql);
      console.log('Datos de prueba insertados.');
    }

    console.log('✅ Configuración de base de datos completada exitosamente.');

  } catch (err) {
    console.error('Error aplicando esquema/datos:', err);
  } finally {
    await client.end();
  }
}

setup();
