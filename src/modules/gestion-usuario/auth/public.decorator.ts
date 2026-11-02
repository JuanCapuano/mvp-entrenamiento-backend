import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Todas las rutas exigen token; solo las marcadas con @Public() quedan abiertas
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
