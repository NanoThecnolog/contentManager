import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { compareSync } from 'bcryptjs';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private configService: ConfigService, private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {

        const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler())
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['key'];

        if (!apiKey) {
            throw new UnauthorizedException('Chave API não fornecida');
        }

        const apiKeyHash = this.configService.get<string>('API_KEY_HASH')
        if (!apiKeyHash) throw new Error("Variável de ambiente hash não definido")
        if (!compareSync(apiKey, apiKeyHash)) {
            throw new UnauthorizedException('Chave API inválida');
        }
        return true;
    }
}