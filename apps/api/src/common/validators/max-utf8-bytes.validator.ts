import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function MaxUtf8Bytes(
  maxBytes: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxUtf8Bytes',
      target: object.constructor,
      propertyName,
      constraints: [maxBytes],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string') return true;
          return Buffer.byteLength(value, 'utf8') <= args.constraints[0];
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} cannot exceed ${args.constraints[0]} UTF-8 bytes`;
        },
      },
    });
  };
}
