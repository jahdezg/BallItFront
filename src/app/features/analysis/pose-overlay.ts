import { AnalysisResult, PoseFrame } from '../../core/models';

export interface OverlayOptions {
  skeleton: boolean;
  angles: boolean;
  trail: boolean;
}

/** Sorted timestamps allow a binary search even for long recordings. Reject stale poses. */
export function frameAtTime(frames: PoseFrame[], time: number, fps: number): number {
  if (!frames.length) return -1;
  let low = 0,
    high = frames.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (frames[mid].t < time) low = mid + 1;
    else high = mid;
  }
  const index =
    low > 0 && Math.abs(frames[low - 1].t - time) < Math.abs(frames[low].t - time) ? low - 1 : low;
  return Math.abs(frames[index].t - time) <= Math.max(0.12, 2 / Math.max(1, fps)) ? index : -1;
}

export function drawPose(
  ctx: CanvasRenderingContext2D,
  result: AnalysisResult,
  frames: PoseFrame[],
  index: number,
  options: OverlayOptions,
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
): void {
  const frame = frames[index];
  if (!frame?.ok || !frame.p) return;
  const names = result.landmark_names;
  const point = (pose: PoseFrame, name: string): [number, number] | null => {
    const p = pose.ok ? pose.p?.[names.indexOf(name)] : null;
    return p && p.every(Number.isFinite) ? [offsetX + p[0] * width, offsetY + p[1] * height] : null;
  };
  const side = result.config.arm;
  const accent = '#f97316';
  const line = (a: [number, number], b: [number, number], color: string, stroke = 2) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = stroke;
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
  };
  if (options.trail) {
    for (let i = Math.max(1, index - 8); i <= index; i++) {
      if (frames[i].t - frames[i - 1].t > 0.15) continue;
      const a = point(frames[i - 1], `${side}_wrist`),
        b = point(frames[i], `${side}_wrist`);
      if (a && b) line(a, b, `rgba(249,115,22,${0.6 * (1 - (index - i) / 9)})`, 3);
    }
  }
  if (options.skeleton) {
    const connections: [string, string][] = [
      ['left_shoulder', 'right_shoulder'],
      ['left_hip', 'right_hip'],
    ];
    for (const arm of ['left', 'right']) {
      for (const [a, b] of [
        ['shoulder', 'elbow'],
        ['elbow', 'wrist'],
        ['shoulder', 'hip'],
        ['hip', 'knee'],
        ['knee', 'ankle'],
      ]) {
        connections.push([`${arm}_${a}`, `${arm}_${b}`]);
      }
    }
    for (const [a, b] of connections) {
      const p = point(frame, a),
        q = point(frame, b);
      const highlighted =
        a === `${side}_elbow` || (a === `${side}_shoulder` && b === `${side}_elbow`);
      if (p && q) line(p, q, highlighted ? accent : 'rgba(220,225,235,.75)', highlighted ? 4 : 2);
    }
    for (const name of names) {
      const p = point(frame, name);
      if (!p) continue;
      const highlighted = ['shoulder', 'elbow', 'wrist'].some((part) => name === `${side}_${part}`);
      ctx.beginPath();
      ctx.arc(...p, highlighted ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = highlighted ? accent : '#dce1eb';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  if (!options.angles || frame.angle == null || !Number.isFinite(frame.angle)) return;
  // The backend specifies the joint being measured; shoulder abduction is not elbow flexion.
  const joint = result.rule.angle_name.includes('elbow') ? 'elbow' : 'shoulder';
  const origin = point(frame, `${side}_${joint}`);
  const reference = point(frame, `${side}_${joint === 'shoulder' ? 'hip' : 'shoulder'}`);
  const target = point(frame, `${side}_${joint === 'shoulder' ? 'elbow' : 'wrist'}`);
  if (!origin || !reference || !target) return;
  const { t, band, direction } = result.rule;
  const margin = direction === '<' ? t - frame.angle : frame.angle - t;
  const angularRule = ['grados', 'deg', '°'].includes(result.rule.unit);
  const color = !angularRule
    ? accent
    : margin > band
      ? '#22c55e'
      : margin >= -band
        ? '#eab308'
        : '#ef4444';
  const start = Math.atan2(reference[1] - origin[1], reference[0] - origin[0]);
  const end = Math.atan2(target[1] - origin[1], target[0] - origin[0]);
  const delta = Math.atan2(Math.sin(end - start), Math.cos(end - start));
  const radius = Math.max(18, Math.min(32, width * 0.06));
  ctx.beginPath();
  ctx.arc(...origin, radius, start, start + delta, delta < 0);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  const label = `${joint === 'shoulder' ? 'Hombro' : 'Codo'} ${Math.round(frame.angle)}°`;
  ctx.font = 'bold 13px system-ui';
  const labelWidth = ctx.measureText(label).width + 14;
  const x = Math.max(offsetX, Math.min(offsetX + width - labelWidth, origin[0] + radius + 6));
  const y = Math.max(offsetY + 24, Math.min(offsetY + height, origin[1] - 8));
  ctx.fillStyle = 'rgba(0,0,0,.75)';
  ctx.fillRect(x, y - 22, labelWidth, 26);
  ctx.fillStyle = color;
  ctx.fillText(label, x + 7, y - 4);
}
