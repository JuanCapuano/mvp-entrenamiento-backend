// El repositorio informa una colisión de unicidad para reintentar con datos nuevos.
// No es una violación de negocio ni contiene detalles de TypeORM/MySQL.
export class RegistroConcurrenteException extends Error {}
