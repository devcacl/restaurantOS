import { IsEmail, IsString, IsNotEmpty, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRoleEnum {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  WAITER = 'WAITER',
  COOK = 'COOK',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
}

export class CreateUserDto {
  @ApiProperty({ example: 'waiter.new@restaurantos.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'WAITER', enum: UserRoleEnum })
  @IsEnum(UserRoleEnum)
  @IsNotEmpty()
  roleName: UserRoleEnum;

  @ApiPropertyOptional({ example: 'branch-uuid-here' })
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'waiter.updated@restaurantos.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'newpassword123', minLength: 6 })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'WAITER', enum: UserRoleEnum })
  @IsEnum(UserRoleEnum)
  @IsOptional()
  roleName?: UserRoleEnum;

  @ApiPropertyOptional({ example: 'branch-uuid-here' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsString()
  @IsOptional()
  status?: string;
}
