# US-18 — Aviso de récord personal

El deportista recibe el aviso al registrar o corregir una serie que el backend
informa con `record_personal: true`. El aviso muestra ejercicio, peso y
repeticiones, y se puede cerrar sin enviar otro comando.

## Piezas y reglas

- `DetectorRecordPersonal`: servicio de dominio puro existente. Compara primero
  peso y luego repeticiones; la primera marca no es récord y el RIR no interviene.
- `RegistrarSerieUseCase` y `CorregirSerieUseCase`: coordinan la detección, guardan
  y publican `RecordPersonalSuperado`. La corrección compara con las demás series
  del ejercicio y excluye la serie corregida del historial de comparación.
- `ISesionEntrenamientoRepository` y su implementación en memoria: el historial
  se limita al deportista y al ejercicio. Se reutilizan los contratos existentes.
- `AvisoRecordPersonal.jsx` en el frontend: presentación de US-18 separada de la
  pantalla compartida, con anuncio accesible y cierre. `useRegistrarSerie`
  continúa tomando la decisión del backend; el frontend no calcula récords.

Los contratos de POST y PATCH se mantienen según el Paso 11. Ambos endpoints
requieren rol DEPORTISTA y el PATCH verifica al dueño. La pantalla está dentro
de la ruta protegida del deportista; el entrenador no accede al aviso. El evento
interno contiene `deportistaId`; no se incorpora una difusión pública de eventos.

## Verificación

- Unitarios del detector: 100 % de cobertura de líneas, ramas y funciones.
- `test/aviso-record-personal.e2e-spec.ts`: E2, E3 y E6 con los datos del Paso 10,
  códigos HTTP y cuerpos exactos; primera marca, desempate, otros deportistas y
  ejercicios, permisos, rechazo de datos y fallo de guardado. Se usa HTTP, JWT,
  casos de uso y EventEmitter2 reales, con repositorios en memoria. No modifica
  MySQL ni requiere la implementación de asignaciones de planificación.
- Frontend: componente de aviso, recorrido por la ruta de App, registro,
  corrección, cierre, primera marca, errores y redirección del entrenador.

Comandos del backend:

```sh
yarn test
yarn test --runInBand --coverage --collectCoverageFrom='src/modules/registro/domain/services/detector-record-personal.service.ts' detector-record-personal
yarn test:e2e --runInBand aviso-record-personal
yarn lint
yarn build
```

Comandos del frontend:

```sh
npm run test
npm run lint
npm run build
```

La validación con planificación y MySQL reales depende de que el backend tenga
asignaciones y plan vigente disponibles. La prueba de US-18 no implementa esas
historias ni el historial de sesiones.

## Entrega

Rama prevista: `feature/us-18-aviso-de-record-personal`. El checkout de trabajo
está en `feature/integrar-registro` y contiene cambios previos de integración.
El PR a `develop` debe separar los cambios de esta historia y contar con revisión;
no se marca como revisado por haber pasado las pruebas locales.
