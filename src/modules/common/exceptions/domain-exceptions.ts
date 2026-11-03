
export class DomainException extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'DomainException';
  }     
}