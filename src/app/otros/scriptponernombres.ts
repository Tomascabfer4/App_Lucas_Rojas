import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURACIÓN ---
// Ruta a tu archivo de credenciales de la cuenta de servicio de Firebase Admin SDK
// Asegúrate de que este archivo esté en un lugar seguro y no se exponga públicamente.
const serviceAccountPath = path.resolve(__dirname, 'credencialesAdminFirebase.json');

// Mapeo de correos electrónicos a los nombres que quieres asignar como displayName
// Puedes modificar este mapeo si los nombres deseados son diferentes a la parte antes del @
const emailToDisplayNameMap: { [email: string]: string } = {
  "mobiliario@lucasrojas.com": "Mobiliario", // Ejemplo: Usar mayúscula inicial
  "facturacion@lucasrojas.com": "Facturación",
  "ventas@lucasrojas.com": "Ventas",
  "tomas@tomas.com": "Tomas", // O el nombre completo de la persona si lo tienes
  "informaticalucasrojas24@gmail.com": "Informatica24", // Puedes asignar un nombre más amigable
  "informatica@lucasrojas.com": "Informatica",
  "025@lucasrojas.com": "SILVIA ALCAIDE",
  "022@lucasrojas.com": "MIGUEL JURADO",
  "licitacioneslucasrojas@gmail.com": "Licitaciones"
};
// --- FIN CONFIGURACIÓN ---


// Cargar credenciales de la cuenta de servicio
let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error(`Error al cargar el archivo de credenciales: ${serviceAccountPath}`);
  console.error('Asegúrate de que el archivo existe y es un JSON válido.');
  process.exit(1); // Salir si no se pueden cargar las credenciales
}


// Inicializar Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK inicializado correctamente.');
} catch (error) {
  console.error('Error al inicializar Firebase Admin SDK:', error);
  process.exit(1); // Salir si falla la inicialización
}


/**
 * Busca usuarios por su correo electrónico y actualiza su displayName.
 */
async function updateUserDisplayNames() {
  const emailsToUpdate = Object.keys(emailToDisplayNameMap);
  let updatedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  console.log(`Iniciando actualización de displayName para ${emailsToUpdate.length} correos electrónicos.`);

  for (const email of emailsToUpdate) {
    const desiredDisplayName = emailToDisplayNameMap[email];

    try {
      // 1. Buscar el usuario por correo electrónico
      const userRecord = await admin.auth().getUserByEmail(email);
      const uid = userRecord.uid;

      console.log(`Usuario encontrado para ${email} (UID: ${uid}).`);

      // 2. Actualizar el displayName del usuario
      await admin.auth().updateUser(uid, {
        displayName: desiredDisplayName
      });

      console.log(`DisplayName actualizado para ${email} a "${desiredDisplayName}".`);
      updatedCount++;

    } catch (error: any) {
      // Manejar errores específicos (usuario no encontrado) o generales
      if (error.code === 'auth/user-not-found') {
        console.warn(`Usuario no encontrado para el correo: ${email}. No se pudo actualizar.`);
        notFoundCount++;
      } else {
        console.error(`Error al actualizar el usuario ${email}:`, error);
        errorCount++;
      }
    }
  }

  console.log('\n--- Resumen del Proceso ---');
  console.log(`Intentos de actualización: ${emailsToUpdate.length}`);
  console.log(`Usuarios actualizados con éxito: ${updatedCount}`);
  console.log(`Usuarios no encontrados: ${notFoundCount}`);
  console.log(`Errores al actualizar: ${errorCount}`);
  console.log('--------------------------');
}

// Ejecutar la función principal
updateUserDisplayNames()
  .then(() => {
    console.log('Proceso de actualización de displayName completado.');
    process.exit(0); // Salir con éxito
  })
  .catch((error) => {
    console.error('Ocurrió un error inesperado durante el proceso:', error);
    process.exit(1); // Salir con código de error
  });