import { applyDecorators, Controller } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export function PrefixedController(path: string, prefix: string = 'api/v1') {
  return applyDecorators(Controller(`${prefix}/${path}`));
}

@ValidatorConstraint({ name: 'CustomMatchPasswords', async: false })
export class CustomMatchPasswords implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    if (password !== (args.object as any)[args.constraints[0]]) return false;
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(_args: ValidationArguments) {
    return 'Passwords do not match!';
  }
}
