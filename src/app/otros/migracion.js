import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

// === CONFIGURACIÓN ===
const serviceAccountPath = './key.json';
const projectId = 'licitacioneslucasrojas-26381';
const databaseId = 'licitaciones'; // base de datos nombrada
const collectionName = 'licitaciones';

// === Obtener token de acceso ===
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

// === Generar cliente_search_terms ===
function generateSearchTerms(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Elimina signos de puntuación
    .split(/\s+/)
    .filter(term => term.length > 0);
}

// === Migrar documentos ===
async function migrate() {
  const token = await getAccessToken();

  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionName}`;
  let nextPageToken = undefined;

  let totalDocs = 0;
  let updatedDocs = 0;

  console.log('Iniciando migración de cliente_search_terms...\n');

  do {
    const response = await axios.get(baseUrl, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        pageSize: 100,
        pageToken: nextPageToken,
      },
    });

    const documents = response.data.documents || [];
    nextPageToken = response.data.nextPageToken;

    for (const doc of documents) {
      totalDocs++;
      const docName = doc.name; // Ej: projects/.../documents/licitaciones/abc123
      const fields = doc.fields || {};
      const cliente = fields.cliente?.stringValue;
      const searchTerms = generateSearchTerms(cliente);

      if (!fields.cliente_search_terms && cliente) {
        const patchUrl = `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=cliente_search_terms`;

        await axios.patch(
          patchUrl,
          {
            fields: {
              cliente_search_terms: {
                arrayValue: {
                  values: searchTerms.map(term => ({ stringValue: term }))
                }
              }
            }
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log(`✔ Actualizado: ${docName}`);
        updatedDocs++;
      } else {
        console.log(`⏩ Saltado (ya tiene el campo o cliente vacío): ${docName}`);
      }
    }

  } while (nextPageToken);

  console.log('\n✅ Migración completada.');
  console.log(`Total documentos leídos: ${totalDocs}`);
  console.log(`Documentos actualizados: ${updatedDocs}`);
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error en la migración:', err);
    process.exit(1);
  });
