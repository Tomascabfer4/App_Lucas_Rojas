import { Injectable } from '@angular/core';
import { algoliasearch } from 'algoliasearch';

@Injectable({
  providedIn: 'root'
})
export class AlgoliaService {

  private client: any; // Opcional: Puedes usar 'any' temporalmente si TypeScript insiste en el error.
                      // Lo ideal es que se infiera.
  private index: any; // Igual aquí.

  private readonly ALGOLIA_APP_ID = 'RF5U65QR0Z';
  private readonly ALGOLIA_SEARCH_API_KEY = '38733992848bd0ec64ab3643b1422a87';
  private readonly ALGOLIA_INDEX_NAME = 'Indice_algolia';

  constructor() { 

    this.client = algoliasearch(this.ALGOLIA_APP_ID, this.ALGOLIA_SEARCH_API_KEY);
    this.index = this.client.initIndex(this.ALGOLIA_INDEX_NAME);
  }

  /**
   * Realiza una búsqueda en el índice de Algolia.
   * @param searchTerm La cadena de búsqueda.
   * @param options Opciones adicionales para la búsqueda (filtros, facetas, etc.).
   * @returns Una promesa que resuelve con los resultados (hits) de la búsqueda.
   */
  async search(searchTerm: string, options?: any): Promise<any[]> {
    try {
      const results = await this.index.search(searchTerm, options);
      return results.hits; // Algolia devuelve un objeto con la propiedad 'hits'
    } catch (error) {
      console.error('Error al buscar en Algolia:', error);
      throw error;
    }
  }
}
