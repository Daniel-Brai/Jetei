import {
  Body,
  Post,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RequestUser } from '@/interfaces';
import { PrefixedController } from '@/common/decorators/app.decorators';
import { AuthenticationService } from './authentication.service';
import {
  UserForgetPasswordDto,
  UserResetPasswordDto,
  UserSignUpDto,
  UserVerifyAccountDto,
} from './dtos/authentication.dtos';
import { LocalGuard } from './guards/local.guard';

@PrefixedController('authentication')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/signup')
  public async signup(@Body() body: UserSignUpDto) {
    return await this.authService.signup({
      email: body.email,
      password: body.password,
    } as Prisma.UserCreateInput);
  }

  @UseGuards(LocalGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  public login(@Req() req: RequestUser) {
    return this.authService.login(req);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/verify-account')
  public async verify(@Query() query: UserVerifyAccountDto) {
    return await this.authService.verify(query);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/forgot-password')
  public async forgotPassword(@Body() body: UserForgetPasswordDto) {
    return await this.authService.forgotPassword({
      email: body.email,
    } as Prisma.UserWhereUniqueInput);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/reset-password')
  public async resetPassword(
    @Query('token') token: string,
    @Body() body: UserResetPasswordDto,
  ) {
    return await this.authService.ResetPasswordByToken(token, body);
  }
}
