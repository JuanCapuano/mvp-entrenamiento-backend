

**Ingeniería y Calidad de Software**

**Proyecto 3**

**Plan de Proyecto**

DOCENTE:

- Ing. Vanzetti, Juan Jose  
- Ing. Toselli, Laura

GRUPO: 7

ALUMNOS:

- Banegas, Valentin  
- Bernardi, Manuel  
- Capuano, Juan  
- Cocchi, Santiago  
- Falvo, Santiago  
- Navarro, Pablo  
- Santiesteban, Augusto  
- Tosco, Santiago **(\*)**


  

  ***(\*) Alumno de Programación Avanzada***

**Índice**

[**Plan del Proyecto de Software – Gestión de Productos e Inventario	3**](#plan-del-proyecto-de-software-–-app-para-entrenamiento)

[1\. Introducción	3](#1.-introducción)

[2\. Organización del Proyecto	4](#2.-organización-del-proyecto)

[3\. Procesos Gerenciales	5](#3.-procesos-gerenciales)

[4\. Procesos Técnicos	9](#4.-procesos-técnicos)

[5\. Planificación de los recursos	10](#5.-planificación-de-los-recursos)

[6\. Planificación de la Calidad	11](#6.-planificación-de-la-calidad)

[7\. Planificación de Comunicación	12](#7.-planificación-de-comunicación)

[8\. Planificación de los Cambios	13](#8.-planificación-de-los-cambios)

# 

# 

# 

# 

# 

# 

# 

# 

# **Plan del Proyecto de Software – App para Entrenamiento** {#plan-del-proyecto-de-software-–-app-para-entrenamiento}

## **1\. Introducción** {#1.-introducción}

**Propósito:**  
El propósito de este plan de proyecto es establecer las bases organizativas para el desarrollo de una app de gestión de planes y entrenamientos para un gimnasio. Este documento representa el instrumento de control principal que articula las estrategias técnicas, las asignaciones de recursos, los cronogramas de entrega, la gestión de cambios y los criterios de aceptación. 

**Alcance:**

El proyecto abarca el análisis, diseño, desarrollo, prueba y despliegue de una aplicación móvil de seguimiento de entrenamientos. Abarca la gestión de planes de entrenamiento, la asignación de estos a los usuarios, y la visualización de la evolución del entrenamiento.    
No se incluye:

- Gestión de cobros y facturación  
- Gestión de turnos y reservas  
- Mediciones corporales y planes nutricionales

**Definiciones, Acrónimos y Abreviaturas:**  

| Término | Significado |
| :---- | :---- |
| **US** | "User Story" o historia de usuario es una descripción informal y concisa de una funcionalidad de software desde la perspectiva del usuario final.  |
| **MVP** | “Producto Mínimo Viable”: la versión más básica y funcional de un producto que incluye solo las características esenciales para resolver un problema. |
| **DDD** | "Domain-Driven Design": enfoque de diseño que ubica las reglas de negocio en un modelo de dominio explícito, separado de la infraestructura.  |
| **Value Object** | Objeto del dominio que se define por sus atributos y no por una identidad propia; es inmutable y sustituible por otro de iguales valores.  |
| **Entidad** | Objeto del dominio con identidad propia, que persiste a lo largo del tiempo aunque cambien sus atributos.  |
| **Agregado** | Conjunto de entidades y value objects tratados como una unidad de consistencia, con una entidad raíz que controla el acceso.  |
| **Event Storming** | Técnica de modelado colaborativo que descubre el dominio a partir de los eventos de negocio relevantes.  |
| **Deuda técnica**  | Costo futuro que genera una solución subóptima adoptada en el presente, sea de forma consciente o por desconocimiento.  |
| **Vercel**  | Plataforma de despliegue que permite la integración continua y despliegue automático de sitios React. Importar el proyecto desde Git o usar la CLI genera un dominio “.vercel.app” y cada push crea un despliegue de vista previa.  |
| **Railway**  |  Plataforma en la nube que permite desplegar, gestionar y alojar aplicaciones, bases de datos y servicios de manera sencilla. Facilita la automatización del despliegue continuo y la gestión de entornos de desarrollo y producción.  |
| **TypeORM**  | ORM para TypeScript que mapea las clases de la aplicación contra las tablas de la base de datos relacional.  |

## **2\. Organización del Proyecto**  {#2.-organización-del-proyecto}

**Estructura Organizativa:**   
El proyecto opera bajo un esquema organizativo horizontal autogestionado, inspirado en el marco de trabajo ágil Scrum, pero adaptado para maximizar el rendimiento de un equipo reducido.   
Al no existir la figura de un Project Manager tradicional con autoridad, el equipo asume la responsabilidad colectiva sobre la entrega técnica, mientras que el Product Owner asume el liderazgo en la definición de la visión de negocio y los requisitos de los clientes.   
La estructura es: 

* Product Owner: Santiesteban, Augusto  
* Desarrollador Full-Stack: Tosco, Santiago  
* Desarrollador Full-Stack: Capuano, Juan Ignacio  
* Desarrollador Full-Stack: Falvo, Santiago  
* Desarrollador Full-Stack: Bernardi, Manuel  
* Tester: Navarro, Pablo  
* Tester: Banegas, Valentin  
* Tester: Cocchi, Santiago

**Roles y Responsabilidades**

* **Product Owner (1):** Responsable de la **visión del producto** y de maximizar el valor entregado.  Define las historias de usuario y sus criterios de aceptación, prioriza el backlog en el tablero, toma decisiones sobre el alcance de cada entrega y acepta las funcionalidades completadas. Actúa como enlace con los interesados para transmitir las expectativas al equipo y resolver ambigüedades del dominio. También debe asegurar que el proyecto cumpla sus objetivos. 

* **Desarrollador Full-Stack (4):** Responsable de diseñar, desarrollar y administrar tanto el **front-end** como el **back-end** de la aplicación, abarcando desde la interfaz visible hasta la infraestructura que maneja los datos. Encargado de implementar las historias de usuario respetando la separación de capas y ubicando las reglas de negocio en el modelo de dominio, integrar ambas capas mediante el desarrollo de APIs, configurar y mantener la base de datos, y garantizar la calidad realizando pruebas y mantenimiento continuo.

* **Tester/QA (3):** Responsable de la calidad funcional del producto. Diseña casos de prueba a partir de los criterios de aceptación de las historias de usuario, implementa los tests automatizados priorizando la verificación de reglas de negocio por sobre la de endpoints, ejecuta la suite de regresión para asegurar que los cambios no rompan funcionalidad existente, y reporta bugs o desviaciones respecto a los requisitos en el tablero. 

## **3\. Procesos Gerenciales** {#3.-procesos-gerenciales}

**Objetivos y Prioridades:**

El objetivo principal del proyecto es desarrollar un MVP con las funcionalidades mínimas que permitan resolver las especificaciones definidas en el alcance, en tiempo determinado por la cátedra, la cual actúa como interesado del producto.   
Ante cuellos de botella, el PO tiene el mandato de desestimar historias secundarias para asegurar que el MVP se entregue a tiempo.

**Supuestos, Dependencias y Restricciones:** 

* **Supuestos:**  
  * Las cuentas de Vercel y Railway están creadas.  
  * Hay acceso estable a internet.  
  * El docente está disponible para consultas periódicas sobre la interpretación del dominio.

* **Dependencias:**  
  * Dependencia de servicios externos:  
    * Vercel para el frontend.  
    * Railway para la base de datos MySQL y el backend.  
  * Dependencia de herramientas:  
    * Node.js, Git, CLI de Vercel, NestJS, TypeORM, React, Vite, Jest, Supertest, Vitest, React Testing Library.  
* **Restricciones:**  
  * El uso gratuito de Vercel/Railway nos limita en recursos (horas de ejecución, tamaño de base de datos y suspensión del servicio por inactividad).  
  * El proyecto tiene como fecha límite la semana del 14 de diciembre de 2026, por lo que se debe planificar el ciclo de vida del proyecto a este tiempo.

**Planificación del Trabajo (Cronograma):**  

El desarrollo se organiza en 2 sprints de 2 semanas cada uno, sobre un total de 4 semanas.

* Link del cronograma:   
  OTRO LINK


**Priorización y Estimación:**  
La estimación de esfuerzo se realiza mediante Planning Poker

| US | Descripción breve | Impacto | SP | Orden  |
| :---- | :---- | :---- | :---- | :---- |
| 4 |  |  | 2 |  |
| 1 |  |  | 5 |  |
| 2 |  |  | 3 |  |
| 3 |  |  | 2 |  |
| 5 |  |  | 5 |  |
| 6 |  |  | 8 |  |
| 7 |  |  | 8 |  |
| 8 |  |  | 5 |  |
| 9 |  |  | 3 |  |
| 10 |  |  | 3 |  |
| 11 |  |  | 3 |  |
| 12 |  |  | 5 |  |
| 13 |  |  | 3 |  |
| 14 |  |  | 3 |  |
| 15 |  |  | 8 |  |
| 16 |  |  | 3 |  |
| 17 |  |  | 3 |  |
| 18 |  |  | 5 |  |
| 19 |  |  | 8 |  |
| 20 |  |  | 8 |  |
| 21 |  |  | 5 |  |
|  |  |  | 98 |  |

**Total estimado**:  98 SP

**Planificación de Riesgos**

**R1:** Errores en el despliegue debido a la configuración incorrecta.

* **M1:** Revisar guías de Vercel/Railway, usar despliegues de prueba y revertir rápidamente. Verificar la URL el mismo día de la entrega.

**R2:** Fallo de comunicación front–back (CORS, rutas, variables de entorno).

* **M1:** Revisar API; habilitar CORS; probar localmente antes de desplegar.

**R3:** Dependencia de servicios externos (caídas o suspensión por inactividad de Vercel/Railway).

* **M1:** Monitorear estados; plan alterno de despliegue local; realizar backups periódicos de la base de datos.

**R4:** Falta de habilidades en el equipo, particularmente en DDD, Event Storming y testing automatizado, que son técnicas nuevas para el grupo.

* **M1:** Dedicar tiempo a estudiar material y tutoriales; consultar al docente; realizar el Event Storming en conjunto y no delegarlo en un solo integrante.

**R5:** Retrasos en el cronograma.

* **M1:** Dividir tareas; priorizar las más críticas; mantener comunicación continua; ajustar el cronograma. Considerar que las tres entregas están concentradas en menos de un mes.

**R6:** Conflictos de código al integrar los cambios de los distintos CRs sobre los mismos archivos del dominio.

* **M1:** Mantener ramas de trabajo separadas por historia, realizar code reviews frecuentes, integrar a develop cada 48 horas como máximo y resolver merge conflicts de inmediato.

**R7:** Falta de cobertura en pruebas automáticas.

* **M1:** Planificar casos de prueba desde los criterios de aceptación, definir el objetivo de cobertura por capa y no como número global, monitorear métricas y ajustar antes de la entrega.

**R8:** Exposición de credenciales o variables de entorno.

* **M1:** Usar archivos .env seguros, no versionar credenciales y revisar la configuración de Vercel/Railway para proteger secretos.

## **4\. Procesos Técnicos** {#4.-procesos-técnicos}

**Modelo de Procesos de Software:** 

**Tareas del proceso de software:**

**Planes de Productos de Trabajo del Proyecto:**

* **Frontend (React \+ Vite) desplegado en Vercel.**  
* **Backend (NestJS \+ TypeORM) desplegado en Railway.**  
* **Base de datos MySQL desplegada en Railway.**  
* **Repositorio Git** con rama "main" y ramas de desarrollo.

**Requisitos de Hardware y Software:**

* Equipo local  
  * PC con sistema operativo Windows/Linux, procesador moderno y 8 GB de RAM.  
* Herramientas de desarrollo  
  * Node.js (v18 o superior), npm, editor (VS Code), Git, NestJS CLI, Vite, TypeORM, MySQL local para desarrollo.  
* Herramientas de testing  
  * Jest y Supertest para el backend; Vitest o Jest con React Testing Library para el frontend.  
* Hosting  
  * Cuenta en Vercel (para el frontend).  
  * Cuenta en Railway (base de datos MySQL y backend).

## **5\. Planificación de los recursos** {#5.-planificación-de-los-recursos}

**Requisitos de Recursos:**

* **Recursos humanos:**  
  * 1 Product Owner  
  * 4 Desarrolladores Full-Stack  
  * 4 Testers  
  * 1 Responsable de Dominio (rol rotativo entre los integrantes)  
* **Recursos tecnológicos:** herramientas de desarrollo y cuentas de hosting descritas en la sección anterior.

**Planificación del Personal:**    
La asignación de tareas indica que el estudiante asume la mayor parte del trabajo. Se prevé una dedicación de 3/4 horas durante los días anteriores a las entregas escritas. El docente dedica algunas horas para revisar avances y dar feedback

**Planificación de herramientas:**  
**Gestión de Tareas (Trello / ClickUp / GitHub Projects):** el tablero será el núcleo de la planificación operativa. Se creará un tablero con listas que representan el flujo de trabajo:

* *Backlog*  
* *Por Hacer (To Do)*  
* *En Progreso (Doing)*  
* *En Revisión/Pruebas*  
* *Completado (Done)*

Cada tarjeta incluirá: identificador de la historia, estimación en puntos, criterios de aceptación y responsable asignado. Esto permite evidenciar la trazabilidad entre las especificaciones definidas y lo implementado.

**Git (GitHub) – Control de Versiones:** todo el código fuente residirá en repositorios Git alojados en GitHub para facilitar la colaboración remota.

* Se adoptará un flujo de ramas adecuado para mantener la estabilidad. Habrá una rama principal **"main"** donde residirán las versiones estables y una rama **"develop"** donde se integran las características en desarrollo.  
* Para cada funcionalidad o arreglo, los desarrolladores crearán ramas de feature desde **"develop"** donde trabajan independientemente, luego realizan pull requests para integrar de vuelta en develop.  
* Se adoptará la convención de commits tipo(alcance):  **feature** para las nuevas funcionalidades, **fix** para el arreglo de los errores y **refactor** para los cambios, de modo que cada commit sea rastreable hasta su historia de usuario.

**Herramientas de Event Storming:** se utilizará Miro, Whimsical o draw.io para la construcción colaborativa del tablero de eventos, exportando el resultado como imagen e incluyendo el link de acceso.

## **6\. Planificación de la Calidad** {#6.-planificación-de-la-calidad}

**Objetivos de Calidad:**

La definición empírica de calidad se formaliza mediante umbrales innegociables (Quality Gates) verificados en cada Pull Request sobre los repositorios del proyecto (backend y frontend). Un incremento se considera no apto para integrar si incumple alguna de las siguientes métricas:

* **Cobertura de pruebas unitarias:** mínimo 80% general; 95% en el módulo de dominio que calcula precios y valida stock (por ser el núcleo del negocio).  
* **Cero tests rotos:** la suite completa (unitarios \+ integración) debe pasar en verde antes de mergear a develop.  
* **Reglas de negocio en el dominio:** ninguna validación crítica (precio \> 0, stock, márgenes) puede depender únicamente de controles en el frontend sin revalidación en el backend.

**Revisión y Prueba:**

La validación se escalona en tres niveles:

* **Pruebas unitarias (Jest):** sobre las funciones críticas del dominio.  
* **Pruebas de integración (Supertest):** entre los endpoints de NestJS, los servicios de aplicación y la base de datos MySQL.  
* **Pruebas de Aceptación (UAT):** ejecutadas por los Testers, simulando escenarios reales de uso para validar que el comportamiento coincida con los criterios de aceptación de cada historia de usuario.

## **7\. Planificación de Comunicación** {#7.-planificación-de-comunicación}

Para ejecutar la planificación de la comunicación, el equipo asignará los siguientes recursos y preparativos específicos :

* **Tiempo de los integrantes**: Se ha previsto dedicar tiempo en cada jornada a las actividades de comunicación. Por ejemplo, \~15 minutos cada mañana para la reunión diaria, unos 10-15 minutos adicionales durante el día para resolver consultas por chat, y alrededor de 30-45 minutos para cada retrospectiva. Asimismo, antes de las entregas importantes, el equipo destina varias horas a la revisión conjunta de documentación. Estas actividades están contempladas en el cronograma, ya que aunque consumen tiempo, son esenciales para evitar malentendidos y retrasos posteriores.   
* **Herramientas y plataformas**: Todos los canales de comunicación definidos ya han sido configurados sin costo adicional:   
  * Se cuenta con un servidor privado de Discord exclusivo para el proyecto, con canales de texto y voz donde solo está el equipo.   
  * Se ha creado un grupo de WhatsApp con los 8 integrantes para comunicación móvil inmediata.   
  * El repositorio GitHub del proyecto está creado y compartido con todos los miembros (el profesor tiene acceso de lectura para seguimiento).  
  * Se dispone de Google Drive con carpetas compartidas; dentro de estas, un documento Google Docs central para el Plan de Proyecto y otros documentos colaborativos (todos los miembros tienen permisos de edición).   
  * Cada miembro utiliza su propia computadora personal y conexión a internet para acceder a estas plataformas. No se requiere equipamiento extra ya que son herramientas online accesibles desde cualquier lugar.

* **Responsables de comunicación**: Augusto Santiesteban, como Gerente de Proyecto, actúa como punto focal para las comunicaciones: es el encargado de coordinar las reuniones, asegurar que las actas o conclusiones claves queden registradas (en Discord o Docs), y de canalizar la comunicación con el profesor. No obstante, todos los integrantes comparten responsabilidad de comunicarse de forma proactiva dentro del equipo: cada uno reporta su estado en los stand-ups, plantea problemas cuando surgen (no “se los guarda”) y documenta adecuadamente su trabajo en GitHub y Google Docs. La filosofía del grupo es “sobrecomunicar” ante la duda, especialmente por el corto tiempo de proyecto, para prevenir confusiones. 

* **Verificación y seguimiento:** Se asignarán propietarios para seguir ciertas comunicaciones: por ejemplo, Valentin (responsable de Testing) verificará que los resultados de pruebas y cobertura se comuniquen en el informe; Santiago Falvo (backend) se asegurará de documentar en el README cualquier configuración especial de despliegue para informar al profesor; Capuano Juan (frontend) revisará que cualquier limitación conocida en la interfaz se anote como deuda técnica comunicada. De esta forma, cada área clave tiene un encargado de que su estado quede bien comunicado. 

Estos recursos y acciones asignados a la comunicación buscan asegurar que la información fluya eficientemente. Dado que no hay presupuesto monetario en un proyecto universitario, el principal recurso invertido es el tiempo y compromiso del equipo en comunicarse bien. La planificación cuidadosa de las comunicaciones contribuye a minimizar retrabajos y aumentar la calidad del resultado dentro del corto plazo disponible. 

## **8\. Planificación de los Cambios** {#8.-planificación-de-los-cambios}

**Proceso de Cambio:**

Durante el desarrollo del proyecto, los posibles cambios en los requerimientos, funcionalidades o componentes técnicos serán gestionados mediante un proceso de control de cambios que garantice la trazabilidad y la estabilidad del sistema.

El proceso de cambio seguirá los siguientes pasos:

1. **Identificación del cambio:** el equipo de desarrollo o el docente evaluador podrá detectar la necesidad de modificar o mejorar una funcionalidad existente, ya sea por error, mejora técnica, ajuste de requerimiento o ambigüedad detectada en una funcionalidad.  
2. **Registro y análisis:** se documentará el cambio propuesto en el tablero, indicando su motivo, impacto estimado, módulos afectados y, cuando corresponda, las historias de usuario involucradas.  
3. **Evaluación del impacto:** se analizará cómo el cambio afecta al tiempo, al alcance y a la calidad del producto. Se evaluará en particular el impacto sobre el modelo de dominio documentado: si el cambio introduce un concepto nuevo, modifica un agregado o agrega una regla de negocio, el análisis de dominio debe actualizarse en el mismo movimiento. Si el impacto es significativo, se revisará el cronograma y las prioridades.  
4. **Priorización:** los cambios se priorizarán mediante una matriz de **Impacto vs. Esfuerzo**:  
   * Impacto alto \+ esfuerzo bajo → hacer de inmediato.  
   * Impacto alto \+ esfuerzo alto → planificar para la siguiente entrega.  
   * Impacto bajo \+ esfuerzo bajo → realizar si sobra tiempo.  
   * Impacto bajo \+ esfuerzo alto → descartar o posponer indefinidamente.  
5. **Aprobación del cambio:** el cambio será validado internamente por el Product Owner antes de su ejecución. Los cambios que afecten el alcance comprometido con la cátedra se consultarán con el docente.  
6. **Implementación y pruebas:** una vez aprobado, el cambio se aplicará en una rama de feature y se realizarán las pruebas unitarias e integrales correspondientes, además de ejecutar la suite de regresión completa antes de integrar.  
7. **Actualización de la documentación:** finalmente se actualizará la documentación del sistema (análisis de dominio, Event Storming, matriz de trazabilidad, README y registro de deuda técnica) para reflejar las modificaciones realizadas.  
   

| Versión del Plan de Proyecto |  |
| ----- | :---- |
| 1.0.0 | 22/10/2026 |

