# CLAUDE.md — Backend NestJS (MVP Entrenamiento, Grupo 7)

NestJS 12 + TypeORM + MySQL. Gestor de paquetes: **yarn**. Código, nombres y comentarios **en español**, con los términos del glosario.

## Antes de implementar una US

1. Leé la US y sus criterios en `Analisis/Proyecto 3 - Informe Documentación Grupo 7.md`. Ahí están:
   - las reglas de negocio (Paso 8, RN1…RN19);
   - el contrato exacto de cada endpoint: rutas, JSON de entrada y salida, y códigos de error (Paso 11);
   - los escenarios con datos y **los mensajes de error textuales** (Paso 10).
2. Ubicá en este archivo el módulo y las piezas que tocás. No inventes piezas nuevas si ya hay una prevista.
3. Si tu US depende de una pieza de otro integrante que todavía no está en `develop`, trabajá contra su **interfaz** con un repositorio en memoria (ver Tests). No la implementes vos.

## Regla de oro

El controlador recibe, el use case coordina, **la entidad decide** y el repositorio guarda.
Las dependencias apuntan siempre hacia `domain/`. El dominio no importa nada de `application/`, de `infraestructure/` ni de HTTP: nada de `HttpException` en entidades, VOs, factories ni services de dominio.

## Capas

| Carpeta | Qué va | ¿Consulta la base? |
|---|---|---|
| `application/controllers/` | Endpoints REST. **Sin lógica**: recibe el DTO y el usuario, llama al use case o QueryService, devuelve. | No |
| `application/use-cases/` | Un use case por comando (clase con un solo método `execute`). Busca → llama a la entidad → guarda → publica el evento. | Solo a través de la **interfaz** del repositorio |
| `application/queries/` | `QueryObject` (filtros de la URL, validados con class-validator) y `QueryService` (solo lectura, devuelve DTOs). | Sí, con `@InjectRepository` de TypeORM directo |
| `domain/` | Entidades con su lógica, value objects, enums, factories, services de dominio, interfaz del repositorio, eventos, excepciones de dominio. | **Nunca** |
| `infraestructure/repositories/` | Implementa la interfaz del repositorio con TypeORM. Sin reglas de negocio. | Sí |
| `infraestructure/seed/` | Datos precargados (ejemplo: `ejercicios.seed.ts`, `roles.seed.ts`). | Sí |
| `dto/` | Entrada (con class-validator) y salida de la API. | — |
| `mappers/` | Entidad → DTO de respuesta, con método estático `aDto`. | — |

- **Comando** (cambia algo) → use case. **Consulta** (listar, ver, filtrar, calcular para mostrar) → QueryService. Nunca al revés.
- No hay services de aplicación: `AuthService`, `UsuarioService` y `RolService` ya se migraron a use cases y QueryServices. No crear nuevos `*.service.ts` en `application/`.
- La carpeta se llama `infraestructure/`, con esa ortografía. Respetarla.

## Repositorios: siempre con interfaz

**Cada agregado raíz tiene su interfaz de repositorio en `domain/interfaces/` y su implementación en `infraestructure/repositories/`.** Solo los agregados raíz tienen repositorio: las entidades internas (`Serie`, `Rutina`, `Asignacion`, `Vinculo`) se guardan junto con su raíz, con `cascade`.

Patrón obligatorio (copiado de `catalogo` y `usuario`):

```ts
// domain/interfaces/plan.repository-interface.ts
import { PlanEntrenamiento } from '../entities/plan-entrenamiento.entity';

export const IPlanRepositoryToken = 'IPlanRepository';

export interface IPlanRepository {
  buscarPorId(id: number): Promise<PlanEntrenamiento | null>;
  guardar(plan: PlanEntrenamiento): Promise<PlanEntrenamiento>;
}
```

```ts
// infraestructure/repositories/plan.repository.ts
@Injectable()
export class PlanRepository implements IPlanRepository {
  constructor(
    @InjectRepository(PlanEntrenamiento)
    private readonly repository: Repository<PlanEntrenamiento>,
  ) {}
  // ...
}
```

```ts
// planificacion.module.ts
providers: [{ provide: IPlanRepositoryToken, useClass: PlanRepository }, ...],
exports: [IPlanRepositoryToken], // solo si otro módulo lo usa
```

```ts
// en el use case
constructor(
  @Inject(IPlanRepositoryToken)
  private readonly planRepository: IPlanRepository, // importar con `import type`
) {}
```

Reglas:
- El use case **nunca** usa `Repository<T>` de TypeORM ni la clase concreta `PlanRepository`: solo la interfaz, inyectada por el token.
- Métodos en español y con verbo: `buscarPorId`, `buscarDelDia`, `guardar`, `existe`. Devuelven entidades de dominio (o `null`), nunca DTOs.
- La interfaz tiene **solo lo que usan los use cases**. Lo que se necesita para mostrar va en el QueryService.

## Comunicación entre módulos

Un módulo usa a otro **solo a través de la interfaz de repositorio que el otro exporta**. Nunca se importa la clase repositorio, la entidad para escribirla, ni un use case de otro módulo.

| Módulo que exporta | Token | Lo usa | Para |
|---|---|---|---|
| `catalogo` | `IEjercicioRepositoryToken` (`buscarPorId`, `existe`) | planificacion | validar ejercicios de las dosificaciones |
| `usuario` | `IUsuarioRepositoryToken` | auth, planificacion | crear cuenta / ingresar; verificar el vínculo al asignar (RN14) |
| `planificacion` | `IPlanRepositoryToken` (`buscarPlanVigenteDelDeportista(deportistaId, fecha)`) | registro | RN3: el ejercicio pertenece a una rutina del plan vigente |

Si necesitás un método nuevo en la interfaz de otro módulo, **pedíselo al dueño** o agregalo vos en un PR chico y separado. No lo resuelvas con un join en tu use case.

Excepción: un **QueryService** puede hacer joins de solo lectura con tablas de otros módulos (ejemplo: la asistencia muestra el nombre de la rutina). Nunca escribe en ellas.

## DDD: cómo escribir el dominio

### Entidades: con comportamiento, no bolsas de datos

Las reglas viven en métodos de la entidad, no en el use case. El use case no asigna campos de un agregado a mano.

```ts
// MAL: la regla queda en el use case
if (sesion.fecha !== hoy) throw ...;
serie.peso = dto.peso;

// BIEN: la entidad decide
sesion.corregirSerie(serieId, Peso.crear(dto.peso), Repeticiones.crear(dto.repeticiones), Rir.crear(dto.rir), hoy);
```

- Las entidades llevan los decoradores de TypeORM (`@Entity`, `@Column`) y su lógica en la misma clase. Las columnas en `snake_case` con `name: '...'` y las propiedades en camelCase (como `grupoMuscular` / `grupo_muscular`).
- Los cambios al agregado entran **solo por la raíz**: `sesion.registrarSerie(...)`, `plan.agregarAsignacion(...)`. Nadie modifica una `Serie` o una `Rutina` sin pasar por su raíz.
- **Referencias entre contextos por id**: `deportistaId`, `ejercicioId`, `planId`, `entrenadorId` como `@Column` numérico. No usar `@ManyToOne` hacia entidades de otro módulo. (Dentro del mismo agregado o contexto sí, como `Usuario → Rol`.)
- Para crear un agregado complejo se usa su **factory** (`PlanEntrenamientoFactory`, `SesionEntrenamientoFactory`), no `new` + asignaciones en el use case.

### Value objects

- Inmutables. Se crean con un método estático `crear(...)` que **valida y lanza `DomainException`** si el valor no cumple la regla (ejemplo: `Repeticiones.crear(0)` → "Las repeticiones tienen que ser mayores a 0.").
- VO de un solo valor (`Peso`, `Repeticiones`, `RIR`, `PesoCorporal`, `Altura`): se guarda en una columna común con un `transformer` de TypeORM (`to: vo => vo.valor`, `from: n => Peso.desdeBase(n)`).
- VO de varios valores (`Vigencia`, `RangoRepeticiones`): se guarda como columna embebida, `@Column(() => Vigencia, { prefix: 'vigencia' })`.
- `Dosificacion` es VO en el modelo pero se guarda en su propia tabla, por ser una lista dentro de `Rutina`. Se reemplaza entera, nunca se edita campo por campo.
- Los VOs saben comparar y calcular lo suyo (ejemplo: `vigencia.seSuperponeCon(otra)`, `vigencia.contiene(fecha)`).

### Services de dominio

Para reglas que involucran más de un agregado o datos de varias sesiones (`DetectorRecordPersonal`, `CalculadoraProgreso`, `CalculadoraCumplimiento`, `VerificadorSuperposicion`):
- Clases puras: reciben los datos ya cargados por parámetro y devuelven un resultado. **No inyectan repositorios ni consultan la base.**
- Se registran como provider del módulo para inyectarlos en use cases y QueryServices.
- Son lo primero que hay que testear (ver Tests).

### Excepciones de dominio

- **A implementar primero** (ver Piezas compartidas): `common/exceptions/domain.exception.ts`, una clase base `DomainException extends Error` sin nada de HTTP.
- Toda violación de una regla de negocio (RN) se lanza como `DomainException` desde la entidad, el VO o el service de dominio, con **el mensaje textual del Paso 10** cuando existe.
- El `GlobalExceptionFilter` la responde con **422** y `{ "error": mensaje }`.
- En la capa de aplicación se siguen usando las de Nest cuando no es una regla de negocio: `NotFoundException` (404, no existe el recurso) y `ForbiddenException` (403, el recurso es de otro usuario, RN17).

### Eventos de dominio

- Clases simples en `domain/events/`, en participio (`SerieRegistrada`, `PlanAsignado`), con los datos del hecho y su fecha. Sin lógica.
- El use case los crea y los publica **después de guardar**, con `EventEmitter2` de `@nestjs/event-emitter` (pendiente de instalar; ver Piezas compartidas).
- `RecordPersonalSuperado` además se refleja en la respuesta (`record_personal: true`), porque el front lo muestra en el momento.

## Use cases

```ts
@Injectable()
export class RegistrarSerieUseCase {
  constructor(@Inject(ISesionEntrenamientoRepositoryToken) private readonly sesiones: ISesionEntrenamientoRepository, ...) {}

  async execute(deportistaId: number, dto: RegistrarSerieDto): Promise<RegistrarSerieResponseDto> {
    // 1. buscar lo necesario por las interfaces
    // 2. llamar a la entidad / factory / service de dominio (deciden)
    // 3. guardar
    // 4. publicar eventos
    // 5. devolver con el mapper
  }
}
```

- Un archivo y una clase por comando. Método único `execute`.
- El usuario del token entra como parámetro (`deportistaId`, `entrenadorId`), nunca dentro del DTO.
- La verificación de **a qué datos puede acceder** el usuario (RN17: el entrenador solo ve a sus deportistas vinculados; el deportista solo lo suyo) se hace acá o en el QueryService, no en el controlador.
- Un use case modifica **un solo agregado** y hace un solo `guardar`. Con `cascade`, eso ya es atómico. Si alguna vez hiciera falta tocar dos agregados, se usa una transacción (`@Transactional` de `typeorm-transactional`, a instalar recién cuando se necesite).

## Controladores, DTOs y mappers

- El prefijo `/api` lo pone `main.ts`: el controlador declara `@Controller('series')`, no `'api/series'`.
- Usuario actual: usar el decorador `@UsuarioActual()` (ver Piezas compartidas). Hasta que exista, `@Req() req` con `req.user.id` (lo carga el `AuthGuard`).
- `@Roles(RolNombre.ENTRENADOR)` o `@Roles(RolNombre.DEPORTISTA)` en cada endpoint según el contrato. Las rutas sin token llevan `@Public()`.
- El JSON de la API va en **snake_case** (`ejercicio_id`, `vigencia_desde`) y las propiedades de las entidades en camelCase. La traducción la hacen los DTOs y los mappers.
- DTOs de entrada con class-validator y mensajes en español. El `ValidationPipe` ya responde 422 y rechaza propiedades de más. Las validaciones de formato van en el DTO; **las reglas de negocio van en el dominio aunque también estén en el DTO** (el dominio no confía en el DTO).
- Los mappers nunca exponen la contraseña ni datos que RN17 no permite (ejemplo: la asistencia no lleva pesos ni repeticiones).
- Fechas en ISO 8601 (`YYYY-MM-DD`). **La fecha de hoy la pone el servidor**, nunca el cliente (RN12).

## Fechas

"Hoy" decide muchas reglas (RN8, RN12, plan vigente, una medición por día). Para que todos calculen lo mismo:
- Usar siempre `hoy()` de `common/helpers/fecha.ts` (zona `America/Argentina/Buenos_Aires`, devuelve `YYYY-MM-DD`). No usar `new Date()` suelto en el dominio.
- En el dominio, la fecha de hoy **entra por parámetro** (`sesion.corregirSerie(..., hoy)`), así los tests pueden fijarla.

## Piezas compartidas (se hacen primero, antes que el resto las necesite)

| Pieza | Dónde | Responsable |
|---|---|---|
| Refresh token (`POST /api/auth/refresh`) | `gestion-usuario/auth/` | Capuano |
| `@UsuarioActual()` → `{ id, rol }` | `gestion-usuario/auth/usuario-actual.decorator.ts` | Capuano |
| `DomainException` + que el filtro la responda con 422 | `common/exceptions/`, `common/filters/` | Capuano |
| `fechaActual()` | `common/helpers/fecha-actual.ts` | Capuano |
| Instalar y configurar `@nestjs/event-emitter` | `app.module.ts` | Bernardi (primer evento: `PlanCreado`) |
| Repositorios en memoria base | `test/repositorios-en-memoria/` | cada dueño crea el de su agregado junto con su interfaz |

## Molde de cada módulo

```
src/modules/<modulo>/
├── application/{controllers,use-cases,queries}/
├── domain/{entities,value-objects,enums,interfaces,services,factories,events}/
├── infraestructure/{repositories,seed}/
├── dto/
├── mappers/
└── <modulo>.module.ts
```

Si un módulo no necesita una carpeta, **no se crea** (ejemplo: `catalogo` no tiene `use-cases/` ni `events/`). Cada módulo nuevo se registra en `app.module.ts`.

## Convenciones de nombres

Archivos en `kebab-case` con sufijo; clases en `PascalCase`. Entidades en singular (`Serie`); listas y endpoints en plural (`/api/series`).

| Sufijo | Carpeta | Ejemplo |
|---|---|---|
| `.controller.ts` | `application/controllers/` | `series.controller.ts` |
| `.use-case.ts` | `application/use-cases/` | `registrar-serie.use-case.ts` → `RegistrarSerieUseCase` |
| `.query.ts` | `application/queries/` | `sesiones.query.ts` → `SesionesQuery` |
| `.query-service.ts` | `application/queries/` | `sesiones.query-service.ts` → `SesionesQueryService` |
| `.entity.ts` | `domain/entities/` | `sesion-entrenamiento.entity.ts` |
| `.vo.ts` | `domain/value-objects/` | `peso.vo.ts` |
| `.enum.ts` | `domain/enums/` | `rol-nombre.enum.ts` |
| `.repository-interface.ts` | `domain/interfaces/` | `plan.repository-interface.ts` → `IPlanRepository` + `IPlanRepositoryToken` |
| `.service.ts` | `domain/services/` | `detector-record-personal.service.ts` |
| `.factory.ts` | `domain/factories/` | `plan-entrenamiento.factory.ts` |
| `.event.ts` | `domain/events/` | `serie-registrada.event.ts` |
| `.exception.ts` | `domain/` o `common/exceptions/` | `domain.exception.ts` |
| `.repository.ts` | `infraestructure/repositories/` | `plan.repository.ts` |
| `.seed.ts` | `infraestructure/seed/` | `ejercicios.seed.ts` |
| `.dto.ts` | `dto/` | `registrar-serie.dto.ts`, `serie-response.dto.ts` |
| `.mapper.ts` | `mappers/` | `serie.mapper.ts` |
| `.spec.ts` | junto al archivo que prueba | `peso.vo.spec.ts` |
| `.e2e-spec.ts` | `test/` | `registrar-serie.e2e-spec.ts` |

## Módulos

### `registro` (core) — sesiones, series, récord, progreso
- Agregado: `SesionEntrenamiento` (raíz: `registrarSerie`, `corregirSerie`; RN2, RN7, RN8) → `Serie` (interna; identidad = ejercicioId + número).
- VOs: `Peso` (≥ 0, hasta 2 decimales; RN5), `Repeticiones` (> 0; RN4), `RIR` (≥ 0; RN6).
- Factory: `SesionEntrenamientoFactory`, crea la sesión con la primera serie y la fecha de hoy (RN2, RN12).
- Services de dominio: `DetectorRecordPersonal` (RN9), `CalculadoraProgreso` (peso máx., 1RM Epley, volumen; RN16), `CalculadoraCumplimiento` (registradas ÷ objetivo, con tope 100 % por ejercicio).
- Repo `ISesionEntrenamientoRepository`: `buscarDelDia`, `buscarPorId`, `buscarSeriesDelEjercicio`, `guardar`.
- Use cases: `RegistrarSerieUseCase` (plan vigente → sesión del día o factory → registrar → detectar récord → guardar → eventos; RN1, RN3), `CorregirSerieUseCase` (RN1, RN8).
- Eventos: `SerieRegistrada`, `SerieCorregida`, `RecordPersonalSuperado`.
- Queries: `SesionesQueryService` (hoy, historial, últimas series, asistencia), `ProgresoQueryService` (progreso, ejercicios con progreso, peso máximo para el entrenador). RN17.
- Endpoints: `POST /api/series`, `PATCH /api/series/{id}`, `GET /api/sesiones/hoy`, `GET /api/sesiones`, `GET /api/ejercicios/{id}/ultimas-series`, `GET /api/deportistas/{id}/asistencia`, `GET /api/progreso`, `GET /api/progreso/ejercicios`, `GET /api/deportistas/{id}/progreso/{ejercicio_id}`.

### `planificacion` — planes, rutinas, dosificaciones, asignaciones
- Agregado: `PlanEntrenamiento` (raíz: modificar, `agregarAsignacion`; RN10, RN13) → `Rutina` (sin ejercicio repetido; RN15) y `Asignacion` (sabe si ya empezó).
- VOs: `Dosificacion`, `RangoRepeticiones`, `Vigencia` (RN15, RN10).
- Factory: `PlanEntrenamientoFactory`, crea el plan completo y la copia al duplicar.
- Service de dominio: `VerificadorSuperposicion` (RN11, entre todos los planes del deportista).
- Repo `IPlanRepository`: `buscarPorId`, `buscarAsignacionesDelDeportista`, `buscarPlanVigenteDelDeportista`, `guardar`.
- Use cases: `CrearPlan`, `ModificarPlan` (RN13 lo decide la entidad), `DuplicarPlan`, `AsignarPlan` (vínculo → superposición → asignar → guardar; RN14, RN11).
- Eventos: `PlanCreado`, `PlanAsignado`.
- Query: `PlanesQueryService` (mis planes, detalle, plan vigente).
- Endpoints: `POST /api/planes`, `PUT /api/planes/{id}`, `POST /api/planes/{id}/duplicado`, `GET /api/planes`, `GET /api/planes/{id}`, `GET /api/plan-vigente`, `POST /api/planes/{id}/asignaciones`.

### `catalogo` — ejercicios precargados (✅ hecho)
- Sin comandos: el catálogo viene por seed y el entrenador no agrega ejercicios.
- `Ejercicio` (nombre + `GrupoMuscular`: PIERNA, PECHO, ESPALDA, HOMBRO, BRAZO, CORE + `Subgrupo` opcional: CUADRICEPS, FEMORAL, GLUTEO, GEMELOS, DORSALES, TRAPECIO, BICEPS, TRICEPS). Repo: `buscarPorId`, `existe`.
- El seed identifica los ejercicios por nombre: inserta los que faltan y reclasifica (grupo y subgrupo) los que ya existen.
- `GET /api/ejercicios?grupo_muscular&subgrupo`.

### `gestion-usuario` — `auth/`, `rol/`, `usuario/`
- ✅ `auth/`: `CrearCuentaUseCase`, `IngresarUseCase`, `GeneradorToken`, `AuthGuard` global, `@Public()`, `@Roles(...)`, payload JWT `{ sub, rol }`. Falta el refresh.
- ✅ `rol/`: `Rol` + `RolNombre` (`ENTRENADOR`, `DEPORTISTA`), con seed.
- ✅ `usuario/`: `Usuario`, `UsuarioQueryService` (perfil), `UsuarioMapper` (nunca expone la contraseña).
- A implementar: `Vinculo` (dentro del agregado `Usuario`; RN18), `VincularDeportistaUseCase`, `DeportistasController` (`GET /api/deportistas` con plan vigente, `POST /api/deportistas`), y un método en `IUsuarioRepository` para verificar el vínculo, que usa planificación (RN14).

### `mediciones` — peso corporal y altura
- `MedicionCorporal` (raíz; RN19). VOs `PesoCorporal`, `Altura` (> 0).
- Repo `IMedicionRepository`: `buscarDelDia`, `guardar`.
- `RegistrarMedicionUseCase`: una por día; si ya existe la de hoy, la reemplaza.
- `MedicionesQueryService`, con filtros `deportista_id` (para el entrenador, solo vinculados), `desde`, `hasta`.
- `POST /api/mediciones`, `GET /api/mediciones`.

## Roles y acceso (RN17)

- El token lleva `id` y `rol`. El `AuthGuard` lo valida (401), deja `{ id, rol }` en `req.user` **sin consultar la base** y compara `@Roles` (403).
- `@Roles(RolNombre.ENTRENADOR)`: planes, asignaciones, catálogo, deportistas, asistencia, progreso del deportista.
- `@Roles(RolNombre.DEPORTISTA)`: series, sesiones, plan vigente, progreso propio, registrar medición.
- `@Roles` solo filtra por rol. **Qué datos puede ver** se verifica en el use case o el QueryService: un entrenador pidiendo un deportista no vinculado, o un deportista pidiendo una serie ajena → 403.

## Tests

Objetivo del plan: **70 % de cobertura general, 95 % en el dominio**. Cada US se entrega con sus tests.

| Qué | Cómo | Dónde |
|---|---|---|
| VOs, entidades, factories, services de dominio | Unitarios puros, sin Nest ni base. **Un test por regla (RN) y por criterio de aceptación.** | `*.spec.ts` junto al archivo |
| Use cases | Unitarios con **repositorios en memoria** que implementan la misma interfaz | `*.spec.ts` junto al use case; repos en `test/repositorios-en-memoria/` |
| Endpoints | e2e con Supertest; cubrir los escenarios del Paso 10 que toca la US | `test/*.e2e-spec.ts` |

- Los escenarios del Paso 10 (E1…E15) son casos de prueba obligatorios: mismo dato, mismo código HTTP y mismo mensaje.
- Fijá la fecha de hoy por parámetro; nunca dependas de la fecha real en un test.
- Comandos: `yarn test`, `yarn test:cov`, `yarn test:e2e`.

## Antes de cada PR

```
yarn format   # prettier
yarn lint     # oxlint
yarn test
yarn build
```

## Git

- Ramas desde `develop`: `feature/us-15-registrar-serie`, `fix/us-17-...`. PR a `develop`, nunca directo a `main`.
- Commits: `feature(registro): registrar serie (US-15)`, `fix(...)`, `refactor(...)`.
- Integrar a `develop` **cada 48 horas como máximo**, aunque la US no esté terminada (primero dominio + interfaz + tests, después endpoint).
- Archivos compartidos (`app.module.ts`, los `*.module.ts`, entidades de otro): solo agregar líneas, sin reordenar ni reformatear.

## Base de datos

- `synchronize: true` en desarrollo: las tablas se crean desde las entidades. No hay migraciones todavía; **no usar `synchronize` en producción**.
- Variables en `.env` (nunca se commitea): `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SSL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRATION`. MySQL local con `docker-compose.yml`.
