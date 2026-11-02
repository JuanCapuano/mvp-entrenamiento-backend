# CLAUDE.md — Backend NestJS

Backend en NestJS + TypeORM. Las reglas de negocio (RN1…RN19) están detalladas en el informe; acá se indica **dónde** se implementa cada cosa.

## Regla de oro

El controlador recibe, el use case coordina, la entidad decide y el repositorio guarda.
Las dependencias apuntan **siempre hacia `domain/`**. El dominio no importa nada de `application/` ni de `infraestructure/`, ni nada de HTTP.

## Capas

| Carpeta | Qué va | ¿Consulta la base? |
|---|---|---|
| `application/controllers/` | Endpoints REST. **Sin lógica.** | No |
| `application/use-cases/` | Un use case por comando: busca → llama a la entidad → guarda → publica evento. Lleva `@Transactional`. | Solo vía interfaz del repositorio |
| `application/queries/` | `QueryObject` (filtros) + `QueryService` (solo lectura, devuelve DTOs) | Sí, repositorio de TypeORM directo |
| `domain/` | Entidades con su lógica, value objects, enums, factories, services de dominio, interfaz del repositorio, eventos | **Nunca** |
| `infraestructure/repositories/` | Implementa la interfaz del repositorio con TypeORM | Sí |
| `dto/` | Entrada/salida de la API | — |
| `mappers/` | Entidad → DTO de respuesta (método `aDto`) | — |

- Usamos **use cases**, no services de aplicación. Un solo repositorio, **sin persistence adapter**.
- Las consultas (listar, filtrar, ver detalle) van en un `QueryService`, nunca en un use case.
- Los services de dominio no consultan la base: reciben los datos ya cargados.
- La carpeta se llama `infraestructure/` (así, con esa ortografía). Respetarla.

## Molde de cada módulo

```
src/modules/<modulo>/
├── application/{controllers,use-cases,queries}/
├── domain/{entities,value-objects,enums,interfaces,services,factories,events}/
├── infraestructure/repositories/
├── dto/
├── mappers/
└── <modulo>.module.ts
```

Si un módulo no necesita una carpeta, **no se crea** (ej.: `catalogo` no tiene `use-cases/` ni `events/`).

## Convenciones de nombres

Archivos en `kebab-case` con sufijo; clases en `PascalCase` con los nombres del glosario (en español).
Entidades en singular (`Serie`); listas y endpoints en plural (`/api/series`).

| Sufijo | Carpeta | Ejemplo |
|---|---|---|
| `.controller.ts` | `application/controllers/` | `series.controller.ts` |
| `.use-case.ts` | `application/use-cases/` | `registrar-serie.use-case.ts` |
| `.query.ts` | `application/queries/` | `ejercicios.query.ts` |
| `.query-service.ts` | `application/queries/` | `ejercicios.query-service.ts` |
| `.entity.ts` | `domain/entities/` | `sesion-entrenamiento.entity.ts` |
| `.vo.ts` | `domain/value-objects/` | `peso.vo.ts` |
| `.enum.ts` | `domain/enums/` | `rol-nombre.enum.ts` |
| `.repository-interface.ts` | `domain/interfaces/` | `plan.repository-interface.ts` |
| `.service.ts` | `domain/services/` | `detector-record-personal.service.ts` |
| `.factory.ts` | `domain/factories/` | `plan-entrenamiento.factory.ts` |
| `.event.ts` | `domain/events/` | `serie-registrada.event.ts` |
| `.repository.ts` | `infraestructure/repositories/` | `plan.repository.ts` |
| `.dto.ts` | `dto/` | `registrar-serie.dto.ts` |
| `.mapper.ts` | `mappers/` | `plan.mapper.ts` |

Interfaces de repositorio con prefijo `I`: `IPlanRepository`, `ISesionEntrenamientoRepository`.

## Eventos de dominio

- Clases simples en `domain/events/` que describen un hecho pasado, con sus datos. Sin lógica.
- El use case los crea y los publica **después de guardar**, con `EventEmitter2` (`@nestjs/event-emitter`).

## Módulos

### `registro` (core) — sesiones, series, récord, progreso
- Agregado: `SesionEntrenamiento` (raíz, única puerta de entrada; registra y corrige series — RN2, RN7, RN8) → `Serie` (interna).
- VOs: `Peso` (RN5), `Repeticiones` (RN4), `RIR` (RN6).
- Factory: `SesionEntrenamientoFactory` — crea la sesión con la primera serie y la fecha del sistema (RN2, RN12).
- Services de dominio: `DetectorRecordPersonal` (RN9), `CalculadoraProgreso` (peso máx., 1RM, volumen — RN16), `CalculadoraCumplimiento` (series registradas ÷ objetivo, con tope por ejercicio).
- Repo: `buscarDelDia`, `buscarPorId`, `buscarSeriesDelEjercicio`, `guardar`.
- Use cases: `RegistrarSerieUseCase` (verifica plan vigente → sesión del día → registrar → detectar récord → guardar → eventos; RN1, RN3), `CorregirSerieUseCase` (RN1).
- Eventos: `SerieRegistrada`, `SerieCorregida`, `RecordPersonalSuperado`.
- Queries: `SesionesQueryService`, `ProgresoQueryService` (RN17).
- Endpoints: `POST /api/series`, `PATCH /api/series/{id}`, `GET /api/sesiones/hoy`, `GET /api/sesiones`, `GET /api/ejercicios/{id}/ultimas-series`, `GET /api/deportistas/{id}/asistencia`, `GET /api/progreso`, `GET /api/progreso/ejercicios`, `GET /api/deportistas/{id}/progreso/{ejercicio_id}`.

### `planificacion` — planes, rutinas, dosificaciones, asignaciones
- Agregado: `PlanEntrenamiento` (raíz; RN10, RN13) → `Rutina` (sin ejercicio repetido, RN15), `Asignacion` (sabe si ya empezó).
- VOs: `Dosificacion` (se reemplaza entera), `RangoRepeticiones`, `Vigencia` (RN15, RN10).
- Factory: `PlanEntrenamientoFactory` — crea el plan completo y la copia al duplicar.
- Service de dominio: `VerificadorSuperposicion` (RN11).
- Repo: `buscarPorId`, `buscarAsignacionesDelDeportista`, `guardar`.
- Use cases: `CrearPlan`, `ModificarPlan` (RN13 lo verifica la entidad), `DuplicarPlan`, `AsignarPlan` (verifica vínculo → superposición → asignar → guardar; RN14, RN11).
- Eventos: `PlanCreado`, `PlanAsignado`.
- Endpoints: `POST /api/planes`, `PUT /api/planes/{id}`, `POST /api/planes/{id}/duplicado`, `GET /api/planes`, `GET /api/planes/{id}`, `GET /api/plan-vigente`, `POST /api/planes/{id}/asignaciones`.

### `catalogo` — ejercicios precargados
- Sin comandos (el entrenador no agrega ejercicios). Solo QueryService.
- `Ejercicio` (nombre + enum `GrupoMuscular`: MMII, MMSS, CORE). Repo: `buscarPorId`, `existe` (los usan Planificación y Registro).
- Seed en `infraestructure/seed/ejercicios.seed.ts`.
- `GET /api/ejercicios?grupo_muscular` — QueryBuilder, ordena por grupo y nombre; filtro inválido → 422 por `ValidationPipe`.

### `gestion-usuario` — `auth/`, `rol/`, `usuario/`
- `auth/`: sin `domain/` ni `infraestructure/`. `AuthController` (`/api/auth/register`, `/login`, `/refresh`), `AuthGuard` global, `@Public()`, `@Roles(...)`, payload JWT `{ sub, rol }`.
- `rol/`: entidad `Rol` + enum `RolNombre` (`ENTRENADOR`, `DEPORTISTA`).
- `usuario/`: `Usuario` (raíz, crea el vínculo — RN18), `Vinculo` (interna). `UsuarioMapper` **nunca** expone la contraseña. Email repetido → 422.
- Pendiente: `AuthService`, `UsuarioService` y `RolService` **se migran a use cases**. A implementar: `Vinculo`, `VincularDeportistaUseCase`, `DeportistasController` (`GET/POST /api/deportistas`).

### `mediciones` — peso corporal y altura
- `MedicionCorporal` (raíz; RN19). VOs `PesoCorporal`, `Altura` (> 0).
- `RegistrarMedicionUseCase`: una por día — si ya existe la de hoy, la reemplaza.
- `MedicionesQueryService` con filtros `deportista_id`, `desde`, `hasta` (RN17).
- `POST /api/mediciones`, `GET /api/mediciones`.

## Roles y acceso (RN17)

- El token lleva `id` y `rol`. El `AuthGuard` lo valida (401), deja `{ id, rol }` en `req.user` **sin consultar la base** y compara `@Roles` (403).
- `@Roles(RolNombre.ENTRENADOR)`: planes, catálogo, deportistas.
- `@Roles(RolNombre.DEPORTISTA)`: series, sesiones, progreso, mediciones.
- `@Roles` solo filtra por rol. **Qué datos puede ver** (ej.: el entrenador solo ve a sus deportistas vinculados; el deportista solo lo suyo) se verifica en el use case o el QueryService.

## Errores

- `common/filters/global-exception.filters.ts`: todo error sale como `{ "error": "mensaje" }`. `HttpException` → su código (401, 403, 404, 422); cualquier otro → 500 genérico con detalle en el log.
- `ValidationPipe` (en `main.ts`) valida DTOs y QueryObjects → 422.
- A implementar: `DomainException`, base de las excepciones de reglas de negocio, **sin nada de HTTP**; el filtro las responde con 422. En el dominio, lanzar `DomainException`, nunca `HttpException`.

## `common/`

Solo lo transversal que no pertenece a ningún módulo (hoy: el filtro global). El guard y los decoradores viven en `gestion-usuario/auth/`; los eventos en el `domain/events/` de cada módulo.

## Para después (no crear hasta que una US lo pida)

- `common/helpers/`: cuando el mismo código se repita en varios módulos (fechas, paginación, mensajes).
- Repositorios en memoria en `test/`, junto con los tests de cada use case.
