import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const Roles = (...role: UserRole[]) => SetMetadata('roles', role);
