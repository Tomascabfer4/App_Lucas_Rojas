import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Constantes } from '../interfaces/constantes'; // Asegúrate de tener definida esta interfaz

@Injectable({
  providedIn: 'root'
})
export class ConstantesService {

  // Ruta del documento en Firestore: colección "constantes", documento "datos"
  private constantesDocPath = 'constantes/constantes';

  constructor(private firestore: Firestore) { }

  /**
   * Recupera el documento de constantes desde Firestore.
   * @returns Una promesa que resuelve con un objeto de tipo Constantes.
   */
  async getConstantes(): Promise<Constantes> {
    const docRef = doc(this.firestore, this.constantesDocPath);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Constantes;
    } else {
      throw new Error('El documento de constantes no existe en Firestore.');
    }
  }

}
