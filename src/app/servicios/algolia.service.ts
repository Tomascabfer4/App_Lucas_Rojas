import { Injectable } from '@angular/core';
import { liteClient } from 'algoliasearch/lite';
import { LicitacionesService } from './licitaciones.service';

@Injectable({
  providedIn: 'root',
})
export class AlgoliaService {
  private client = liteClient('RF5U65QR0Z', '38733992848bd0ec64ab3643b1422a87');
  constructor(private serviciolicitacion: LicitacionesService) {}

  // Metodo que busca en Algolia por cliente y expediente y de forma combinada
  async searchCombinado(
    busquedaCliente: string = '',
    numexpediente: string = '',
    desdeFecha?: string,
    hastaFecha?: string,
    filtroEstado?: string,
    presentadapor?: string // <== NUEVO
  ): Promise<any[]> {
    try {
      // 1. Obtener registros filtrados por fecha, estado y presentadapor desde Firebase
      const registrosFiltradosPorFecha =
        await this.serviciolicitacion.getDatosFiltrados(
          desdeFecha,
          hastaFecha,
          filtroEstado,
          presentadapor // <== PASAR presentadapor aquí
        );

      if (!registrosFiltradosPorFecha.length) {
        return [];
      }

      const idsFiltrados = registrosFiltradosPorFecha.map(
        (doc) => doc.firebaseId
      );

      const query = [busquedaCliente, numexpediente].filter(Boolean).join(' ');

      // 🔍 4. Filtro de IDs para limitar Algolia solo a lo que filtró Firebase
      let filters = '';
      if (idsFiltrados.length) {
        filters = `objectID:${idsFiltrados.join(' OR objectID:')}`;
      }

      const paramsArr = [
        'hitsPerPage=10',
        'queryType=prefixAll',
        'restrictSearchableAttributes=cliente,numexpediente,estadofinal,estadoini,presentadapor', // <== Añadir presentadapor
      ];
      if (filters) {
        paramsArr.push(`filters=${filters}`);
      }
      const params = paramsArr.join('&');

      const { results } = await this.client.search({
        requests: [
          {
            indexName: 'Licitaciones_Algolia',
            query,
            params,
          },
        ],
      });

      return (results[0] as { hits: any[] }).hits || [];
    } catch (error) {
      console.error('❌ Error en búsqueda combinada:', error);
      throw error;
    }
  }

  // Nuevo método para obtener suggestions
  async getSuggestions(query: string = ''): Promise<any[]> {
    try {
      // Si no hay nada escrito, devolvemos un array vacío
      if (!query.trim()) {
        return [];
      }
      
      // Parámetros para sugerencias: se busca obtener pocos resultados (por ejemplo, 5) 
      // y se limita la búsqueda a los atributos que consideres relevantes.
      const paramsArrSuggestion = [
        'hitsPerPage=5',
        'queryType=prefixAll',
        'restrictSearchableAttributes=cliente,numexpediente'
      ];
      const paramsSuggestion = paramsArrSuggestion.join('&');

      const { results } = await this.client.search({
        requests: [
          {
            indexName: 'Licitaciones_Algolia', // Puedes usar el mismo índice o, si lo prefieres, separar sugerencias en otro índice.
            query,
            params: paramsSuggestion,
          },
        ],
      });

      return (results[0] as { hits: any[] }).hits || [];
    } catch (error) {
      console.error('❌ Error en suggestions:', error);
      throw error;
    }
  }

}
