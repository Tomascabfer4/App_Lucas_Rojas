import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';

// === CONFIGURACIÓN ===
const serviceAccountPath = 'key.json';
const projectId = 'licitacioneslucasrojas-26381';
const databaseId = 'licitaciones'; // 🔹 Se actualiza la base de datos
const collectionName = 'licitaciones';

// === Obtener token de acceso ===
async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: serviceAccountPath,
    scopes: ['https://www.googleapis.com/auth/datastore'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse?.token) {
    throw new Error('No se pudo obtener el token de acceso');
  }
  return tokenResponse.token;
}

// === Obtener documentos de Firestore ===
async function getFirestoreDocuments() {
  const token = await getAccessToken();
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionName}`;
  
  let documents = [];
  let nextPageToken;

  console.log('🚀 Obteniendo documentos desde Firestore...\n');

  do {
    const response = await axios.get(baseUrl, {
      headers: { Authorization: `Bearer ${token}` },
      params: { pageSize: 100, pageToken: nextPageToken },
    });

    documents = [...documents, ...(response.data.documents || [])];
    nextPageToken = response.data.nextPageToken;
  } while (nextPageToken);

  console.log(`✅ Total documentos obtenidos: ${documents.length}`);
  return documents;
}

// === Actualizar documentos en Firestore ===
async function updateFirestoreDocuments() {
  const token = await getAccessToken();
  const documents = await getFirestoreDocuments();

  console.log('🚀 Actualizando documentos...\n');

  for (const doc of documents) {
    const docId = doc.name.split('/').pop();
    const fields = doc.fields || {};

    let updatedFields = {};
    Object.keys(fields).forEach(key => {
      if (fields[key].doubleValue === 0) {
        updatedFields[key] = { nullValue: null }; // ✅ Cambia 0 por null sin comillas
      } else {
        updatedFields[key] = fields[key]; // Mantiene los demás valores
      }
    });

    const updateUrl = `https://firestore.googleapis.com/v1/${doc.name}`;
    try {
      await axios.patch(
        updateUrl,
        { fields: updatedFields },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(`✔ Documento ${docId} actualizado`);
    } catch (error) {
      console.error(`❌ Error actualizando ${docId}:`, error.response?.data || error.message);
    }
  }

  console.log('\n✅ Proceso de actualización completado.');
}

// Ejecutar la actualización
updateFirestoreDocuments()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error en la actualización:', err);
    process.exit(1);
  });