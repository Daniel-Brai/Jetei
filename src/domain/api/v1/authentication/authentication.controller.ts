import {
  Body,
  Post,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Res,
  Get,
} from '@nestjs/common';
import { PrefixedController } from '@/common/decorators/app.decorators';
import { AuthenticationService } from './authentication.service';
import {
  UserForgetPasswordDto,
  UserLoginDto,
  UserResetPasswordDto,
  UserSignUpDto,
  UserVerifyAccountDto,
} from './dtos/authentication.dtos';
import { Response } from 'express';

@PrefixedController('authentication')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/signup')
  public async signup(@Body() body: UserSignUpDto) {
    return await this.authService.signup(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  public async login(
    @Body() body: UserLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.login(body, res);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/verify-account')
  public async verify(@Query() query: UserVerifyAccountDto) {
    return await this.authService.verify(query);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/forgot-password')
  public async forgotPassword(@Body() body: UserForgetPasswordDto) {
    return await this.authService.forgotPassword(body);
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
