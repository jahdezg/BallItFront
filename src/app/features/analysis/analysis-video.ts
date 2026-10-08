import {
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { BallitApi } from '../../core/ballit-api.service';
import { AnalysisResult } from '../../core/models';
import { drawPose, frameAtTime } from './pose-overlay';

@Component({
  selector: 'app-analysis-video',
  template: `
    <section class="video-card" aria-label="Video analizado">
      <div class="video-stage">
        @if (src(); as url) {
          <video
            #video
            [src]="url"
            controls
            playsinline
            preload="metadata"
            (loadedmetadata)="redraw()"
            (seeked)="redraw()"
            (timeupdate)="redraw()"
            (play)="start()"
            (pause)="stop(); redraw()"
            (ended)="stop(); redraw()"
            (error)="failed.set(true)"
          ></video>
          <canvas #canvas aria-hidden="true"></canvas>
        }
        @if (failed() || !path()) {
          <p class="media-ph">El video no está disponible. El feedback sigue abajo.</p>
        } @else if (!src()) {
          <p class="media-ph">Cargando video…</p>
        }
      </div>
      <div class="video-toggles">
        <label
          ><input
            type="checkbox"
            [checked]="skeleton()"
            (change)="skeleton.set($any($event.target).checked); redraw()"
          />
          Esqueleto</label
        >
        <label
          ><input
            type="checkbox"
            [checked]="angles()"
            (change)="angles.set($any($event.target).checked); redraw()"
          />
          Ángulo</label
        >
        <label
          ><input
            type="checkbox"
            [checked]="trail()"
            (change)="trail.set($any($event.target).checked); redraw()"
          />
          Estela</label
        >
      </div>
      <div class="video-tools">
        <label
          >Velocidad
          <select aria-label="Velocidad del video" (change)="speed($any($event.target).value)">
            <option value="1">1×</option>
            <option value="0.5">0.5×</option>
            <option value="0.25">0.25×</option>
          </select>
        </label>
        <span class="muted small">Revisa tu movimiento en cámara lenta</span>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        margin-inline: -16px;
      }
      .video-card {
        border: 1px solid var(--line);
        border-radius: 0;
        border-inline: 0;
        overflow: hidden;
        background: var(--card);
      }
      .video-stage {
        position: relative;
        background: #000;
      }
      video {
        display: block;
        width: 100%;
        height: auto;
        object-fit: contain;
      }
      canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      .video-toggles {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        padding: 12px;
        border-top: 1px solid var(--line);
      }
      .video-toggles label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.85rem;
        cursor: pointer;
      }
      input {
        accent-color: var(--accent);
        width: 16px;
        height: 16px;
      }
      .video-tools {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 12px 12px;
      }
      .video-tools label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
      }
      select {
        width: auto;
        padding: 4px;
        font-size: 0.85rem;
      }
      .video-tools span {
        flex: 1;
        text-align: right;
      }
      @media (max-width: 360px) {
        .video-tools span {
          display: none;
        }
      }
    `,
  ],
})
export class AnalysisVideo implements OnDestroy {
  result = input.required<AnalysisResult>();
  private api = inject(BallitApi);
  protected path = computed(() => (this.result().video.available ? this.result().video.url : null));
  private frames = computed(() => [...this.result().frames].sort((a, b) => a.t - b.t));
  protected src = signal<string | null>(null);
  protected failed = signal(false);
  protected skeleton = signal(true);
  protected angles = signal(true);
  protected trail = signal(true);
  private video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private raf: number | null = null;
  private videoCallback: number | null = null;

  constructor() {
    effect((cleanup) => {
      const path = this.path();
      this.stop();
      this.src.set(null);
      this.failed.set(false);
      if (!path) return;
      let objectUrl: string | null = null;
      const sub = this.api.mediaUrl(path).subscribe({
        next: (url) => {
          objectUrl = url;
          this.src.set(url);
        },
        error: () => this.failed.set(true),
      });
      cleanup(() => {
        this.stop();
        sub.unsubscribe();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      });
    });
    effect((cleanup) => {
      const video = this.video()?.nativeElement;
      if (!video) return;
      const observer = new ResizeObserver(() => this.redraw());
      observer.observe(video);
      cleanup(() => observer.disconnect());
    });
    effect(() => {
      this.frames();
      this.redraw();
    });
  }

  seek(time: number): void {
    const video = this.video()?.nativeElement;
    if (video && Number.isFinite(time))
      video.currentTime = Math.max(0, Math.min(time, video.duration || time));
  }

  protected speed(value: string): void {
    const video = this.video()?.nativeElement;
    if (video) video.playbackRate = Number(value);
  }

  protected start(): void {
    this.stop();
    const video = this.video()?.nativeElement;
    if (!video || video.paused || video.ended) return;
    if (typeof video.requestVideoFrameCallback === 'function') {
      this.videoCallback = video.requestVideoFrameCallback((_, metadata) => {
        this.videoCallback = null;
        this.redraw(metadata.mediaTime);
        this.start();
      });
    } else {
      this.raf = requestAnimationFrame(() => {
        this.raf = null;
        this.redraw();
        this.start();
      });
    }
  }

  protected stop(): void {
    if (this.raf != null) cancelAnimationFrame(this.raf);
    if (this.videoCallback != null)
      this.video()?.nativeElement.cancelVideoFrameCallback(this.videoCallback);
    this.raf = null;
    this.videoCallback = null;
  }

  protected redraw(time?: number): void {
    const video = this.video()?.nativeElement,
      canvas = this.canvas()?.nativeElement;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = video.clientWidth,
      h = video.clientHeight,
      dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!video.videoWidth || !video.videoHeight || this.failed()) return;
    const scale = Math.min(w / video.videoWidth, h / video.videoHeight);
    const width = video.videoWidth * scale,
      height = video.videoHeight * scale;
    const index = frameAtTime(this.frames(), time ?? video.currentTime, this.result().video.fps);
    drawPose(
      ctx,
      this.result(),
      this.frames(),
      index,
      { skeleton: this.skeleton(), angles: this.angles(), trail: this.trail() },
      width,
      height,
      (w - width) / 2,
      (h - height) / 2,
    );
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
