export class DeportistaResponseDto {
    id: number;
    nombre: string;
    email: string;    
     // US-04: plan vigente, tira null si no tiene (o sea, el front muestra "sin plan")
    // Nombres según el contrato del Paso 11 (vigencia_desde / vigencia_hasta), que es lo que lee el front
    plan_vigente: { nombre: string; vigencia_desde: string; vigencia_hasta: string } | null;
}