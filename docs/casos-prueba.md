# Casos de prueba - MVP Entrenamiento (Grupo 7)

Ejecución: 27/11/2026 con `yarn test:cov:all`. La suite tiene 66 tests y pasaron todos. Acá se documentan 64 casos; los otros 2 son los pasos previos del e2e (crear las cuentas, y vincular y asignar el plan).

Datos del Paso 10: Juan y Sofía son deportistas, Laura y Martín son entrenadores. "Hoy" es el 21/10/2026, salvo en los casos de API, donde es la fecha del servidor.

---

## 01. Para crear una cuenta se necesita nombre, un email válido que no esté registrado, una contraseña de al menos 8 caracteres con letras y números, y el rol ENTRENADOR o DEPORTISTA

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC01-01 | "Juan Pérez", "juan@mail.com", "demo1234", "DEPORTISTA" | El sistema crea la cuenta sin mostrar errores | La cuenta queda registrada, y la respuesta no incluye la contraseña |
| TC01-02 | "juan@mail.com" (ya registrado) | El sistema muestra un error "El email ya está registrado." | La cuenta no se crea, y el usuario no puede continuar |
| TC01-03 | "demo1234" | El sistema guarda la contraseña encriptada | La contraseña guardada es un hash distinto de "demo1234" |
| TC01-04 | "juan.mail.com" | El sistema muestra un error "El email no tiene un formato válido." | La cuenta no se crea, y el usuario no puede continuar |
| TC01-05 | "abc123" | El sistema muestra un error "La contraseña debe tener al menos 8 caracteres." | La cuenta no se crea, y el usuario no puede continuar |
| TC01-06 | "soloLetras" | El sistema muestra un error "La contraseña debe tener al menos una letra y un número." | La cuenta no se crea, y el usuario no puede continuar |
| TC01-07 | "   " (nombre) | El sistema muestra un error "El nombre es obligatorio." | La cuenta no se crea, y el usuario no puede continuar |
| TC01-08 | "ADMIN" (rol) | El sistema muestra un error "El rol debe ser ENTRENADOR o DEPORTISTA." | La cuenta no se crea, y el usuario no puede continuar |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC01-01 | La cuenta queda registrada, y la respuesta no incluye la contraseña | La cuenta queda registrada, y la respuesta no incluye la contraseña | Aprobado |
| TC01-02 | El sistema muestra el error "El email ya está registrado." | La cuenta no se crea, y el usuario no puede continuar | Aprobado |
| TC01-03 | La contraseña guardada es un hash distinto de "demo1234" | La contraseña guardada es un hash distinto de "demo1234" | Aprobado |
| TC01-04 | El sistema muestra el error "El email no tiene un formato válido." | La cuenta no se crea, y el usuario no puede continuar | Aprobado |
| TC01-05 | El sistema muestra el error "La contraseña debe tener al menos 8 caracteres." | La cuenta no se crea, y el usuario no puede continuar | Aprobado |
| TC01-06 | El sistema muestra el error "La contraseña debe tener al menos una letra y un número." | La cuenta no se crea, y el usuario no puede continuar | Aprobado |
| TC01-07 | El sistema muestra el error "El nombre es obligatorio." | La cuenta no se crea, y el usuario no puede continuar | Aprobado |
| TC01-08 | El sistema muestra el error "El rol debe ser ENTRENADOR o DEPORTISTA." | La cuenta no se crea, y el usuario no puede continuar | Aprobado |

---

## 02. Solo se puede ingresar con el email y la contraseña correctos

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC02-01 | "juan@mail.com", "demo1234" | El sistema permite ingresar sin mostrar errores | El usuario ingresa, y recibe su access token y su refresh token |
| TC02-02 | Token de "juan@mail.com" | El sistema genera el token con el id y el rol del usuario | El token contiene el id 3 y el rol DEPORTISTA |
| TC02-03 | "juan@mail.com", "otra1234" | El sistema muestra un error "Email o contraseña incorrectos." | El usuario no ingresa |
| TC02-04 | "nadie@mail.com", "demo1234" | El sistema muestra un error "Email o contraseña incorrectos." | El usuario no ingresa, y no se informa si el email existe |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC02-01 | El usuario ingresa, y recibe su access token y su refresh token | El usuario ingresa, y recibe su access token y su refresh token | Aprobado |
| TC02-02 | El token contiene el id 3 y el rol DEPORTISTA | El token contiene el id 3 y el rol DEPORTISTA | Aprobado |
| TC02-03 | El sistema muestra el error "Email o contraseña incorrectos." | El usuario no ingresa | Aprobado |
| TC02-04 | El sistema muestra el error "Email o contraseña incorrectos." | El usuario no ingresa, y no se informa si el email existe | Aprobado |

---

## 03. Para usar la API hace falta un token válido, y cada endpoint solo lo puede usar el rol que corresponde (E13, RN17)

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC03-01 | Pedido sin token | El sistema muestra un error "Token no encontrado." | 401, el usuario no puede continuar |
| TC03-02 | Token de un deportista en un endpoint de entrenador | El sistema muestra un error "No tenés permisos para realizar esta acción." | 403, el usuario no puede continuar |
| TC03-03 | Token de un entrenador en un endpoint de entrenador | El sistema deja pasar el pedido sin mostrar errores | El usuario puede continuar |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC03-01 | El sistema muestra el error "Token no encontrado." | 401, el usuario no puede continuar | Aprobado |
| TC03-02 | El sistema muestra el error "No tenés permisos para realizar esta acción." | 403, el usuario no puede continuar | Aprobado |
| TC03-03 | El usuario puede continuar | El usuario puede continuar | Aprobado |

---

## 04. Un entrenador solo puede vincular deportistas que no tengan entrenador, y solo puede asignar planes a sus deportistas vinculados (RN18, RN14)

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC04-01 | Laura vincula a "Sofía" (sin entrenador) | El sistema vincula a la deportista sin mostrar errores | Sofía queda vinculada con Laura |
| TC04-02 | Laura vincula a "Martín" (entrenador) | El sistema muestra un error "El email no corresponde a una cuenta de deportista." | Martín no queda vinculado |
| TC04-03 | Laura vincula a "Juan" (ya vinculado con ella) | El sistema muestra un error "Juan Pérez ya está vinculado con vos." | El vínculo no se duplica |
| TC04-04 | Martín vincula a "Juan" (vinculado con Laura) | El sistema muestra un error "Juan Pérez ya tiene entrenador." | Juan sigue vinculado solo con Laura |
| TC04-05 | "Juan" consultado por Laura | El sistema reconoce que Juan es deportista de Laura | Laura le puede asignar planes a Juan |
| TC04-06 | "Juan" consultado por Martín, y "Sofía" (sin entrenador) consultada por Laura | El sistema reconoce que no están vinculados | No se les puede asignar un plan |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC04-01 | Sofía queda vinculada con Laura | Sofía queda vinculada con Laura | Aprobado |
| TC04-02 | El sistema muestra el error "El email no corresponde a una cuenta de deportista." | Martín no queda vinculado | Aprobado |
| TC04-03 | El sistema muestra el error "Juan Pérez ya está vinculado con vos." | El vínculo no se duplica | Aprobado |
| TC04-04 | El sistema muestra el error "Juan Pérez ya tiene entrenador." | Juan sigue vinculado solo con Laura | Aprobado |
| TC04-05 | Laura le puede asignar planes a Juan | Laura le puede asignar planes a Juan | Aprobado |
| TC04-06 | No se les puede asignar un plan | No se les puede asignar un plan | Aprobado |

---

## 05. Un plan tiene entre 1 y 7 rutinas y se puede asignar a varios deportistas (RN10)

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC05-01 | "Fuerza" con 1 rutina | El sistema crea el plan sin mostrar errores | El plan queda creado con su rutina |
| TC05-02 | "Fuerza" sin rutinas | El sistema muestra un error "El plan tiene que tener al menos una rutina." | El plan no se crea |
| TC05-03 | "Fuerza" con 8 rutinas | El sistema muestra un error "El plan puede tener hasta 7 rutinas." | El plan no se crea |
| TC05-04 | Deportista 10 "01/10 al 30/11" y deportista 11 "15/10 al 15/12" | El sistema asigna el mismo plan a los dos sin mostrar errores | El plan queda con 2 asignaciones, cada una con sus fechas |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC05-01 | El plan queda creado con su rutina | El plan queda creado con su rutina | Aprobado |
| TC05-02 | El sistema muestra el error "El plan tiene que tener al menos una rutina." | El plan no se crea | Aprobado |
| TC05-03 | El sistema muestra el error "El plan puede tener hasta 7 rutinas." | El plan no se crea | Aprobado |
| TC05-04 | El plan queda con 2 asignaciones, cada una con sus fechas | El plan queda con 2 asignaciones, cada una con sus fechas | Aprobado |

---

## 06. En una rutina no se repiten ejercicios y el orden empieza en 1 sin saltos; cada ejercicio tiene al menos una serie, RIR no negativo y un rango de repeticiones válido (RN15)

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC06-01 | El mismo ejercicio dos veces en "Piernas" | El sistema muestra un error "El ejercicio no puede repetirse dentro de la rutina." | La rutina no se crea |
| TC06-02 | Orden "1" y "3" | El sistema muestra un error "El orden de los ejercicios tiene que ser correlativo, empezando en 1." | La rutina no se crea |
| TC06-03 | Series objetivo "0" | El sistema muestra un error "Las series objetivo tienen que ser 1 o más." | El ejercicio no se agrega a la rutina |
| TC06-04 | RIR objetivo "-1" | El sistema muestra un error "El RIR objetivo no puede ser negativo." | El ejercicio no se agrega a la rutina |
| TC06-05 | Repeticiones de "10" a "8" | El sistema muestra un error "Las repeticiones mínimas no pueden ser mayores a las máximas." | El ejercicio no se agrega a la rutina |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC06-01 | El sistema muestra el error "El ejercicio no puede repetirse dentro de la rutina." | La rutina no se crea | Aprobado |
| TC06-02 | El sistema muestra el error "El orden de los ejercicios tiene que ser correlativo, empezando en 1." | La rutina no se crea | Aprobado |
| TC06-03 | El sistema muestra el error "Las series objetivo tienen que ser 1 o más." | El ejercicio no se agrega a la rutina | Aprobado |
| TC06-04 | El sistema muestra el error "El RIR objetivo no puede ser negativo." | El ejercicio no se agrega a la rutina | Aprobado |
| TC06-05 | El sistema muestra el error "Las repeticiones mínimas no pueden ser mayores a las máximas." | El ejercicio no se agrega a la rutina | Aprobado |

---

## 07. La fecha de inicio de una asignación no puede ser posterior a la de fin, y no puede superponerse con otra asignación del mismo deportista (RN10, RN11)

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC07-01 | "2026-12-01" a "2026-11-30" | El sistema muestra un error "La fecha de inicio no puede ser posterior a la de fin." | El plan no se asigna |
| TC07-02 | "2026-02-30" a "2026-03-10" | El sistema muestra un error "Las fechas de la vigencia tienen que tener el formato AAAA-MM-DD." | El plan no se asigna |
| TC07-03 | "15/11 al 15/12", con un plan vigente del 01/10 al 30/11 | El sistema muestra un error "Se superpone con el plan vigente (01/10 al 30/11)." | El plan no se asigna |
| TC07-04 | "01/12 al 31/12", con un plan vigente del 01/10 al 30/11 | El sistema acepta la vigencia sin mostrar errores | El plan se puede asignar |
| TC07-05 | "15/09 al 15/10", con planes del 01/08 al 30/09 y del 01/10 al 30/11 | El sistema muestra un error "Se superpone con el plan vigente (01/08 al 30/09)." | El plan no se asigna |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC07-01 | El sistema muestra el error "La fecha de inicio no puede ser posterior a la de fin." | El plan no se asigna | Aprobado |
| TC07-02 | El sistema muestra el error "Las fechas de la vigencia tienen que tener el formato AAAA-MM-DD." | El plan no se asigna | Aprobado |
| TC07-03 | El sistema muestra el error "Se superpone con el plan vigente (01/10 al 30/11)." | El plan no se asigna | Aprobado |
| TC07-04 | El plan se puede asignar | El plan se puede asignar | Aprobado |
| TC07-05 | El sistema muestra el error "Se superpone con el plan vigente (01/08 al 30/09)." | El plan no se asigna | Aprobado |

---

## 08. El deportista solo registra series de ejercicios de su plan vigente; cada serie guardada genera el evento Serie registrada, y si supera su mejor marca, también Récord personal superado (RN3, RN9)

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC08-01 | "62,5 kg x 8" y "62,5 kg x 7", con una marca anterior de 60 kg x 8 | El sistema registra las dos series y avisa récord solo en la primera | Se publican Serie registrada, Récord personal superado y Serie registrada, en ese orden |
| TC08-02 | "62,5 kg x 8" con la base de datos caída | El sistema muestra el error de la base de datos | La serie no se guarda, y no se publica ningún evento |
| TC08-03 | "62,5 kg x 8", con el plan vencido el 20/10 | El sistema muestra un error "No tenés un plan vigente." | La serie no se guarda, y no se publica ningún evento |
| TC08-04 | POST /api/series "60 kg x 8, RIR 2" (primera serie del ejercicio) | El sistema registra la serie sin avisar récord | 201, la serie queda como número 1, y se publica Serie registrada |
| TC08-05 | POST /api/series "65 kg x 8, RIR 2" | El sistema registra la serie y avisa récord personal | 201, record_personal en true, y se publica Récord personal superado |
| TC08-06 | GET /api/sesiones/hoy | El sistema muestra las series registradas hoy | 200, se ven las series 60 x 8 y 65 x 8 con 67 % de cumplimiento |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC08-01 | Se publican Serie registrada, Récord personal superado y Serie registrada, en ese orden | Se publican Serie registrada, Récord personal superado y Serie registrada, en ese orden | Aprobado |
| TC08-02 | El sistema muestra el error de la base de datos, y no publica eventos | La serie no se guarda, y no se publica ningún evento | Aprobado |
| TC08-03 | El sistema muestra el error "No tenés un plan vigente." | La serie no se guarda, y no se publica ningún evento | Aprobado |
| TC08-04 | 201, la serie queda como número 1, y se publica Serie registrada | 201, la serie queda como número 1, y se publica Serie registrada | Aprobado |
| TC08-05 | 201, record_personal en true, y se publica Récord personal superado | 201, record_personal en true, y se publica Récord personal superado | Aprobado |
| TC08-06 | 200, se ven las series 60 x 8 y 65 x 8 con 67 % de cumplimiento | 200, se ven las series 60 x 8 y 65 x 8 con 67 % de cumplimiento | Aprobado |

---

## 09. El peso no puede ser negativo y admite hasta 2 decimales, las repeticiones tienen que ser más de 0 y el RIR no puede ser negativo (RN4, RN5, RN6)

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC09-01 | "0" kg | El sistema acepta el peso sin mostrar errores | La serie se puede registrar con peso corporal |
| TC09-02 | "-5" kg | El sistema muestra un error "El peso no puede ser negativo." | La serie no se registra |
| TC09-03 | "0,001" kg | El sistema muestra un error "El peso admite hasta 2 decimales." | La serie no se registra |
| TC09-04 | "0" repeticiones | El sistema muestra un error "Las repeticiones tienen que ser mayores a 0." | La serie no se registra |
| TC09-05 | RIR "-1" | El sistema muestra un error "El RIR no puede ser negativo." | La serie no se registra |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC09-01 | La serie se puede registrar con peso corporal | La serie se puede registrar con peso corporal | Aprobado |
| TC09-02 | El sistema muestra el error "El peso no puede ser negativo." | La serie no se registra | Aprobado |
| TC09-03 | El sistema muestra el error "El peso admite hasta 2 decimales." | La serie no se registra | Aprobado |
| TC09-04 | El sistema muestra el error "Las repeticiones tienen que ser mayores a 0." | La serie no se registra | Aprobado |
| TC09-05 | El sistema muestra el error "El RIR no puede ser negativo." | La serie no se registra | Aprobado |

---

## 10. Una sesión es de un solo deportista, numera las series por ejercicio y solo acepta series del día (RN1, RN7, RN12)

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC10-01 | Series de los ejercicios "1", "2" y "1" en una sesión que ya tiene una del ejercicio 1 | El sistema numera las series por ejercicio | Las series quedan con los números 2, 1 y 3 |
| TC10-02 | Serie de otro deportista en la sesión de Juan | El sistema muestra un error "Solo el dueño de la sesión puede registrar series." | La sesión de Juan no cambia |
| TC10-03 | Fecha "22/10" en una sesión del 21/10 | El sistema muestra un error "Las series se registran siempre con la fecha del día." | La serie no se registra |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC10-01 | Las series quedan con los números 2, 1 y 3 | Las series quedan con los números 2, 1 y 3 | Aprobado |
| TC10-02 | El sistema muestra el error "Solo el dueño de la sesión puede registrar series." | La sesión de Juan no cambia | Aprobado |
| TC10-03 | El sistema muestra el error "Las series se registran siempre con la fecha del día." | La serie no se registra | Aprobado |

---

## 11. Una serie solo la puede corregir el deportista que la registró, y el mismo día (RN1, RN8, RN17)

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC11-01 | "65 kg x 8, RIR 1" | El sistema corrige la serie sin mostrar errores | La serie queda con 65 kg, 8 repeticiones y RIR 1 |
| TC11-02 | Corrección el "22/10" de una serie del 21/10 | El sistema muestra un error "Solo se puede corregir el mismo día." | La serie no cambia |
| TC11-03 | Sofía corrige una serie de "Juan" | El sistema muestra un error "La serie no es tuya." | 403, la serie no cambia y no se publica ningún evento |
| TC11-04 | Serie "99", que no está en la sesión | El sistema muestra un error "La serie no pertenece a esta sesión." | No se corrige nada |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC11-01 | La serie queda con 65 kg, 8 repeticiones y RIR 1 | La serie queda con 65 kg, 8 repeticiones y RIR 1 | Aprobado |
| TC11-02 | El sistema muestra el error "Solo se puede corregir el mismo día." | La serie no cambia | Aprobado |
| TC11-03 | El sistema muestra el error "La serie no es tuya." | 403, la serie no cambia y no se publica ningún evento | Aprobado |
| TC11-04 | El sistema muestra el error "La serie no pertenece a esta sesión." | No se corrige nada | Aprobado |

---

## 12. Una serie es récord personal si tiene más peso que la mejor marca del ejercicio, o el mismo peso con más repeticiones; la primera vez no cuenta (RN9)

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC12-01 | "62,5 kg x 8", sin series anteriores | El sistema no marca récord | La serie se registra sin aviso de récord |
| TC12-02 | "62,5 kg x 1", con una mejor marca de 60 kg x 20 | El sistema marca récord personal | La serie queda como récord por tener más peso |
| TC12-03 | "60 kg x 11", con una mejor marca de 60 kg x 10 | El sistema marca récord personal | La serie queda como récord por tener más repeticiones con el mismo peso |
| TC12-04 | "60 kg x 8, RIR 0", con una marca de 60 kg x 8, RIR 2 | El sistema no marca récord | Cambiar solo el RIR no cuenta como récord |
| TC12-05 | "60 kg x 8" el 14/10 y "65 kg x 8" el 21/10 | El sistema marca récord solo en la segunda | En el historial solo la serie del 21/10 figura como récord |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC12-01 | La serie se registra sin aviso de récord | La serie se registra sin aviso de récord | Aprobado |
| TC12-02 | La serie queda como récord por tener más peso | La serie queda como récord por tener más peso | Aprobado |
| TC12-03 | La serie queda como récord por tener más repeticiones con el mismo peso | La serie queda como récord por tener más repeticiones con el mismo peso | Aprobado |
| TC12-04 | Cambiar solo el RIR no cuenta como récord | Cambiar solo el RIR no cuenta como récord | Aprobado |
| TC12-05 | En el historial solo la serie del 21/10 figura como récord | En el historial solo la serie del 21/10 figura como récord | Aprobado |

---

## 13. El progreso de un ejercicio muestra el récord y, por cada fecha, el peso máximo, el volumen y el 1RM estimado con la fórmula de Epley (RN16)

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC13-01 | Sentadilla "60 kg x 8" el 14/10 y "65 kg x 8" el 21/10 | El sistema muestra el récord personal | El récord es 65 kg x 8 del 21/10 |
| TC13-02 | "65 kg x 8" | El sistema calcula el 1RM estimado: 65 x (1 + 8/30) | El 1RM estimado es 82,3 kg |
| TC13-03 | Tres series de "60 kg x 8" el 14/10 | El sistema resume el día | Peso máximo 60 kg, 1RM 76 kg y volumen 1440 kg |
| TC13-04 | Ejercicio sin series | El sistema no muestra récord ni fechas | El progreso aparece vacío |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC13-01 | El récord es 65 kg x 8 del 21/10 | El récord es 65 kg x 8 del 21/10 | Aprobado |
| TC13-02 | El 1RM estimado es 82,3 kg | El 1RM estimado es 82,3 kg | Aprobado |
| TC13-03 | Peso máximo 60 kg, 1RM 76 kg y volumen 1440 kg | Peso máximo 60 kg, 1RM 76 kg y volumen 1440 kg | Aprobado |
| TC13-04 | El progreso aparece vacío | El progreso aparece vacío | Aprobado |

---

## 14. El deportista registra una medición por día, con peso corporal y altura mayores a 0; si vuelve a cargar el mismo día, se reemplaza (RN19)

| ID del Caso de Prueba | Entrada | Valor Esperado | Salida |
|---|---|---|---|
| TC14-01 | "78,4 kg, 1,76 m" y después "77,9 kg, 1,77 m", el mismo día | El sistema reemplaza la medición del día sin mostrar errores | Queda una sola medición, con 77,9 kg y 1,77 m |
| TC14-02 | "0 kg, 1,76 m" | El sistema muestra un error "El peso corporal tiene que ser mayor a 0." | La medición no se guarda |

**Resultados**

| ID del Caso de Prueba | Resultado Actual | Resultado Esperado | Estado del Caso de Prueba |
|---|---|---|---|
| TC14-01 | Queda una sola medición, con 77,9 kg y 1,77 m | Queda una sola medición, con 77,9 kg y 1,77 m | Aprobado |
| TC14-02 | El sistema muestra el error "El peso corporal tiene que ser mayor a 0." | La medición no se guarda | Aprobado |

---

## Trazabilidad

| ID | Unit/E2E | Archivo | Nombre del test |
|---|---|---|---|
| TC01-01 | Unit | src/modules/gestion-usuario/auth/application/use-cases/crear-cuenta.use-case.spec.ts | crea la cuenta con su rol y responde sin la contraseña |
| TC01-02 | Unit | src/modules/gestion-usuario/auth/application/use-cases/crear-cuenta.use-case.spec.ts | rechaza un email ya registrado (422) y no crea otra cuenta |
| TC01-03 | Unit | src/modules/gestion-usuario/auth/application/use-cases/crear-cuenta.use-case.spec.ts | guarda la contraseña hasheada, nunca en texto plano |
| TC01-04 | Unit | src/modules/gestion-usuario/auth/dto/crear-cuenta.dto.spec.ts | rechaza {"email":"juan.mail.com"} con "El email no tiene un formato válido." |
| TC01-05 | Unit | src/modules/gestion-usuario/auth/dto/crear-cuenta.dto.spec.ts | rechaza {"contrasena":"abc123"} con "La contraseña debe tener al menos 8 caracteres." |
| TC01-06 | Unit | src/modules/gestion-usuario/auth/dto/crear-cuenta.dto.spec.ts | rechaza {"contrasena":"soloLetras"} con "La contraseña debe tener al menos una letra y un número." |
| TC01-07 | Unit | src/modules/gestion-usuario/auth/dto/crear-cuenta.dto.spec.ts | rechaza {"nombre":"   "} con "El nombre es obligatorio." |
| TC01-08 | Unit | src/modules/gestion-usuario/auth/dto/crear-cuenta.dto.spec.ts | rechaza {"rol":"ADMIN"} con "El rol debe ser ENTRENADOR o DEPORTISTA." |
| TC02-01 | Unit | src/modules/gestion-usuario/auth/application/use-cases/ingresar.use-case.spec.ts | con email y contraseña correctos devuelve los tokens y el usuario sin contraseña |
| TC02-02 | Unit | src/modules/gestion-usuario/auth/application/use-cases/ingresar.use-case.spec.ts | el access token está firmado con JWT_SECRET y lleva { sub, rol } |
| TC02-03 | Unit | src/modules/gestion-usuario/auth/application/use-cases/ingresar.use-case.spec.ts | si la contraseña es incorrecta responde 401 con el mismo mensaje |
| TC02-04 | Unit | src/modules/gestion-usuario/auth/application/use-cases/ingresar.use-case.spec.ts | si el usuario no existe responde 401 con el mismo mensaje |
| TC03-01 | Unit | src/modules/gestion-usuario/auth/auth.guard.spec.ts | sin token responde 401 |
| TC03-02 | Unit | src/modules/gestion-usuario/auth/auth.guard.spec.ts | con el token de un deportista en una ruta de entrenador responde 403 |
| TC03-03 | Unit | src/modules/gestion-usuario/auth/auth.guard.spec.ts | con el token de un entrenador deja pasar |
| TC04-01 | Unit | src/modules/gestion-usuario/usuario/domain/entities/usuario.entity.spec.ts | vincula a un deportista sin entrenador |
| TC04-02 | Unit | src/modules/gestion-usuario/usuario/domain/entities/usuario.entity.spec.ts | rechaza a un usuario que no es deportista |
| TC04-03 | Unit | src/modules/gestion-usuario/usuario/domain/entities/usuario.entity.spec.ts | rechaza vincular dos veces al mismo deportista |
| TC04-04 | Unit | src/modules/gestion-usuario/usuario/domain/entities/usuario.entity.spec.ts | rechaza a un deportista que ya tiene otro entrenador |
| TC04-05 | Unit | src/modules/gestion-usuario/usuario/domain/entities/usuario.entity.spec.ts | es true para el entrenador con el que está vinculado |
| TC04-06 | Unit | src/modules/gestion-usuario/usuario/domain/entities/usuario.entity.spec.ts | es false para otro entrenador o sin entrenador |
| TC05-01 | Unit | src/modules/planificacion/domain/entities/plan-entrenamiento.entity.spec.ts | se crea con nombre y al menos una rutina |
| TC05-02 | Unit | src/modules/planificacion/domain/entities/plan-entrenamiento.entity.spec.ts | rechaza un plan sin rutinas (RN10) |
| TC05-03 | Unit | src/modules/planificacion/domain/entities/plan-entrenamiento.entity.spec.ts | rechaza un plan con más de 7 rutinas |
| TC05-04 | Unit | src/modules/planificacion/domain/entities/plan-entrenamiento.entity.spec.ts | un mismo plan se asigna a varios deportistas, cada uno con sus fechas |
| TC06-01 | Unit | src/modules/planificacion/domain/entities/rutina.entity.spec.ts | rechaza un ejercicio repetido en la misma rutina (RN15) |
| TC06-02 | Unit | src/modules/planificacion/domain/entities/rutina.entity.spec.ts | rechaza un orden con huecos |
| TC06-03 | Unit | src/modules/planificacion/domain/value-objects/dosificacion.vo.spec.ts | rechaza 0 series objetivo |
| TC06-04 | Unit | src/modules/planificacion/domain/value-objects/dosificacion.vo.spec.ts | rechaza RIR objetivo negativo |
| TC06-05 | Unit | src/modules/planificacion/domain/value-objects/rango-repeticiones.vo.spec.ts | rechaza mínimo mayor al máximo |
| TC07-01 | Unit | src/modules/planificacion/domain/value-objects/vigencia.vo.spec.ts | rechaza una fecha de inicio posterior a la de fin (RN10) |
| TC07-02 | Unit | src/modules/planificacion/domain/value-objects/vigencia.vo.spec.ts | rechaza fechas inválidas "2026-02-30" → "2026-03-10" |
| TC07-03 | Unit | src/modules/planificacion/domain/services/verificador-superposicion.service.spec.ts | E9: rechaza una vigencia que se superpone, con las fechas del plan vigente |
| TC07-04 | Unit | src/modules/planificacion/domain/services/verificador-superposicion.service.spec.ts | acepta una vigencia que empieza el día siguiente |
| TC07-05 | Unit | src/modules/planificacion/domain/services/verificador-superposicion.service.spec.ts | compara contra todas las asignaciones, aunque sean de planes distintos |
| TC08-01 | Unit | src/modules/registro/application/use-cases/registrar-serie.use-case.spec.ts | E2/E3: publica Serie registrada en cada serie y Récord personal superado solo cuando lo supera |
| TC08-02 | Unit | src/modules/registro/application/use-cases/registrar-serie.use-case.spec.ts | no publica eventos si falla guardar |
| TC08-03 | Unit | src/modules/registro/application/use-cases/registrar-serie.use-case.spec.ts | sin plan vigente no guarda ni publica (RN3) |
| TC08-04 | E2E | test/flujo-core.e2e-spec.ts | E2: la primera serie se registra (RN3), publica Serie registrada y no es récord (RN9) |
| TC08-05 | E2E | test/flujo-core.e2e-spec.ts | E3: una serie que supera la mejor marca avisa el récord y publica los dos eventos |
| TC08-06 | E2E | test/flujo-core.e2e-spec.ts | las dos series quedan guardadas en la sesión de hoy |
| TC09-01 | Unit | src/modules/registro/domain/value-objects/valores-serie.spec.ts | acepta peso 0, incluido peso corporal |
| TC09-02 | Unit | src/modules/registro/domain/value-objects/valores-serie.spec.ts | rechaza peso negativo con el mensaje de E5 |
| TC09-03 | Unit | src/modules/registro/domain/value-objects/valores-serie.spec.ts | rechaza más de dos decimales sin redondear |
| TC09-04 | Unit | src/modules/registro/domain/value-objects/valores-serie.spec.ts | rechaza repeticiones 0 |
| TC09-05 | Unit | src/modules/registro/domain/entities/sesion-entrenamiento.corregir-serie.spec.ts | los valores corregidos cumplen las mismas condiciones que al registrar (RN4, RN5, RN6) |
| TC10-01 | Unit | src/modules/registro/domain/entities/sesion-entrenamiento.entity.spec.ts | nace con la primera serie y numera por ejercicio dentro de la sesión |
| TC10-02 | Unit | src/modules/registro/domain/entities/sesion-entrenamiento.entity.spec.ts | rechaza otro dueño sin modificar la sesión |
| TC10-03 | Unit | src/modules/registro/domain/entities/sesion-entrenamiento.entity.spec.ts | rechaza registrar fuera del día: 2026-10-22 |
| TC11-01 | Unit | src/modules/registro/domain/entities/sesion-entrenamiento.corregir-serie.spec.ts | E6: cambia el peso, las repeticiones y el RIR de la serie |
| TC11-02 | Unit | src/modules/registro/domain/entities/sesion-entrenamiento.corregir-serie.spec.ts | E7: no se puede corregir si hoy (2026-10-22) no es el día de la sesión |
| TC11-03 | Unit | src/modules/registro/application/use-cases/corregir-serie.use-case.spec.ts | una deportista no puede corregir la serie de otro (403) y no cambia nada |
| TC11-04 | Unit | src/modules/registro/domain/entities/sesion-entrenamiento.corregir-serie.spec.ts | rechaza una serie que no es de esta sesión |
| TC12-01 | Unit | src/modules/registro/domain/services/detector-record-personal.service.spec.ts | la primera marca no supera un récord |
| TC12-02 | Unit | src/modules/registro/domain/services/detector-record-personal.service.spec.ts | prioriza más peso aunque la nueva serie tenga menos repeticiones |
| TC12-03 | Unit | src/modules/registro/domain/services/detector-record-personal.service.spec.ts | a igual peso compara contra la mayor cantidad de repeticiones del historial |
| TC12-04 | Unit | src/modules/registro/domain/services/detector-record-personal.service.spec.ts | cambiar solamente el RIR no supera una marca |
| TC12-05 | Unit | src/modules/registro/domain/services/detector-record-personal.service.spec.ts | E8: 60 × 8 (14/10) y después 65 × 8 (21/10): solo la segunda es récord |
| TC13-01 | Unit | src/modules/registro/domain/services/calculadora-progreso.service.spec.ts | el récord personal es 65 kg × 8 del 21/10 |
| TC13-02 | Unit | src/modules/registro/domain/services/calculadora-progreso.service.spec.ts | el 1RM estimado del 21/10 es 82,3 kg (65 × (1 + 8/30)) |
| TC13-03 | Unit | src/modules/registro/domain/services/calculadora-progreso.service.spec.ts | resume cada fecha con su peso máximo, su mejor serie y su volumen |
| TC13-04 | Unit | src/modules/registro/domain/services/calculadora-progreso.service.spec.ts | si nunca hizo el ejercicio no hay récord ni fechas |
| TC14-01 | Unit | src/modules/mediciones/application/use-cases/registrar-medicion.use-case.spec.ts | si ya cargó una medición hoy, la reemplaza en lugar de crear otra |
| TC14-02 | Unit | src/modules/mediciones/application/use-cases/registrar-medicion.use-case.spec.ts | rechaza un peso corporal de 0 y no guarda nada |
