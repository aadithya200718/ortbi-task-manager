import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SafeUser } from '../auth.service';

export const CurrentUser = createParamDecorator(
  (data: keyof SafeUser | undefined, ctx: ExecutionContext): SafeUser | SafeUser[keyof SafeUser] | null => {
    const request = ctx.switchToHttp().getRequest<{ user?: SafeUser }>();
    const user = request.user;
    if (!user) {
      return null;
    }
    return data ? user[data] : user;
  },
);
