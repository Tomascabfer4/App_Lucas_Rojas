import { Injectable } from '@angular/core';
import { Firestore, collection, query, orderBy, getDocs } from '@angular/fire/firestore';
import { Licitacion } from '../interfaces/licitacion';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {

  constructor(private firestore: Firestore) { }

  async getTodasLicitaciones(): Promise<Licitacion[]> {
    const ref = collection(this.firestore, 'licitaciones');
    const q = query(ref, orderBy('fechapresentacion', 'desc'));
    const querySnapshot = await getDocs(q);

    // Mapea cada documento a la interfaz Licitacion y agrega el firebaseId si es necesario.
    const licitaciones = querySnapshot.docs.map(doc => {
      const data = doc.data() as Licitacion;
      // Puedes añadir el ID de Firestore para identificar cada registro.
      return { ...data, firebaseid: doc.id };
    });

    return licitaciones;
  }
}
