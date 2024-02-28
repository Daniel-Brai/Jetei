import {
  Body,
  Post,
  Get,
  Req,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
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
  @Post('/verify-account/:token')
  public async verify(@Param() params: UserVerifyAccountDto) {
    return await this.authService.verify(params);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/forgot-password')
  public async forgotPassword(@Body() body: UserForgetPasswordDto) {
    return await this.authService.forgotPassword({
      email: body.email,
    } as Prisma.UserWhereUniqueInput);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/reset-password/:token')
  public async resetPassword(
    @Param('token') token: string,
    @Body() body: UserResetPasswordDto,
  ) {
    return await this.authService.ResetPasswordByToken(token, body);
  }
}
