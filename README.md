# BallIt – Front (Angular 20)

Front web para la API de BallIt: subir un video de tiro libre, ver el análisis del codo, el coach virtual,
el historial y la comparación antes/después.

## Requisitos
- Node.js 20.19+ o 22.12+ (`node -v`)
- Tu backend BallItMVP funcionando (Python + ffmpeg, ver su README)

## 1. Arrancar el backend (en la carpeta de BallItMVP)

Angular corre en el puerto **4200**, y la API por defecto solo permite 3000 y 5173, así que hay que
habilitar el origen:

**Windows (PowerShell)**
```powershell
$env:BALLIT_CORS_ORIGINS="http://localhost:4200"
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

**macOS / Linux**
```bash
BALLIT_CORS_ORIGINS=http://localhost:4200 python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

## 2. Arrancar el front (en esta carpeta)
```bash
npm install
npm start          # = ng serve  → http://localhost:4200
```

## Probarlo en el celular (misma red Wi-Fi)
1. Averigua la IP de tu PC (Linux: `hostname -I`; Windows: `ipconfig`), por ejemplo `192.168.1.20`.
2. Backend, aceptando conexiones de la red y ese origen:
   ```bash
   BALLIT_CORS_ORIGINS=http://localhost:4200,http://192.168.1.20:4200 python -m uvicorn api:app --host 0.0.0.0 --port 8000
   ```
3. Front: `npm start -- --host 0.0.0.0`
4. En el celular abre `http://192.168.1.20:4200`. El front calcula solo la dirección de la API
   (`http://<la misma IP>:8000`). Si no conecta, revisa el firewall de tu PC (puertos 4200 y 8000).

Para instalarla como app (pantalla completa, icono propio) el navegador exige HTTPS; por HTTP en la red
local solo podrás agregar un acceso directo a la pantalla de inicio.

## Configuración
La URL de la API está en `src/environments/environment.ts` (`apiBase`, por defecto `http://127.0.0.1:8000`).

## Estructura
```
src/app/
├── core/                  # modelos del contrato, servicio de la API, interceptor X-User-Id, perfil local
├── shared/                # iconos, anillo de puntaje, sparkline, cabecera, media segura (blob)
└── features/
    ├── home/              # inicio: último análisis, evolución, consejos
    ├── upload/            # nuevo análisis (video + opciones)
    ├── analysis/          # progreso (polling) + feedback en una pantalla: video, resumen, gráficas, coach y momentos clave
    ├── history/           # lista, eliminar, elegir 2 para comparar
    ├── compare/           # progreso: antes vs. después
    └── profile/           # nombre, mano por defecto, identificador
```

## Notas
- El UUID de usuario se guarda en `localStorage` (`ballit_user_id`). Si lo borras, pierdes acceso a tu historial.
- Los clips de cada tiro (con el esqueleto dibujado) los genera el backend en segundo plano; mientras tanto
  se muestra la imagen del tiro y se sigue consultando hasta que estén listos.
- La evaluación es solo del codo y con una regla provisional; la interfaz lo indica.

## Feedback unificado (base: PR CambiosJuandi hacia Prueba)

- Conserva la interfaz móvil oscura de Alejo, el anillo de puntaje y el coach tipo chat.
- Muestra el video completo arriba con esqueleto, ángulo, estela y velocidades 1×, 0.5× y 0.25×.
- El overlay usa los nombres de articulaciones del backend, admite puntos ausentes y se actualiza al reproducir, pausar, adelantar o cambiar el tamaño del video.
- Muestra la evolución del puntaje solo cuando hay más de un lanzamiento; conserva la gráfica del ángulo en el tiempo.
- Sustituye los rótulos «Tiro 1, Tiro 2» por momentos en segundos que permiten saltar al video.
- Muestra la racha en inicio, calculada desde el historial según la zona horaria del navegador. Si el historial falla, no muestra una racha inventada.
- El video ocupa todo el ancho y conserva su proporción original sin recortes.
- Momentos clave se despliega como carrusel horizontal: selección por tiempo, flechas, teclado o deslizamiento; cada lanzamiento muestra sus métricas y su propia gráfica de ángulo. Los clips se cargan solo al abrirlo y seleccionar el lanzamiento.
- El coach muestra un resumen breve; las recomendaciones completas se pueden desplegar.
- El video sigue usando la descarga autenticada con X-User-Id. No agrega dependencias ni Electron.

Para probar: inicia el backend y Angular como se indica arriba y abre un análisis terminado desde el historial, o sube un video nuevo. Verifica un video con un lanzamiento y otro con varios.

```bash
npm ci
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```
