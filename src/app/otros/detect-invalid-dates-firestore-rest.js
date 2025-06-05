/**
 * detect-invalid-dates-firestore-rest.js
 *
 * Lee Firestore mediante la API REST y muestra en consola
 * todos los IDs de documentos de la colección “licitaciones”
 * cuya propiedad `fechapresentacion` sea inválida.
 * 
 * El endpoint REST de Firestore devuelve solo hasta 100 documentos
 * por petición. Este script implementa paginación para recuperar todos.
 *
 * Pasos:
 * 1. Coloca este archivo junto a tu JSON de credenciales (credencialesFirebase.json).
 * 2. Ajusta projectId, databaseId y collectionId según tu proyecto.
 * 3. Instala dependencias:
 *      npm install axios google-auth-library
 * 4. Ejecuta:
 *      node detect-invalid-dates-firestore-rest.js
 */

const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');

// -----------------------------
// 1. CONFIGURACIÓN
// -----------------------------
const serviceAccountPath = path.resolve(__dirname, 'credencialesFirebase.json');
// Project ID tal como aparece en tu JSON de credenciales
const projectId = 'licitacioneslucasrojas-26381';
// Database ID (en tu caso “licitaciones”)
const databaseId = 'licitaciones';
// Nombre de la colección donde están las licitaciones
const collectionId = 'licitaciones';
// Tamaño máximo de página (Firestore REST permite hasta 1000)
const PAGE_SIZE = 1000;
// -----------------------------

// -----------------------------
// 2. Obtener token de acceso
// -----------------------------
async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: serviceAccountPath,
    scopes: ['https://www.googleapis.com/auth/datastore'],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();

  if (!tokenResponse || typeof tokenResponse !== 'object' || !tokenResponse.token) {
    throw new Error('No se pudo obtener el token de acceso');
  }
  return tokenResponse.token;
}

// -----------------------------
// 3. Criterio para fecha inválida
// -----------------------------
function esFechaInvalida(doc) {
  const fields = doc.fields || {};
  const rawField = fields.fechapresentacion;

  if (!rawField) {
    // No existe fechapresentacion → inválida
    return true;
  }

  let rawValue = '';
  if (rawField.timestampValue) {
    rawValue = rawField.timestampValue;
  } else if (rawField.stringValue) {
    rawValue = rawField.stringValue;
  } else {
    // Otro tipo (integerValue, etc.) → inválido
    return true;
  }

  if (rawValue.toString().trim() === '') {
    return true;
  }

  const d = new Date(rawValue);
  if (isNaN(d.getTime())) {
    return true;
  }

  const year = d.getFullYear();
  if (year === 1970 && rawValue.toString().indexOf('1970') < 0) {
    return true;
  }

  return false;
}

// -----------------------------
// 4. Función para recuperar todos los documentos con paginación
// -----------------------------
async function fetchAllDocuments(token) {
  const docs = [];
  let nextPageToken = undefined;
  const baseURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionId}`;

  do {
    // Construir URL con pageSize y, si existe, pageToken
    let url = `${baseURL}?pageSize=${PAGE_SIZE}`;
    if (nextPageToken) {
      url += `&pageToken=${nextPageToken}`;
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = response.data;

    if (Array.isArray(data.documents)) {
      docs.push(...data.documents);
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return docs;
}

// -----------------------------
// 5. Función principal
// -----------------------------
async function main() {
  try {
    console.log('🔍 Obteniendo token de acceso...');
    const token = await getAccessToken();

    console.log('➡️  Recuperando todos los documentos con paginación...');
    const documents = await fetchAllDocuments(token);
    console.log(`➡️  Se recuperaron ${documents.length} documento(s).`);

    // Filtra solo IDs con fecha inválida
    const invalidIds = documents
      .filter(esFechaInvalida)
      .map(doc => doc.name.split('/').pop());

    if (invalidIds.length === 0) {
      console.log('✅ Ninguna licitación con fecha inválida.');
    } else {
      console.log(`\n❗ ${invalidIds.length} licitacione(s) con fecha inválida (IDs):`);
      invalidIds.forEach((id, idx) => {
        console.log(`${idx + 1}. ${id}`);
      });
    }
  } catch (err) {
    console.error('❌ Error:', err.message || err);
  }
}

main();
