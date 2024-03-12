import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(user: any, done: any): any {
    console.log('Serializing user:', user);
    done(null, user);
  }

  deserializeUser(payload: any, done: any): any {
    console.log('Deserializing payload:', payload);
    done(null, payload);
  }
}