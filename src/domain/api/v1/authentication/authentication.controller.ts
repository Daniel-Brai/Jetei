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
  Delete,
  UploadedFile,
  ParseFilePipe,
  UseInterceptors,
  FileTypeValidator,
} from '@nestjs/common';
import { PrefixedController } from '@/common/decorators/app.decorators';
import { AuthenticationService } from './authentication.service';
import {
  UpdateProfileDto,
  UserForgetPasswordDto,
  UserLoginDto,
  UserResetPasswordDto,
  UserSignUpDto,
  UserVerifyAccountDto,
} from './dtos/authentication.dtos';
import { Response } from 'express';
import { RequestUser } from '@/interfaces';
import { AccessTokenGuard } from './guards/access-token.guard';
import { FileInterceptor } from '@nestjs/platform-express';

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
    return await this.authService.resetPasswordByToken(token, body);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/me')
  public async getProfile(@Req() Req: RequestUser) {
    return await this.authService.getProfile(Req);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  public async updateProfileDto(
    @Req() req: RequestUser, 
    @Body() data: Omit<UpdateProfileDto, 'avatar'>,   
    @UploadedFile(
      'avatar'
    ) file?: UpdateProfileDto['avatar']) {
    return await this.authService.updateProfile(req, data, file);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('/me')
  public async deleteAccount(@Req() req: RequestUser) {
    return await this.authService.deleteAccount(req)
  }
}
