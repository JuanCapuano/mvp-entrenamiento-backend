# US-15 — Registrar serie

Implementado el agregado `SesionEntrenamiento`, la entidad interna `Serie`, los
value objects inmutables `Peso`, `Repeticiones` y `RIR`, la factory, el detector
de récord, el repositorio TypeORM, el caso de uso y `POST /api/series`.

El cuerpo y la respuesta respetan el Paso 11. El deportista sale del token;
la fecha se obtiene con `fechaActual()` de Argentina. La sesión se identifica
por deportista, rutina y fecha; la serie por sesión, ejercicio y número.
Las tablas tienen índices únicos y se reintenta hasta tres veces una colisión
concurrente, recargando el agregado. Los eventos se emiten después de guardar.
La primera marca no cuenta como récord; el historial incluye las series de hoy.

## Integración pendiente de piezas de otros responsables

`CLAUDE.md` indica: «Si tu US depende de una pieza de otro integrante que todavía
no está en develop, trabajá contra su interfaz con un repositorio en memoria».

Este checkout no tiene `PlanificacionModule` ni `@nestjs/event-emitter`. Por eso
`AppModule` todavía no importa registro: el endpoint se verifica en una app de
prueba con el guard JWT real y repositorios en memoria. No se habilita un endpoint
que omita verificar el plan ni se agrega un plan ficticio en producción.

Para activarlo, el responsable de planificación debe implementar y exportar
`IPlanRepositoryToken`. El contrato mínimo está en
`src/modules/planificacion/domain/interfaces/plan.repository-interface.ts`:
`buscarPlanVigenteDelDeportista(deportistaId, fecha)` devuelve el agregado o null.
El agregado debe exponer `id` y `contieneEjercicio(rutinaId, ejercicioId)`.
Ese método debe comprobar la combinación de rutina y ejercicio, no solo que el
ejercicio aparezca en cualquier rutina del plan.

El responsable de eventos debe instalar/configurar `@nestjs/event-emitter` y
exportar `IPublicadorEventosRegistroToken` enlazado con `EventEmitter2` mediante
`useExisting`. Después agregar en `AppModule`:

```ts
RegistroModule.conDependencias([PlanificacionModule, EventosModule])
```

`EventosModule` representa el módulo compartido que exporte ese enlace; no existe
todavía en este checkout. Las dependencias son obligatorias, sin fallbacks.
Con `synchronize: true`, el próximo arranque de la app creará las tablas nuevas
`sesion_entrenamiento` y `serie`, incluso antes de integrar `RegistroModule`,
porque `AppModule` descubre automáticamente todos los archivos `.entity.ts`.
No se ejecutó la app contra la base del usuario.

## Validación

Unitarios: RN1–RN7, RN9 y RN12, valores no finitos, precisión, plan ajeno/vencido,
separación por rutina/deportista/fecha, fallos al guardar, eventos posteriores al
guardado y solicitudes simultáneas. Metadatos TypeORM: índices, cascada y
transformers de los tres value objects, sin conexión a base de datos.

E2E con Nest/Supertest: E2–E5 y E13, JWT real, rol entrenador rechazado,
contrato 201, errores 422 y rechazo de fecha, identidad o numeración del cliente.

Comandos: `yarn test`, `yarn test:e2e`, `yarn lint`, `yarn build`.
Estos e2e prueban HTTP y dominio con persistencia en memoria; falta verificar
la integración con MySQL y planificación reales cuando estén disponibles.

El objetivo de menos de diez segundos desde abrir el ejercicio requiere una
medición del frontend integrado. El comando del backend usa una única petición;
las pruebas funcionales no acreditan rendimiento de producción.
