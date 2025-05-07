// Esta interfaz contiene todas las opciones para la paginacion en el listado
// de las licitaciones, parametros para modificar cuantas licitaciones cargan,
// cual es la ultima cargada y filtros variados para mas exactitud en la consulta
// Nos referimos a paginacion a cuando carga una serie de licitaciones, ya que si
// cargamos todas las licitaciones el rendimiento de la app sería muy pobre.
import { DocumentSnapshot } from 'firebase/firestore';
export interface Opcionespaginacion {
  limitNumber: number;
  lastVisible?: DocumentSnapshot | null;
  busquedaCliente?: string;
  numExpediente?: string;
  desdeFecha?: string;
  hastaFecha?: string;
  adjudicadas?: boolean; 
  presentadapor?: string;
}
