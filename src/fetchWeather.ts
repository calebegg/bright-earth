/**
 * @license
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Janky DWML fetcher/parser
export async function fetchWeather(
  position: GeolocationPosition,
): Promise<Weather> {
  const basePage = `https://forecast.weather.gov/MapClick.php?lat=${position.coords.latitude}&lon=${position.coords.longitude}`;
  const [hourlyXml, dailyXml] = await Promise.all([
    fetch(`${basePage}&FcstType=digitalDWML`).then(r => r.text()),
    fetch(`${basePage}&FcstType=dwml`).then(r => r.text()),
  ]);
  const hourly = new DOMParser().parseFromString(hourlyXml, 'text/xml');
  const daily = new DOMParser().parseFromString(dailyXml, 'text/xml');
  return {
    metadata: {
      created: new Date(hourly.querySelector('creation-date')!.textContent!),
    },

    current: {
      temp: +daily.querySelector(
        'temperature[type="apparent"][time-layout="k-p1h-n1-1"] > value',
      )!.textContent!,
      desc: daily
        .querySelector(
          'weather[time-layout="k-p1h-n1-1"] > weather-conditions',
        )!
        .getAttribute('weather-summary')!,
      dewpoint: +daily.querySelector(
        'temperature[type="dew point"][time-layout="k-p1h-n1-1"] > value',
      )!.textContent!,
      feelsLike: +hourly.querySelector(
        'temperature[type="wind chill"] > value',
      )!.textContent!,
      icon: convertIcon(
        daily.querySelector(
          'conditions-icon[type="forecast-NWS"][time-layout="k-p1h-n1-1"] > icon-link',
        )!.textContent!,
      ),
    },

    daily: getDailyData(daily),

    wind: {
      dir: +hourly.querySelector('direction[type="wind"]')!.firstChild!
        .textContent!,
      speed: +hourly.querySelector('wind-speed[type="sustained"]')!.firstChild!
        .textContent!,
    },

    hourly: getHourlyData(hourly),
  };
}

function getHourlyData(hourly: Document) {
  const precips = Array.from(
    hourly.querySelector('probability-of-precipitation')!.children,
  ).map(n => Math.round(+n.textContent! / 5) * 5);

  const temps = Array.from(
    hourly.querySelector('temperature[type="hourly"]')!.children,
  ).map(n => +n.textContent!);

  return Array.from(
    hourly.querySelector('time-layout')!.querySelectorAll('start-valid-time'),
  )
    .slice(0, 12)
    .map((n, i) => ({
      time: new Date(n.textContent!),
      precip: precips[i],
      temp: temps[i],
    }));
}

function getDailyData(daily: Document): Weather['daily'] {
  // Time layouts
  const timeLayouts = Array.from(daily.querySelectorAll('time-layout')).map(n =>
    Array.from(n.querySelectorAll('start-valid-time')).map(
      n => new Date(n.textContent!),
    ),
  );

  const all = timeLayouts.find(l => l.length > 10) || [];
  const [first, second] = timeLayouts.filter(
    l => l.length < 10 && l.length > 4,
  );

  let days, nights;

  if (
    daily
      .querySelector('temperature[type="maximum"]')!
      .getAttribute('time-layout') === 'k-p24h-n7-1'
  ) {
    [days, nights] = [first, second];
  } else {
    [days, nights] = [second, first];
  }

  const precips = Array.from(
    daily.querySelectorAll('probability-of-precipitation > value')!,
  ).map(n => +n.textContent!);

  const highs = Array.from(
    daily.querySelectorAll('temperature[type="maximum"] > value'),
  ).map(n => +n.textContent!);
  const highsByTime = new Map(
    days
      .map((d, i) => [d.valueOf(), highs[i]] as const)
      .filter(e => !isNaN(e[1])),
  );

  const lows = Array.from(
    daily.querySelectorAll('temperature[type="minimum"] > value'),
  ).map(n => +n.textContent!);
  const lowsByTime = new Map(
    nights
      .map((d, i) => [d.valueOf(), lows[i]] as const)
      .filter(e => !isNaN(e[1])),
  );

  return all
    .filter(d => d > new Date())
    .map((d, i) => ({
      name: `${'SUN,MON,TUE,WED,THU,FRI,SAT'.split(',')[d.getDay()]}`,
      precip: precips[i],
      high: highsByTime.get(d.valueOf()) ?? null,
      low: lowsByTime.get(d.valueOf()) ?? null,
    }));
}

function convertIcon(url: string) {
  const file = url.substring(
    'https://forecast.weather.gov/newimages/medium/'.length,
  );
  const icon = file.substring(0, file.length - 4);
  const mapped = ICON_MAP.get(icon);
  if (mapped) {
    return mapped;
  } else {
    return url;
  }
}

// From: https://forecast.weather.gov/newimages/medium/few.png
const ICON_MAP = new Map([
  ['bkn', '\uf15b'],
  ['few', '\uf172'],
  ['fg', '\ue818'],
  ['nbkn', '\uf15b'],
  ['nfew', '\uf174'],
  ['novc', '\uf15b'],
  ['nra', '\uf176'],
  ['nsct', '\uf174'],
  ['ovc', '\uf15b'],
  ['ra', '\uf176'],
  ['sct', '\uf172'],
  ['wind_sct', '\uefd8'],
]);

export interface Weather {
  metadata: {
    created: Date;
  };
  wind: {
    dir: number;
    speed: number;
  };
  daily: Array<{
    name: string;
    low: number | null;
    high: number | null;
    precip: number;
  }>;
  current: {
    temp: number;
    desc: string;
    dewpoint: number;
    feelsLike: number;
    icon: string;
  };
  hourly: Array<{
    time: Date;
    precip: number;
    temp: number;
  }>;
}
