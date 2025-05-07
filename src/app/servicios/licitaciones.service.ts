import { Injectable } from '@angular/core';
import { Firestore, where, collection, query, orderBy, limit, startAfter, getDocs, DocumentSnapshot, doc, deleteDoc, updateDoc, addDoc, getDoc } from '@angular/fire/firestore';
import { Licitacion } from '../interfaces/licitacion';
import { Opcionespaginacion } from '../interfaces/opcionespaginacion';

@Injectable({
  providedIn: 'root'
})
export class LicitacionesService {

  constructor(private firestore: Firestore) { }

  // Este metodo se encarga de obtener una licitaciones de 10 en 10, cuando el usuario desplace hacia el fondo cargaran
  // otros 10 de forma automatica hasta que no existan registros
  // TodaslicitacionesService
  async getDatosPaginados(options: Opcionespaginacion): Promise<{ data: any[], lastVisible: DocumentSnapshot | null }> {
    const ref = collection(this.firestore, 'licitaciones');
    const constraints: any[] = [];

    // Filtrar si se desea mostrar solo adjudicadas
    if (options.adjudicadas) {
      constraints.push(where('estadofinal', '==', 'ADJUDICADA'));
    }

    // Filtro opcional para 'presentadapor'
    if (options.presentadapor && options.presentadapor.trim() !== '') {
      // Convertir el valor a mayúsculas para que coincida con lo almacenado en Firebase
      const normalizedPresentadoPor = options.presentadapor.toUpperCase();
      console.log('Filtro presentadapor (normalizado):', normalizedPresentadoPor);
      constraints.push(where('presentadapor', '==', normalizedPresentadoPor));
    }
    
    // Ordenar por fecha de presentación de forma descendente
    constraints.push(orderBy('fechapresentacion', 'desc'));

    // Filtros opcionales para búsqueda por cliente
    if (options.busquedaCliente && options.busquedaCliente.trim() !== '') {
      constraints.push(
        where('cliente', '>=', options.busquedaCliente),
        where('cliente', '<=', options.busquedaCliente + '\uf8ff')
      );
    }

    // Filtros opcionales para búsqueda por número de expediente
    if (options.numExpediente && options.numExpediente.trim() !== '') {
      constraints.push(
        where('numexpediente', '>=', options.numExpediente),
        where('numexpediente', '<=', options.numExpediente + '\uf8ff')
      );
    }

    // Filtro opcional por rango de fechas
    if (options.desdeFecha && options.desdeFecha.trim() !== '') {
      constraints.push(where('fechapresentacion', '>=', options.desdeFecha));
    }
    if (options.hastaFecha && options.hastaFecha.trim() !== '') {
      constraints.push(where('fechapresentacion', '<=', options.hastaFecha));
    }

    // Paginación: si hay un documento visible anterior, se usa startAfter
    if (options.lastVisible) {
      constraints.push(startAfter(options.lastVisible));
    }
    constraints.push(limit(options.limitNumber));

    const q = query(ref, ...constraints);
    const querySnapshot = await getDocs(q);

    const data = querySnapshot.docs.map(doc => {
      const docData = doc.data();
      return {
        firebaseId: doc.id,
        ...docData
      };
    });

    console.log('Datos mapeados:', data);

    return {
      data,
      lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null
    };
  }
  
  // Este metodo cuenta cuantas licitaciones hay en cada estado
  async contarEstados(): Promise<any> {
    const ref = collection(this.firestore, 'licitaciones');
    const querySnapshot = await getDocs(ref);
  
    const estados = {
      total: querySnapshot.size,
      enEstudio: 0,
      presentadas: 0,
      adjudicadas: 0,
      noAdjudicadas: 0,
      enResolucion: 0,
      desestimadas: 0
    };
  
    querySnapshot.forEach(doc => {
      const data = doc.data();
      
      // Para "EN ESTUDIO" y "PRESENTADA", usamos el campo estadoini
      const estadoIni = data['estadoini'];
      if (estadoIni === 'EN ESTUDIO') {
        estados.enEstudio++;
      } else if (estadoIni === 'PRESENTADA') {
        estados.presentadas++;
      }
      
      // Para el resto, usamos el campo estadofinal
      const estadoFinal = data['estadofinal'];
      if (estadoFinal === 'ADJUDICADA') {
        estados.adjudicadas++;
      } else if (estadoFinal === 'NO ADJUDICADA') {
        estados.noAdjudicadas++;
      } else if (estadoFinal === 'EN ESPERA RESOLUCIÓN') {
        estados.enResolucion++;
      } else if (estadoFinal === 'DESESTIMADA') {
        estados.desestimadas++;
      }
    });
  
    return estados;
  }

  async contarMisLicitaciones(presentadapor: string): Promise<number> {
    const ref = collection(this.firestore, 'licitaciones');
    // Asegurarse de que el valor a filtrar coincida con el formato almacenado en Firestore.
    // Por ejemplo, si en Firebase los nombres están en mayúsculas, conviertele a mayúsculas.
    const q = query(ref, where('presentadapor', '==', presentadapor.toUpperCase()));
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  // Este metodo detecta el id de la licitacion y el elimina el documento asociado a el
  // En TodaslicitacionesService
  async eliminarLicitacion(firebaseId: string): Promise<void> {
    const docRef = doc(this.firestore, 'licitaciones', firebaseId);
    await deleteDoc(docRef);
  }

  // Metodo que detecta el id y actualiza los datos del mismo
  // Se utiliza partial para no tener que completar todos los datos disponibles en la interfaz(licitacion)
  async actualizarLicitacion(firebaseid: string, datos: Partial<Licitacion>): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'licitaciones', firebaseid);
      const docSnap = await getDoc(docRef);
  
      if (!docSnap.exists()) {
        throw new Error(`Documento ${firebaseid} no encontrado`);
      }
  
      // Excluir campos protegidos (firebaseId e id, por ejemplo)
      const { firebaseid: _, id, ...datosActualizados } = datos;

      await updateDoc(docRef, datosActualizados);
      
    } catch (error) {
      console.error(`Error actualizando ${firebaseid}:`, error);
      throw error;
    }
  }
  

  // Metodo que crea un nuevo documento con los datos de una licitacion
  async crearLicitacion(datos: Licitacion): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firestore, 'licitaciones'), datos);
      console.log('Licitacion creada ID:', docRef.id);
      return docRef.id;
    } catch (e) {
      console.error("Error añadiendo licitacion: ", e);
      throw e;
    }
  }

  // Este metodo hace una consulta al item mayor que existe en los documentos 
  // omitiendo los campos que estan vacios
  async getMaxItem(): Promise<number> {
    const ref = collection(this.firestore, 'licitaciones');
    const q = query(ref, where('item', '>', 0), orderBy('item', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 0; // O el valor inicial que desees
    }
    
    const maxItem = querySnapshot.docs[0].data()['item'];
    return maxItem;
  }

}