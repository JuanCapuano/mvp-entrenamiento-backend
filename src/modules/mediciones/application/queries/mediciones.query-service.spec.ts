import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { RolNombre } from '../../../gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { Usuario } from '../../../gestion-usuario/usuario/domain/entities/usuario.entity';
import { MedicionCorporal } from '../../domain/entities/medicion-corporal.entity';
import { Altura } from '../../domain/value-objects/altura.vo';
import { PesoCorporal } from '../../domain/value-objects/peso-corporal.vo';
import { MedicionesQueryService } from './mediciones.query-service';

// Datos del Paso 10: Laura entrena a Juan; Sofía no tiene entrenador
const LAURA = { id: 1, rol: RolNombre.ENTRENADOR };
const JUAN = { id: 3, rol: RolNombre.DEPORTISTA };
const SOFIA_ID = 4;

const medicion = (fecha: string, peso: number) =>
  MedicionCorporal.registrar(
    JUAN.id,
    PesoCorporal.crear(peso),
    Altura.crear(1.76),
    fecha,
  );

describe('MedicionesQueryService (US-21, RN17)', () => {
  let mediciones: { find: jest.Mock };
  let usuarios: { exists: jest.Mock };
  let queryService: MedicionesQueryService;

  beforeEach(() => {
    mediciones = {
      find: jest
        .fn()
        .mockResolvedValue([
          medicion('2026-10-01', 78.4),
          medicion('2026-10-11', 78),
        ]),
    };
    // Solo Juan está vinculado con Laura
    usuarios = {
      exists: jest.fn(({ where }) =>
        Promise.resolve(
          where.id === JUAN.id && where.entrenadorId === LAURA.id,
        ),
      ),
    };
    queryService = new MedicionesQueryService(
      mediciones as unknown as Repository<MedicionCorporal>,
      usuarios as unknown as Repository<Usuario>,
    );
  });

  const filtroUsado = () => mediciones.find.mock.calls[0][0];

  it('devuelve fecha, peso corporal y altura de cada medición', async () => {
    const respuesta = await queryService.listarMediciones(JUAN, {});

    expect(respuesta).toEqual([
      { fecha: '2026-10-01', peso_corporal: 78.4, altura: 1.76 },
      { fecha: '2026-10-11', peso_corporal: 78, altura: 1.76 },
    ]);
  });

  it('el deportista ve solo sus mediciones, en orden cronológico', async () => {
    await queryService.listarMediciones(JUAN, {});

    expect(filtroUsado().where.deportistaId).toBe(JUAN.id);
    expect(filtroUsado().order).toEqual({ fecha: 'ASC' });
    expect(usuarios.exists).not.toHaveBeenCalled();
  });

  it('el deportista no puede pedir las mediciones de otro (403)', async () => {
    await expect(
      queryService.listarMediciones(JUAN, { deportista_id: SOFIA_ID }),
    ).rejects.toThrow(ForbiddenException);
    expect(mediciones.find).not.toHaveBeenCalled();
  });

  it('el entrenador ve las mediciones de un deportista vinculado', async () => {
    await queryService.listarMediciones(LAURA, { deportista_id: JUAN.id });

    expect(filtroUsado().where.deportistaId).toBe(JUAN.id);
  });

  it('el entrenador no puede ver a un deportista que no está vinculado con él (403)', async () => {
    await expect(
      queryService.listarMediciones(LAURA, { deportista_id: SOFIA_ID }),
    ).rejects.toThrow(
      new ForbiddenException('El deportista no está vinculado con vos.'),
    );
    expect(mediciones.find).not.toHaveBeenCalled();
  });

  it('el entrenador tiene que indicar el deportista (422)', async () => {
    await expect(queryService.listarMediciones(LAURA, {})).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('sin rango de fechas no filtra por fecha', async () => {
    await queryService.listarMediciones(JUAN, {});

    expect(filtroUsado().where.fecha).toBeUndefined();
  });

  it.each([
    [{ desde: '2026-10-01', hasta: '2026-10-31' }],
    [{ desde: '2026-10-01' }],
    [{ hasta: '2026-10-31' }],
  ])('con %p filtra por fecha', async (rango) => {
    await queryService.listarMediciones(JUAN, rango);

    expect(filtroUsado().where.fecha).toBeDefined();
  });
});
