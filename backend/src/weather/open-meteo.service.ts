import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface WindForecast {
  time: string;
  windSpeedKnots: number;
  windDirection: number;
}

@Injectable()
export class OpenMeteoService {
  private readonly logger = new Logger(OpenMeteoService.name);

  async getWindForecast(lat: number, lng: number, fromIso: string, toIso: string): Promise<WindForecast[]> {
    const startDate = fromIso.split('T')[0];
    const endDate = toIso.split('T')[0];

    const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lng,
        hourly: 'wind_speed_10m,wind_direction_10m',
        wind_speed_unit: 'mph',
        start_date: startDate,
        end_date: endDate,
        timezone: 'UTC',
      },
    });

    const from = new Date(fromIso).getTime();
    const to = new Date(toIso).getTime();
    const MPH_TO_KNOTS = 0.868976;

    return (data.hourly.time as string[])
      .map((t: string, i: number) => ({
        time: t,
        windSpeedKnots: Math.round(data.hourly.wind_speed_10m[i] * MPH_TO_KNOTS * 10) / 10,
        windDirection: data.hourly.wind_direction_10m[i],
      }))
      .filter((f: WindForecast) => {
        const ts = new Date(f.time).getTime();
        return ts >= from && ts <= to;
      });
  }
}
