import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

// === CONFIGURACIÓN ===
const serviceAccountPath = path.resolve(__dirname, 'credencialesFirebase.json');
const projectId = 'licitacioneslucasrojas-26381'; // tu project_id
const databaseId = 'licitaciones'; // base de datos nombrada
const collectionId = 'licitaciones'; // colección que quieres modificar
// =======================

// === Paso 1: Obtener token de acceso ===
async function getAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    keyFile: './credencialesFirebase.json',
    scopes: ['https://www.googleapis.com/auth/datastore'],
  });

  const client = await auth.getClient();

  try {
    // getAccessToken() puede retornar { token: string } o directamente string
    const tokenResponse = await client.getAccessToken();

    if (
      !tokenResponse ||
      typeof tokenResponse !== 'object' ||
      !tokenResponse.token
    ) {
      throw new Error('No se pudo obtener el token de acceso');
    }

    return tokenResponse.token;
  } catch (err) {
    console.error('Error interno al obtener token:', err);
    throw new Error('No se pudo obtener el token de acceso');
  }
}

// === Paso 2: Leer y actualizar documentos ===
async function migrateItems() {
  const token = await getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionId}`;

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Obtener todos los documentos
  const { data } = await axios.get(url, { headers });

  if (!data.documents) {
    console.log('No se encontraron documentos en la colección.');
    return;
  }

  for (const doc of data.documents) {
    const docId = doc.name.split('/').pop();
    const fields = doc.fields;

    let currentItem = fields?.item;

    if (!currentItem) {
      console.log(`[SKIP] Documento ${docId} no tiene campo item.`);
      continue;
    }

    // Convertir solo si es string numérico
    if (currentItem.stringValue) {
      const cleaned = currentItem.stringValue.trim();
      const parsed = Number(cleaned);

      if (!isNaN(parsed)) {
        console.log(`[UPDATE] ${docId}: item "${cleaned}" -> ${parsed}`);

        // Actualizar campo "item"
        const updateUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionId}/${docId}?updateMask.fieldPaths=item`;

        await axios.patch(
          updateUrl,
          {
            fields: {
              item: { integerValue: parsed.toString() },
            },
          },
          { headers }
        );
      } else {
        console.log(`[SKIP] ${docId}: item no es numérico ("${cleaned}")`);
      }
    } else {
      console.log(`[SKIP] ${docId}: item no es string.`);
    }
  }
}

migrateItems().catch(console.error);
