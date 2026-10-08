import { AnalysisResult, PoseFrame } from '../../core/models';
import { drawPose, frameAtTime } from './pose-overlay';

describe('pose video synchronization', () => {
  const frames: PoseFrame[] = [0, 0.04, 0.08].map((t, i) => ({
    t,
    i,
    ok: true,
    p: null,
    angle: 20,
  }));
  it('finds the closest pose before and after seeking', () => {
    expect(frameAtTime(frames, 0.03, 25)).toBe(1);
    expect(frameAtTime(frames, 0.075, 25)).toBe(2);
    expect(frameAtTime(frames, 0, 25)).toBe(0);
  });
  it('does not show stale skeletons or invent poses for an empty recording', () => {
    expect(frameAtTime(frames, 2, 25)).toBe(-1);
    expect(frameAtTime([], 0, 25)).toBe(-1);
  });
  it('draws available landmarks and skips missing joints safely', () => {
    const ctx = document.createElement('canvas').getContext('2d')!;
    const result = {
      landmark_names: ['left_shoulder', 'left_elbow', 'left_wrist', 'left_hip'],
      config: { arm: 'left' },
      rule: { angle_name: 'left_shoulder_angle', unit: 'grados', t: 26, band: 4, direction: '<' },
    } as AnalysisResult;
    const pose: PoseFrame = {
      i: 0,
      t: 0,
      ok: true,
      p: [[0.5, 0.3], null, [0.5, 0.6], [0.5, 0.7]],
      angle: 20,
    };
    expect(() =>
      drawPose(ctx, result, [pose], 0, { skeleton: true, angles: true, trail: true }, 300, 200),
    ).not.toThrow();
    const labels = spyOn(ctx, 'fillText');
    pose.p![1] = [0.55, 0.45];
    drawPose(ctx, result, [pose], 0, { skeleton: true, angles: true, trail: true }, 300, 200);
    expect(labels).toHaveBeenCalledWith('Hombro 20°', jasmine.any(Number), jasmine.any(Number));
  });
});
