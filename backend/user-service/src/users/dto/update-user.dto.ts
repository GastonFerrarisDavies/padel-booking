import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
