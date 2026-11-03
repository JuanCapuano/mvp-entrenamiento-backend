import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/gestion-usuario/auth/auth.module';
import { UsuarioModule } from './modules/gestion-usuario/usuario/usuario.module';
import { RolModule } from './modules/gestion-usuario/rol/rol.module';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { MedicionesModule } from './modules/mediciones/mediciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: (process.env.DB_TYPE as 'mysql') || 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10), // Si PORT es undefined, usa 3306
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      timezone: '-03:00',
      // Las entidades se registran automáticamente cuando usás
      // TypeOrmModule.forFeature([Entidad]) en tus módulos
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Nunca usar en producción, solo para desarrollo
      ssl: process.env.DB_SSL === 'true',
    }),
    AuthModule,
    UsuarioModule,
    RolModule,
    CatalogoModule,
    MedicionesModule,
  ],
})
export class AppModule {}
