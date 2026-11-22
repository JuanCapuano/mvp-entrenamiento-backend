export class DeportistaResponseDto {
    id: number;
    nombre: string;
    email: string;    
     // US-04: plan vigente, tira null si no tiene (o sea, el front muestra "sin plan")
    plan_vigente: { nombre: string; desde: string; hasta: string } | null;
}