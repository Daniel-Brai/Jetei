import { Module } from '@nestjs/common';
import { AuthenticationModule } from '@/domain/api/v1/authentication/authentication.module';
import { HubsModule } from '@/domain/api/v1/hubs/hubs.module';

@Module({
  imports: [AuthenticationModule, HubsModule],
})
export class APIV1Module {}
