import { Injectable } from '@angular/core';
import { liteClient } from 'algoliasearch/lite';
import { LicitacionesService } from './licitaciones.service';

@Injectable({
  providedIn: 'root',
})
export class AlgoliaService {
  private client = liteClient('RF5U65QR0Z', '38733992848bd0ec64ab3643b1422a87');

  constructor(private serviciolicitacion: LicitacionesService) {}

  /**
   * Busca en Algolia por cliente y expediente, combinando con filtros de Firebase.
   * Añade paginación Algolia con page y hitsPerPage.
   */
  async searchCombinado(
    busquedaCliente: string = '',
    numexpediente: string = '',
    desdeFecha?: string,
    hastaFecha?: string,
    filtroEstado?: string,
    presentadapor?: string,
    page: number = 0,
    hitsPerPage: number = 10
  ): Promise<any[]> {
    try {
      // 1. Obtener registros filtrados por fecha, estado y presentadapor desde Firebase
      const registros = await this.serviciolicitacion.getDatosFiltrados(
        desdeFecha,
        hastaFecha,
        filtroEstado,
        presentadapor
      );

      if (registros.length === 0) {
        return [];
      }

      const idsFiltrados = registros.map(doc => doc.firebaseId);
      const query = [busquedaCliente, numexpediente].filter(Boolean).join(' ');

      // Preparar filtros de objectID
      let filters = '';
      if (idsFiltrados.length) {
        filters = `objectID:${idsFiltrados.join(' OR objectID:')}`;
      }

      // Construir parámetros de búsqueda
      const paramsArr: string[] = [];
      paramsArr.push(`queryType=prefixAll`);
      paramsArr.push(`restrictSearchableAttributes=cliente,numexpediente,estadofinal,estadoini,presentadapor`);
      paramsArr.push(`hitsPerPage=${hitsPerPage}`);
      paramsArr.push(`page=${page}`);
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

  /**
   * Obtiene sugerencias de cliente o expediente.
   */
  async getSuggestions(query: string = ''): Promise<any[]> {
    try {
      if (!query.trim()) return [];
      const params = [
        'hitsPerPage=5',
        'queryType=prefixAll',
        'restrictSearchableAttributes=cliente,numexpediente'
      ].join('&');

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
      console.error('❌ Error en suggestions:', error);
      throw error;
    }
  }
}
