import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);

  constructor(private readonly http: HttpService) {}

  /**
   * Запуск полного ML-пайплайна для указанного года.
   */
  async runPipeline(year: number) {
    try {
      this.logger.log(`Запуск ML-пайплайна для года ${year}`);
      const { data } = await firstValueFrom(
        this.http.post('/run', null, { params: { year } }),
      );
      return data;
    } catch (error) {
      this.handleMlError(error, 'Ошибка запуска ML-пайплайна');
    }
  }

  /**
   * Получение SHAP-значений для конкретного региона.
   */
  async getShapValues(regionId: string, year: number) {
    try {
      const { data } = await firstValueFrom(
        this.http.get(`/shap/${regionId}`, { params: { year } }),
      );
      return data;
    } catch (error) {
      this.handleMlError(error, 'Ошибка получения SHAP-значений');
    }
  }

  /**
   * Получение результатов анализа за год.
   */
  async getResults(year: number) {
    try {
      const { data } = await firstValueFrom(
        this.http.get('/results', { params: { year } }),
      );
      return data;
    } catch (error) {
      this.handleMlError(error, 'Ошибка получения результатов ML');
    }
  }

  /**
   * Проверка статуса ML-сервиса.
   */
  async getStatus() {
    try {
      const { data } = await firstValueFrom(this.http.get('/health'));
      return { status: 'available', ...data };
    } catch {
      return { status: 'unavailable', message: 'ML-сервис недоступен' };
    }
  }

  private handleMlError(error: unknown, message: string): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status ?? HttpStatus.BAD_GATEWAY;
      const detail = error.response?.data?.detail ?? error.message;
      this.logger.error(`${message}: ${detail}`);
      throw new HttpException(
        { message, detail },
        status,
      );
    }
    this.logger.error(`${message}: ${error}`);
    throw new HttpException(message, HttpStatus.BAD_GATEWAY);
  }
}
