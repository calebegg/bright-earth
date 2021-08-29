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

import React, { useRef, useEffect, useState } from 'react';

const TAU = Math.PI * 2;
const W = Math.min(innerWidth, 590) * devicePixelRatio;
const H = W / 4;
const RETICLE_X = 15;
const HOURS = 2;

export function NextHour({
  position,
  wind,
}: {
  position: Position | null;
  wind?: { dir: number; speed: number };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!position || !wind) return;
      const c = canvasRef.current!.getContext('2d')!;
      c.font = `${W / 45}px sans-serif`;

      const { latitude: lat, longitude: lon } = position.coords;

      const radar = new Image();
      const radarPromise = new Promise((resolve, reject) => {
        radar.addEventListener('load', resolve);
        radar.addEventListener('error', reject);
      });
      radar.crossOrigin = 'Anonymous';
      radar.src =
        'https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Observations/radar_base_reflectivity/MapServer/WmsServer?' +
        new URLSearchParams({
          REQUEST: 'GetMap',
          SERVICE: 'WMS',
          VERSION: '1.3.0',
          LAYERS: '1',
          STYLES: 'default',
          FORMAT: 'image/png',
          TRANSPARENT: 'TRUE',
          CRS: 'EPSG:4326',
          BBOX: `${lat - 1},${lon - 1},${lat + 1},${lon + 1}`,
          WIDTH: '256',
          HEIGHT: '256',
        });

      try {
        await radarPromise;
      } catch {
        setError(`Radar image unavailable`);
        return;
      }
      if (canceled) return;

      // This is suspicious
      const pixelLength = (wind.speed / 1.151) * HOURS;
      const scale = W / pixelLength;

      c.imageSmoothingEnabled = false;
      c.translate(RETICLE_X, H / 2);
      c.scale(scale, scale);
      c.rotate((-wind.dir / 360 - 0.25) * TAU);
      c.translate(-128, -128);
      c.drawImage(radar, 0, 0);
      c.resetTransform();

      c.strokeStyle = 'red';
      c.lineWidth = devicePixelRatio;
      c.strokeRect(RETICLE_X - 10, H / 2 - 10, 20, 20);

      for (let i = 0; i < HOURS * 60; i += 10) {
        const x = (i * W) / HOURS / 60 + RETICLE_X;
        c.strokeStyle = `rgba(0, 0, 0, ${i % 30 === 0 ? 0.5 : 0.125})`;
        c.beginPath();
        c.moveTo(x, H);
        c.lineTo(x, 0);
        const label = i === 0 ? 'now' : `${i}m`;
        c.fillStyle = 'white';
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            c.fillText(label, x + dx + 2, H + dy - 2);
          }
        }
        c.fillStyle = '#333';
        c.fillText(label, x + 2, H - 2);
        c.stroke();
      }
    })();
    return () => {
      canceled = true;
    };
  }, [wind, position]);

  return error ? (
    <div>{error}</div>
  ) : (
    <canvas width={W} height={H} ref={canvasRef}></canvas>
  );
}
