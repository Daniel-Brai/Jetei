import { AuthenticationService } from './authentication.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/infrastructure/gateways/database/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CloudinaryService } from '@/lib/cloudinary/cloudinary.service';
import { UserSignUpDto } from './dtos/authentication.dtos';
import { APIResponse } from '@/types';

describe('The AuthenticationService', () => {
  let authenticationService: AuthenticationService;
  beforeEach(() => {
    authenticationService = new AuthenticationService(
      new PrismaService(),
      new JwtService(),
      new EventEmitter2(),
      new CloudinaryService(),
    );
  });
  describe('Test user signup with valid email', () => {
    it('should return a success APIResponse', () => {
      const user = new UserSignUpDto();
      user.email = 'danielbrai.projects@gmail.com';
      user.password = 'Very$Strong%Password#6092434';
      user.name = 'Daniel Brai';
      const result = authenticationService.signup(user);
      expect(result).toBe<APIResponse<any>>({
        type: 'success',
        status_code: 200,
        api_message: 'Signup successful',
        api_description: 'Please check your email',
      });
    });
  });
});
