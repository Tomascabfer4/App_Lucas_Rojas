// src/app/servicios/notification.service.ts
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { EstadisticasService } from './estadisticas.service';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private isNative = Capacitor.getPlatform() !== 'web';

  constructor(private estadisticas: EstadisticasService) {
    if (this.isNative) {
      LocalNotifications.registerActionTypes({
        types: [{ id: 'default', actions: [] }]
      });
    }
  }

  /** Dispara una única notificación con los días restantes para cada licitación futura */
  public async notifyDaysRemaining(): Promise<void> {
    await this.requestPermission();
  
    const lics = await this.estadisticas.getTodasLicitaciones();
    const today = this.stripTime(new Date());
  
    for (const lic of lics) {
      // 1) Solo fianzas > 0
      const fNum = this.parseFianza(lic.fianza);
      if (fNum <= 0) continue;
  
      // 2) Debe tener fecha de fin y ser futura
      if (!lic.fechafincontrato) continue;
      const due  = this.stripTime(new Date(lic.fechafincontrato));
      const days = this.diffDays(today, due);
  
      if (days < 0)    continue;  // ya vencida: nada
      if (days > 15)   continue;  // queda más de 15 días: todavía no notificamos
  
      // 3) Disparar notificación inmediata
      const title = 'Días restantes de fianza';
      const body  = `Quedan ${days} día(s) para la fianza de ${lic.cliente}.`;
      const id    = lic.firebaseid ? this.hash(lic.firebaseid) : days;
      await this.sendNotification(id, title, body);
    }
  }

  private async requestPermission(): Promise<void> {
    if (this.isNative) {
      await LocalNotifications.requestPermissions();
    } else if ('Notification' in window) {
      await Notification.requestPermission();
    }
  }

  private async sendNotification(id: number, title: string, body: string) {
    if (this.isNative) {
      // disparo inmediato con 1s de retardo
      const at = new Date(Date.now() + 1000);
      await LocalNotifications.schedule({
        notifications: [{ id, title, body, schedule: { at }, actionTypeId: 'default' }]
      });
    } else if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  private diffDays(a: Date, b: Date): number {
    const ms = 1000*60*60*24;
    return Math.floor((b.getTime()-a.getTime())/ms);
  }

  private stripTime(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private hash(s: string): number {
    let h=0; for(const c of s){ h=(h*31+c.charCodeAt(0))&0xffffffff; } 
    return Math.abs(h);
  }

  private parseFianza(raw: string | number | undefined): number {
    if (typeof raw === 'string') {
      return parseFloat(raw.replace(',', '.')) || 0;
    }
    return typeof raw === 'number' ? raw : 0;
  }
}
