import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom, Observable } from 'rxjs';
import { AxiosError } from 'axios';

export interface SseEvent {
  data: string;
  type?: string;
  id?: string;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
  ) {}

  /**
   * Генерация отчёта через ML-сервис.
   */
  async generate(year: number) {
    try {
      this.logger.log(`Генерация отчёта за ${year} год`);
      const { data } = await firstValueFrom(
        this.http.post('/report', null, { params: { year } }),
      );

      // Сохраняем отчёт в БД
      const content = data?.content ?? data?.report;
      if (content) {
        await this.prisma.report.upsert({
          where: { year },
          create: { year, content },
          update: { content },
        });
      }

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? HttpStatus.BAD_GATEWAY;
        const detail = error.response?.data?.detail ?? error.message;
        this.logger.error(`Ошибка генерации отчёта: ${detail}`);
        throw new HttpException(
          { message: 'Ошибка генерации отчёта', detail },
          status,
        );
      }
      throw new HttpException(
        'Ошибка генерации отчёта',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Получение последнего отчёта из БД.
   */
  async getLatest(year: number) {
    const report = await this.prisma.report.findUnique({ where: { year } });
    return report ?? null;
  }

  /**
   * SSE-стриминг генерации отчёта, проксирование потока от ML-сервиса.
   */
  streamReport(year: number): Observable<SseEvent> {
    return new Observable<SseEvent>((subscriber) => {
      const abortController = new AbortController();

      (async () => {
        try {
          const response = await firstValueFrom(
            this.http.get('/report/stream', {
              params: { year },
              responseType: 'stream',
              signal: abortController.signal,
            }),
          );

          const stream = response.data;
          let buffer = '';

          stream.on('data', (chunk: Buffer) => {
            const text = chunk.toString();
            if (!text.includes('data:')) {
              subscriber.next({ data: text });
              return;
            }

            buffer += text;
            const lines = buffer.split('\n');
            // Последний элемент может быть незавершённой строкой
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                const payload = trimmed.slice(5).trim();
                subscriber.next({ data: payload });
              }
            }
          });

          stream.on('end', () => {
            // Обработать оставшийся буфер
            if (buffer.trim().startsWith('data:')) {
              subscriber.next({ data: buffer.trim().slice(5).trim() });
            }
            subscriber.complete();
          });

          stream.on('error', (err: Error) => {
            this.logger.error(`Ошибка SSE-потока: ${err.message}`);
            subscriber.error(err);
          });
        } catch (error) {
          this.logger.error(`Не удалось подключиться к SSE ML-сервиса: ${error}`);
          subscriber.error(error);
        }
      })();

      // Очистка при отписке клиента
      return () => {
        abortController.abort();
      };
    });
  }
}
