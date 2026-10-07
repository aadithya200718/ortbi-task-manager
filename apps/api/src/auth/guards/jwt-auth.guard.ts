import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(err: unknown, user: TUser, info: unknown): TUser {
    if (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Authentication failed');
    }

    if (!user) {
      if (info instanceof Error) {
        if (info.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Session expired. Please log in again.');
        }
        if (info.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Invalid or malformed authentication token');
        }
      }
      throw new UnauthorizedException('Authentication required');
    }

    return user;
  }
}
