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

import React, { useEffect, useState } from 'react';
import { NextHour } from './NextHour';
import { Timeline } from './Timeline';
import { Weather, fetchWeather } from './fetchWeather';
import { CurrentConditions } from './CurrentConditions';

export function App() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const posFromUrl = new URL(location.href).searchParams.get('loc');
      let pos: GeolocationPosition | null;
      if (posFromUrl) {
        const [latitude, longitude] = posFromUrl.split(',').map(v => Number(v));
        pos = {
          coords: { latitude, longitude } as GeolocationCoordinates,
          timestamp: Date.now(),
        };
      } else {
        pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      }
      if (canceled) return;
      setPosition(pos);
      const weather = await fetchWeather(pos);
      if (canceled) return;
      setWeather(weather);
    })();
    return () => {
      canceled = true;
    };
  }, []);
  return (
    <>
      <CurrentConditions weather={weather} />
      <NextHour position={position} wind={weather?.wind} />
      {weather ? (
        <Timeline hourly={weather.hourly} daily={weather.daily} />
      ) : position ? (
        <>Loading data...</>
      ) : (
        <>Locating you...</>
      )}
      {weather ? (
        <footer>
          <p>
            Forecast updated{' '}
            {new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            }).format(weather.metadata.created)}
          </p>
          All data from <a href="https://weather.gov">weather.gov</a>'s APIs.
        </footer>
      ) : (
        ''
      )}
    </>
  );
}
