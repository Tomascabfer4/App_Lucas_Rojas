import { Injectable } from '@angular/core';
//import { algoliasearch } from 'algoliasearch';
import * as algoliasearch from 'algoliasearch/lite';
import { liteClient } from 'algoliasearch/lite';

@Injectable({
  providedIn: 'root',
})
export class AlgoliaService {
  private client = liteClient('RF5U65QR0Z', '38733992848bd0ec64ab3643b1422a87');

  async searchCliente(busquedaCliente: string): Promise<any[]> {
    try {
      const { results } = await this.client.search({
        requests: [
          {
            indexName: 'Indice_algolia',
            query: busquedaCliente,
          },
        ],
      });

      const firstResult = results[0] as { hits?: any[] };
      console.log('✅ Resultados de Algolia (liteClient):', firstResult.hits);
      return firstResult.hits || [];
    } catch (error) {
      console.error('Error al buscar en Algolia con liteClient:', error);
      throw error;
    }
  }

  async searchSuggestions(query: string): Promise<string[]> {
    try {
      const { results } = await this.client.search({
        requests: [
          {
            indexName: 'Indice_algolia',
            query: query,
            params:
              'attributesToRetrieve=cliente&restrictSearchableAttributes=cliente',
          },
        ],
      });

      const firstResult = results[0] as { hits?: any[] };
      console.log('Resultados crudos de Algolia:', firstResult.hits); // Para depuración
      return (
        firstResult.hits?.map((hit: any) => hit.cliente).filter(Boolean) || []
      );
    } catch (error) {
      console.error('Error en sugerencias:', error);
      return [];
    }
  }
}
