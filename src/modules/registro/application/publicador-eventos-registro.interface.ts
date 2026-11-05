import type { SerieRegistrada } from '../domain/events/serie-registrada.event';
import type { RecordPersonalSuperado } from '../domain/events/record-personal-superado.event';

// El módulo compartido de eventos debe enlazar este token con EventEmitter2
// usando useExisting una vez instalada/configurada @nestjs/event-emitter.
export const IPublicadorEventosRegistroToken = 'IPublicadorEventosRegistro';
export interface IPublicadorEventosRegistro {
  emit(
    nombre: string,
    evento: SerieRegistrada | RecordPersonalSuperado,
  ): boolean;
}
