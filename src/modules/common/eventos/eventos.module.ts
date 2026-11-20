import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPublicadorEventosRegistroToken } from '../../registro/application/publicador-eventos-registro.interface';

// Enlaza los publicadores de eventos de los módulos con EventEmitter2
// (lo provee EventEmitterModule.forRoot() en app.module.ts).
// Así los use cases dependen de una interfaz propia y no del paquete de eventos.
@Module({
  providers: [
    { provide: IPublicadorEventosRegistroToken, useExisting: EventEmitter2 },
  ],
  exports: [IPublicadorEventosRegistroToken],
})
export class EventosModule {}
