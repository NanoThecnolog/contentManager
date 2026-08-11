# Flixnext Content Service

Serviço de conteúdo do ecossistema Flixnext. Centraliza o catálogo mantido no MongoDB, enriquece filmes e séries com metadados do TMDB e disponibiliza essas informações aos demais componentes da plataforma.

## Responsabilidades

- cadastrar, consultar, atualizar e remover filmes e séries;
- manter temporadas e episódios associados às séries;
- informar os episódios adicionados recentemente;
- consultar o TMDB em português brasileiro;
- manter cache em memória dos metadados do TMDB;
- buscar somente os IDs ainda ausentes do cache;
- limitar a concorrência, aplicar retentativas seletivas e registrar métricas das consultas externas;
- remover do cache títulos que deixaram de fazer parte do catálogo;
- verificar a disponibilidade dos arquivos associados ao conteúdo;
- receber e transmitir trailers com suporte a requisições parciais.

## Fluxo do catálogo

1. O serviço consulta no MongoDB os identificadores atualmente cadastrados.
2. Registros já presentes no cache são reutilizados.
3. IDs ausentes são consultados no TMDB por uma fila com concorrência controlada.
4. A resposta é reduzida aos campos consumidos pela plataforma.
5. Dados do catálogo e métricas da operação são devolvidos ao cliente.

Esse processo permite refletir inclusões e remoções feitas no MongoDB sem armazenar uma cópia permanente dos metadados externos.

## Domínios da API

| Domínio                | Responsabilidade                                                                 |
| ---------------------- | -------------------------------------------------------------------------------- |
| Status                 | Disponibilidade básica do serviço                                                |
| Filmes                 | Catálogo, busca, manutenção, verificação de arquivos e enriquecimento pelo TMDB  |
| Séries                 | Catálogo, temporadas, episódios recentes, verificação e enriquecimento pelo TMDB |
| Mapeamento do catálogo | Lista compacta de identificadores disponíveis                                    |
| Trailers               | Upload, persistência de referência e streaming de vídeo                          |

## Documentação da API

A especificação OpenAPI e a interface Swagger UI ficam disponíveis em:

```text
/docs
```

As operações internas indicam no Swagger a autenticação por chave de serviço. O endpoint de status e a transmissão pública de trailers aparecem sem esse requisito.

## Estrutura principal

```text
src/
├── auth/           # Proteção das rotas internas
├── decorators/     # Metadados de acesso público
├── dto/            # Contratos de entrada
├── map/            # Mapeamento compacto do catálogo
├── mongoSchema/    # Schemas de filmes, séries, temporadas e episódios
├── movie/          # Catálogo e integração TMDB de filmes
├── serie/          # Catálogo, episódios e integração TMDB de séries
├── trailer/        # Upload e streaming de trailers
├── app.module.ts   # Composição dos módulos
└── main.ts         # Inicialização HTTP, CORS e Swagger
```

## Tecnologias e bibliotecas

- **NestJS** para organização modular da API;
- **Mongoose** e **MongoDB** para persistência do catálogo;
- **Fetch API** nativa do Node.js para integração com o TMDB;
- **Multer** para recebimento de trailers;
- **bcryptjs** para validação segura da chave entre serviços;
- **Swagger/OpenAPI** para documentação navegável;
- **RxJS**, **TypeScript**, **Jest**, **ESLint** e **Prettier** como base de desenvolvimento e qualidade.

## Segurança e observabilidade

As rotas internas são protegidas por uma guarda global. O serviço também aplica restrições de origem e cabeçalhos HTTP defensivos. As integrações com o TMDB produzem métricas de cache, latência, retentativas, limites de taxa e falhas para apoiar a análise de desempenho.

## Papel no Flixnext

O Content Service separa o catálogo e as integrações de conteúdo do frontend. Assim, os clientes recebem uma resposta consolidada enquanto cache, sincronização com o MongoDB e comunicação com o TMDB permanecem sob responsabilidade de um único serviço.
