import { IsUUID } from 'class-validator';

/**
 * DTO for assignment/unassignment endpoints.
 */
export class AssignUserDto {
  /** ID of the user to assign/unassign. */
  @IsUUID()
  userId!: string;
}
