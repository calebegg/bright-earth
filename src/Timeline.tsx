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

import React from 'react';
import { Weather } from './fetchWeather';

export function Timeline({
  hourly,
  daily,
}: {
  hourly: Weather['hourly'];
  daily: Weather['daily'];
}) {
  const temps = hourly.map(p => p.temp);
  const minTemp =
    5 *
    Math.floor(
      Math.min(
        ...temps.concat(daily.filter(d => d.low !== null).map(d => d.low!)),
      ) / 5,
    );
  const maxTemp =
    5 *
    Math.ceil(
      Math.max(
        ...temps
          .concat(daily.filter(d => d.high !== null).map(d => d.high!))
          .map(t => t + 1),
      ) / 5,
    );
  return (
    <table style={{ width: '95%' }}>
      <colgroup>
        <col className="time" width="35"></col>
        <col className="precip" width="30"></col>
        {range(minTemp, maxTemp, 5).map(v => (
          <col key={v} className="temp"></col>
        ))}
      </colgroup>
      <thead>
        <tr>
          <td colSpan={2}></td>
          {range(minTemp, maxTemp, 5).map(v => (
            <th key={v}>{v}°</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {hourly.map((p, i) => (
          <tr key={i}>
            <td>{toLabel(p.time)}</td>
            <td
              style={{
                backgroundColor: `rgba(0, 128, 255, ${p.precip / 120})`,
              }}
            >
              {p.precip}%
            </td>
            {range(minTemp, maxTemp, 5).map(v => (
              <td key={v}>
                {p.temp >= v && p.temp - 5 < v ? (
                  <span
                    style={{ marginLeft: `${(p.temp % 5) * 20}%` }}
                    className="temp-label"
                  >
                    {p.temp}
                  </span>
                ) : null}
              </td>
            ))}
          </tr>
        ))}
        <tr>
          <td colSpan={999}>&nbsp;</td>
        </tr>
        {daily.map((d, i) => (
          <tr key={i}>
            {d.name === daily[i - 1]?.name ? null : (
              <td rowSpan={d.name === daily[i + 1]?.name ? 2 : 1}>{d.name}</td>
            )}
            <td
              style={{
                backgroundColor: `rgba(0, 128, 255, ${d.precip / 100})`,
              }}
            >
              {d.precip}%
            </td>
            {range(minTemp, maxTemp, 5).map(v => (
              <td key={v}>
                {d.low && d.low >= v && d.low - 5 < v ? (
                  <span
                    style={{ marginLeft: `${(d.low % 5) * 20}%` }}
                    className="temp-label low"
                  >
                    {d.low}
                  </span>
                ) : null}
                {d.high && d.high >= v && d.high - 5 < v ? (
                  <span
                    style={{ marginLeft: `${(d.high % 5) * 20}%` }}
                    className="temp-label high"
                  >
                    {d.high}
                  </span>
                ) : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function toLabel(date: Date) {
  const hours = date.getHours();
  if (hours < 12) {
    return `${hours === 0 ? 12 : hours}a`;
  } else {
    return `${hours === 12 ? 12 : hours - 12}p`;
  }
}

function range(low: number, high: number, step: number) {
  return Array.from(
    { length: Math.floor((high - low) / 5) },
    (v, i) => i * step + low,
  );
}
