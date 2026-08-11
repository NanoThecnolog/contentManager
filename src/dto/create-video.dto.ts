import { ApiProperty } from '@nestjs/swagger';

export class CreateVideoDTO {
  @ApiProperty({
    description: 'Identificador do conteúdo associado ao trailer.',
  })
  id: number;
}
