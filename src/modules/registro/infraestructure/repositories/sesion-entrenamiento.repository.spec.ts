import { DataSource, Repository } from 'typeorm';
import { SesionEntrenamiento } from '../../domain/entities/sesion-entrenamiento.entity';
import { Serie } from '../../domain/entities/serie.entity';
import { SesionEntrenamientoFactory } from '../../domain/factories/sesion-entrenamiento.factory';
import { Peso } from '../../domain/value-objects/peso.vo';
import { Repeticiones } from '../../domain/value-objects/repeticiones.vo';
import { RIR } from '../../domain/value-objects/rir.vo';
import { RegistroConcurrenteException } from '../../domain/exceptions/registro-concurrente.exception';
import { SesionEntrenamientoRepository } from './sesion-entrenamiento.repository';

class FuenteDeMetadatos extends DataSource {
  construirMetadatos() {
    return this.buildMetadatas();
  }
}

describe('Persistencia de registro', () => {
  it('mapea agregados, cascada, unicidad y value objects sin conectarse a MySQL', async () => {
    const fuente = new FuenteDeMetadatos({
      type: 'mysql',
      database: 'registro_solo_metadatos',
      entities: [SesionEntrenamiento, Serie],
    });
    await fuente.construirMetadatos();
    const sesion = fuente.getMetadata(SesionEntrenamiento);
    const serie = fuente.getMetadata(Serie);
    expect(
      sesion.indices.find(
        (indice) => indice.name === 'uq_sesion_deportista_rutina_fecha',
      )?.isUnique,
    ).toBe(true);
    expect(
      serie.indices.find(
        (indice) => indice.name === 'uq_serie_sesion_ejercicio_numero',
      )?.isUnique,
    ).toBe(true);
    expect(sesion.relations[0].isCascadeInsert).toBe(true);
    expect(sesion.relations[0].inverseRelation?.propertyName).toBe('sesion');
    expect(serie.relations[0].orphanedRowAction).toBe('disable');
    for (const [nombre, valor] of [
      ['peso', Peso.crear(62.5)],
      ['repeticiones', Repeticiones.crear(8)],
      ['rir', RIR.crear(0)],
    ] as const) {
      const columna = serie.findColumnWithPropertyName(nombre)!;
      expect(fuente.driver.preparePersistentValue(valor, columna)).toBe(
        valor.valor,
      );
      const desdeBase = fuente.driver.prepareHydratedValue(
        nombre === 'peso' ? '62.50' : valor.valor,
        columna,
      );
      expect(desdeBase).toBeInstanceOf(valor.constructor);
      expect(desdeBase.valor).toBe(valor.valor);
    }
  });

  it('traduce solo las colisiones conocidas y propaga los demás errores', async () => {
    const guardar = jest.fn();
    const repositorio = new SesionEntrenamientoRepository(
      { save: guardar } as unknown as Repository<SesionEntrenamiento>,
      {} as Repository<Serie>,
    );
    const sesion = new SesionEntrenamientoFactory().crear(
      3,
      1,
      1,
      '2026-10-21',
      1,
      Peso.crear(60),
      Repeticiones.crear(8),
      RIR.crear(2),
    );
    for (const indice of [
      'uq_sesion_deportista_rutina_fecha',
      'uq_serie_sesion_ejercicio_numero',
    ]) {
      guardar.mockRejectedValueOnce({
        driverError: {
          code: 'ER_DUP_ENTRY',
          message: `Duplicate entry for key '${indice}'`,
        },
      });
      await expect(repositorio.guardar(sesion)).rejects.toBeInstanceOf(
        RegistroConcurrenteException,
      );
    }
    const error = new Error('Conexión perdida');
    guardar.mockRejectedValueOnce(error);
    await expect(repositorio.guardar(sesion)).rejects.toBe(error);
  });
});
