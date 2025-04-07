import { Body, Controller, Get, NotFoundException, Param, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { TrailerService } from './trailer.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateVideoDTO } from 'src/dto/create-video.dto';
import { extname, join } from 'path';
import { createReadStream, existsSync, statSync } from 'fs';
import { Request, Response } from 'express';

@Controller('trailer')
export class TrailerController {
    constructor(private readonly videoService: TrailerService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/videos',
            filename: (req, file, cb) => {
                const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`
                cb(null, uniqueName)
            }
        }),
        fileFilter: (req, file, cb) => {
            if (file.mimetype !== 'video/x-matroska') {
                return cb(new Error('Only .mkv files are allowed!'), false)
            }
            cb(null, true)
        }
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: CreateVideoDTO) {
        const filePath = file.path
        const saved = await this.videoService.saveVideo(body.id, filePath)
        return {
            message: 'Upload bem-sucedido',
            video: saved
        }
    }

    @Get(':id')
    async streamVideo(@Param('id') id: number, @Req() req: Request, @Res() res: Response) {
        const video = await this.videoService.findById(id)
        if (!video) throw new NotFoundException('Vídeo não encontrado')

        const filePath = join(process.cwd(), video.path)
        if (!existsSync(filePath)) throw new NotFoundException('Arquivo de vídeo não encontrado.')

        const stat = statSync(filePath)
        const fileSize = stat.size
        const range = req.headers.range

        if (!range) {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/x-matroska'
            })
            createReadStream(filePath).pipe(res)
            return;
        }

        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

        const chunkSize = end - start + 1
        const file = createReadStream(filePath, { start, end })

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/x-matroska',
        })

        return res.sendFile(filePath)
    }

}
