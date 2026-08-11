import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './decorators/public.decorator';

@ApiTags('Status')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Consultar disponibilidade do serviço' })
  @ApiResponse({ status: 200, description: 'Serviço disponível.' })
  getHello(): string {
    return this.appService.getHello();
  }
}
