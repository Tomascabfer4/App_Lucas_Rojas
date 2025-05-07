import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Cargar credenciales de la cuenta de servicio
const serviceAccountPath = path.resolve(__dirname, 'credencialesAdminFirebase.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const PERSONAS_EMPRESA: string[] = [
  'JUAN SANCHEZ',
  'JOSÉ M QUERO',
  'JUAN G. MARTINEZ',
  'MARIA JOSE FERNANDEZ',
  'MIGUEL JURADO',
  'ELENA ALCAIDE',
  'SARA REYES',
  'SILVIA ALCAIDE',
  'SANTIAGO MONTEJO',
  'PILAR MARÍN'
];

function generateEmail(name: string): string {
  // Convertir a minúsculas y normalizar para quitar acentos
  let emailName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Reemplazar espacios por puntos
  emailName = emailName.replace(/\s+/g, '.');
  // Remover caracteres que no sean letras, números o puntos
  emailName = emailName.replace(/[^a-z0-9\.]/g, '');
  return `${emailName}@lucasrojas.com`;
}

function generatePassword(userName: string): string {
  // Eliminar espacios del nombre
  let sanitizedName = userName.replace(/\s+/g, '');
  // Eliminar acentos (tildes)
  sanitizedName = sanitizedName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Eliminar puntos
  sanitizedName = sanitizedName.replace(/\./g, '');
  // Generar un número aleatorio de 4 dígitos (entre 1000 y 9999)
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;
  return `${sanitizedName}${randomNumber}`;
}

async function createUsers() {
  for (const person of PERSONAS_EMPRESA) {
    const email = generateEmail(person);
    const password = generatePassword(person);
    const displayName = person; // Usamos el nombre como alias

    // Intentar eliminar el usuario si ya existe
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      console.log(`El usuario ${email} ya existe. Eliminándolo...`);
      await admin.auth().deleteUser(userRecord.uid);
      console.log(`Usuario eliminado: ${email}`);
    } catch (error) {
      // Si el error indica que el usuario no existe, seguimos
      // console.error(error);
    }

    // Crear el usuario con los datos generados
    try {
      const newUser = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: displayName
      });
      console.log(`Usuario creado: ${newUser.uid} (${displayName})`);
      console.log(`Email: ${email} - Password: ${password}`);
    } catch (error) {
      console.error(`Error creando el usuario ${displayName}:`, error);
    }
  }
}

createUsers()
  .then(() => {
    console.log('Proceso de creación de usuarios completado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error durante la creación de usuarios:', error);
    process.exit(1);
  });
