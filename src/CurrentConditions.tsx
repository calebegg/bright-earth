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

import { Weather } from './fetchWeather';
import React from 'react';

export function CurrentConditions({ weather }: { weather: Weather | null }) {
  return (
    <div className="current-conditions">
      <div className="temp">{weather?.current.temp ?? '--'}°</div>
      <div className="metadata">
        <strong>{weather?.current.desc ?? ''}</strong>
        <div>
          Wind:{' '}
          {'N,NNE,NE,ENE,E,ESE,SE,SSE,S,SSW,SW,WSW,W,WNW,NW,NNW,N'.split(',')[
            Math.round((weather?.wind.dir ?? -1) / 22.5)
          ] ?? '--'}
          , {weather?.wind.speed ?? '--'} mph
        </div>
        <div>
          Dew point: {weather?.current.dewpoint ?? '--'}°F{' '}
          {weather
            ? (() => {
                if (weather.current.dewpoint < 50) return '';
                if (weather.current.dewpoint < 60) return '(humid)';
                if (weather.current.dewpoint < 65) return '(muggy)';
                if (weather.current.dewpoint < 70) return '(very muggy)';
                return '(oppressively muggy)';
              })()
            : ''}
        </div>
      </div>
    </div>
  );
}
