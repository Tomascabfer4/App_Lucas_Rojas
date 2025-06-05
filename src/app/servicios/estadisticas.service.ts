// src/app/servicios/estadisticas.service.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  orderBy,
  getDocs,
} from '@angular/fire/firestore';
import { Licitacion } from '../interfaces/licitacion';

@Injectable({
  providedIn: 'root',
})
export class EstadisticasService {
  // =======================================================================
  // PROPIEDADES PARA EL ESTADO DE LOS FILTROS
  // >>> AÑADIMOS LAS VARIABLES PARA GUARDAR EL ESTADO DE LOS FILTROS AQUÍ
  // =======================================================================
  presentadoresSeleccionados: string[] = [];
  estadosFinalesSeleccionados: string[] = [];
  private _anioActual = new Date().getFullYear();
  fechaDesde: string = `${this._anioActual}-01-01`;
  fechaHasta: string = new Date().toISOString().split('T')[0]; 

  constructor(private firestore: Firestore) {}

  // =======================================================================
  // MÉTODO PARA OBTENER DATOS (EXISTENTE)
  // =======================================================================
  async getTodasLicitaciones(): Promise<Licitacion[]> {
    const ref = collection(this.firestore, 'licitaciones');
    const q = query(ref, orderBy('fechapresentacion', 'desc'));
    const querySnapshot = await getDocs(q);

    // Mapea cada documento a la interfaz Licitacion y agrega el firebaseId si es necesario.
    const licitaciones = querySnapshot.docs.map((doc) => {
      const data = doc.data() as Licitacion;
      // Puedes añadir el ID de Firestore para identificar cada registro.
      return { ...data, firebaseid: doc.id };
    });

    return licitaciones;
  }

  // =======================================================================
  // MÉTODOS PARA GESTIONAR EL ESTADO DE LOS FILTROS
  // >>> AÑADIMOS LOS MÉTODOS PARA INTERACTUAR CON EL ESTADO DE LOS FILTROS
  // =======================================================================

  // Método para obtener el estado actual de todos los filtros
  getFiltros() {
    return {
      presentadoresSeleccionados: [...this.presentadoresSeleccionados], // Devolvemos copias
      estadosFinalesSeleccionados: [...this.estadosFinalesSeleccionados],
      fechaDesde: this.fechaDesde,
      fechaHasta: this.fechaHasta,
    };
  }

  // Métodos para actualizar el estado de los filtros
  setPresentadoresSeleccionados(presentadores: string[]) {
    this.presentadoresSeleccionados = presentadores;
  }

  setEstadosFinalesSeleccionados(estados: string[]) {
    this.estadosFinalesSeleccionados = estados;
  }

  setFechaDesde(fecha: string) {
    this.fechaDesde = fecha;
  }

  setFechaHasta(fecha: string) {
    this.fechaHasta = fecha;
  }

  // Método para resetear todos los filtros a su estado inicial
  limpiarFiltros() {
    this.presentadoresSeleccionados = [];
    this.estadosFinalesSeleccionados = [];
    this.fechaDesde = `${this._anioActual}-01-01`;
    this.fechaHasta = new Date().toISOString().split('T')[0];
  }
}
