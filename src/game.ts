import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as C from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
  readonly theta: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly obstacleClock: number;
  readonly obstacleClockRunning: boolean;
  readonly simTime: number;
  readonly muted: boolean;
  readonly menuPress?: { readonly id: number; readonly index: number } | null;
}
export type CaromSnapshot = Omit<CaromState, "ball" | "menuPress"> & {
  readonly version: number;
  readonly ball: (BallState & { readonly speed: number }) | null;
};
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface CaromDebugApi {
  readonly version: number;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, index: number): CaromState;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, side: Side, cy: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, side: Side, vy: number): CaromState;
  setPaddleDriven(
    s: DeepReadonly<CaromState>,
    side: Side,
    driven: boolean,
  ): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    vx: number,
    vy: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, spin: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, held: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, seconds: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, sign: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, muted: boolean): CaromState;
  setObstacleClock(s: DeepReadonly<CaromState>, t: number): CaromState;
  setObstacleClockRunning(
    s: DeepReadonly<CaromState>,
    running: boolean,
  ): CaromState;
  snapshot(s: DeepReadonly<CaromState>): CaromSnapshot;
  menuItemRect(s: DeepReadonly<CaromState>, index: number): Rect | null;
}
export const BACKGROUND = "#090f1f";
const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));
const signDraw = (): 1 | -1 => (Math.random() < 0.5 ? 1 : -1);
const park = (): BallState => ({
  x: C.FIELD_CX,
  y: C.FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: C.HOLD_TIME,
  serveSign: signDraw(),
  trail: [],
});
const pose = (index: number, t: number): ObstacleState => {
  const base = C.OBSTACLE_CENTERS[index];
  if (!base) throw new RangeError(`No obstacle ${index}`);
  return {
    index,
    cx: base.x,
    cy:
      base.y +
      (index === 0 ? 1 : -1) *
        C.OBSTACLE_SWAY_AMP *
        Math.sin((2 * Math.PI * t) / C.OBSTACLE_SWAY_PERIOD),
    theta: C.OBSTACLE_SPIN_RATE * t,
  };
};
const initial = (muted = false): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: 0,
  titleIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: {
    left: { cy: C.FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    right: { cy: C.FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
  },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: park(),
  obstacles: [pose(0, 0), pose(1, 0)],
  obstacleClock: 0,
  obstacleClockRunning: true,
  simTime: 0,
  muted,
  menuPress: null,
});
const copy = (s: DeepReadonly<CaromState>): CaromState => ({
  ...s,
  paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
  score: { ...s.score },
  ai: { ...s.ai },
  ball: s.ball
    ? { ...s.ball, trail: s.ball.trail.map((v) => ({ ...v })) }
    : null,
  obstacles: s.obstacles.map((v) => ({ ...v })),
});
const withBall = (
  s: DeepReadonly<CaromState>,
  fn: (b: DeepReadonly<BallState>) => BallState,
): CaromState => {
  if (!s.ball) throw new Error("No ball");
  return { ...copy(s), ball: fn(s.ball) };
};
const withPaddle = (
  s: DeepReadonly<CaromState>,
  side: Side,
  fn: (p: DeepReadonly<PaddleState>) => PaddleState,
): CaromState => ({
  ...copy(s),
  paddles: { ...copy(s).paddles, [side]: fn(s.paddles[side]) },
});
const menuLength = (screen: Screen): number =>
  screen === "title"
    ? C.TITLE_ITEMS.length
    : screen === "paused"
      ? C.PAUSE_ITEMS.length
      : screen === "matchover"
        ? C.MATCHOVER_ITEMS.length
        : screen === "howto"
          ? 1
          : 0;
const menuRect = (screen: Screen, index: number): Rect | null => {
  const n = menuLength(screen);
  if (index < 0 || index >= n) return null;
  const start =
    screen === "title"
      ? 400
      : screen === "howto"
        ? 575
        : screen === "paused"
          ? 390
          : 460;
  return { x: C.FIELD_CX - 175, y: start + index * 62, w: 350, h: 52 };
};
const itemAt = (screen: Screen, x: number, y: number): number => {
  for (let i = 0; i < menuLength(screen); i++) {
    const r = menuRect(screen, i)!;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
};
const startMatch = (s: DeepReadonly<CaromState>, mode: Mode): CaromState => ({
  ...copy(s),
  screen: "countdown",
  mode,
  resumeScreen: "playing",
  menuIndex: 0,
  score: { p1: 0, p2: 0 },
  winner: null,
  receiver: "left",
  ball: park(),
  paddles: {
    left: { ...s.paddles.left, cy: C.FIELD_CY, vy: 0 },
    right: { ...s.paddles.right, cy: C.FIELD_CY, vy: 0 },
  },
  obstacleClock: 0,
  obstacleClockRunning: true,
  obstacles: [pose(0, 0), pose(1, 0)],
  menuPress: null,
});
const title = (s: DeepReadonly<CaromState>): CaromState => ({
  ...initial(s.muted),
  titleIndex: s.titleIndex,
  menuIndex: s.titleIndex,
  simTime: s.simTime,
});
const integrate = (
  p: DeepReadonly<PaddleState>,
  vy: number,
  dt: number,
): PaddleState => {
  const cy = clamp(p.cy + vy * dt, C.PADDLE_MIN_CY, C.PADDLE_MAX_CY);
  return {
    ...p,
    cy,
    vy: dt > 0 && cy !== p.cy + vy * dt ? (cy - p.cy) / dt : vy,
  };
};
function movePaddles(
  s: DeepReadonly<CaromState>,
  api: UpdateApi,
  dt: number,
): CaromState {
  const left = s.paddles.left;
  const right = s.paddles.right;
  const lv = left.driven
    ? left.drivenVy
    : ((api.input.value("p1-down") > 0 ||
      (s.mode === "solo" && api.input.value("p2-down") > 0)
        ? 1
        : 0) -
        (api.input.value("p1-up") > 0 ||
        (s.mode === "solo" && api.input.value("p2-up") > 0)
          ? 1
          : 0)) *
      C.PADDLE_SPEED;
  let rv = 0;
  if (right.driven) rv = right.drivenVy;
  else if (s.mode === "versus")
    rv =
      (api.input.value("p2-down") - api.input.value("p2-up")) * C.PADDLE_SPEED;
  else if (s.ai.movement) {
    let target = C.AI_HOME_Y,
      zone = C.AI_HOME_DEADZONE;
    if (s.ai.tracking && s.screen === "playing" && s.ball && s.ball.vx > 0) {
      target = s.ball.y - s.ball.vy * C.AI_REACT;
      zone = C.AI_DEADZONE;
    }
    const diff = target - right.cy;
    if (Math.abs(diff) > zone)
      rv =
        Math.sign(diff) *
        Math.min(C.AI_SPEED, dt > 0 ? Math.abs(diff) / dt : 0);
  }
  return {
    ...copy(s),
    paddles: { left: integrate(left, lv, dt), right: integrate(right, rv, dt) },
  };
}
type Events = { paddle: boolean; wall: boolean; obstacle: boolean };
function paddleCollision(
  b: BallState,
  p: DeepReadonly<PaddleState>,
  x0: number,
  x1: number,
  side: Side,
  e: Events,
): BallState {
  const y0 = p.cy - C.PADDLE_HALF,
    y1 = p.cy + C.PADDLE_HALF;
  if (!(
    b.x > x0 - C.BALL_R &&
    b.x < x1 + C.BALL_R &&
    b.y > y0 - C.BALL_R &&
    b.y < y1 + C.BALL_R
  ))
    return b;
  const depths = [
    b.x - (x0 - C.BALL_R),
    x1 + C.BALL_R - b.x,
    b.y - (y0 - C.BALL_R),
    y1 + C.BALL_R - b.y,
  ];
  let face = 0;
  for (let i = 1; i < 4; i++) if (depths[i] < depths[face]) face = i;
  if (face < 2) {
    const dir = side === "left" ? 1 : -1;
    const speed = Math.min(Math.hypot(b.vx, b.vy) * C.SPEED_MULT, C.SPEED_CAP);
    const theta =
      clamp((b.y - p.cy) / C.PADDLE_HALF, -1, 1) * C.MAX_BOUNCE_ANGLE;
    e.paddle = true;
    return {
      ...b,
      x: side === "left" ? C.P1_X1 + C.BALL_R : C.P2_X0 - C.BALL_R,
      vx: dir * speed * Math.cos(theta),
      vy: speed * Math.sin(theta),
      spin: clamp(
        b.spin + p.vy * C.SPIN_FROM_PADDLE,
        -C.SPIN_CLAMP,
        C.SPIN_CLAMP,
      ),
    };
  }
  const into = face === 2 ? b.vy > 0 : b.vy < 0;
  if (into) e.wall = true;
  return {
    ...b,
    y: face === 2 ? y0 - C.BALL_R : y1 + C.BALL_R,
    vy: into ? -b.vy : b.vy,
  };
}
function obstacleCollision(
  b: BallState,
  o: DeepReadonly<ObstacleState>,
  e: Events,
): BallState {
  const co = Math.cos(o.theta),
    si = Math.sin(o.theta),
    dx = b.x - o.cx,
    dy = b.y - o.cy;
  let lx = dx * co + dy * si,
    ly = -dx * si + dy * co;
  const qx = clamp(lx, -C.OBSTACLE_HW, C.OBSTACLE_HW),
    qy = clamp(ly, -C.OBSTACLE_HH, C.OBSTACLE_HH);
  const ex = lx - qx,
    ey = ly - qy,
    dist = Math.hypot(ex, ey);
  if (dist >= C.BALL_R) return b;
  let nx: number, ny: number, push: number;
  if (dist > 1e-9) {
    nx = ex / dist;
    ny = ey / dist;
    push = C.BALL_R - dist;
  } else {
    const depths = [
      lx + C.OBSTACLE_HW,
      C.OBSTACLE_HW - lx,
      ly + C.OBSTACLE_HH,
      C.OBSTACLE_HH - ly,
    ];
    let face = 0;
    for (let i = 1; i < 4; i++) if (depths[i] < depths[face]) face = i;
    nx = face === 0 ? -1 : face === 1 ? 1 : 0;
    ny = face === 2 ? -1 : face === 3 ? 1 : 0;
    push = C.BALL_R + depths[face];
  }
  lx += nx * push;
  ly += ny * push;
  const wx = nx * co - ny * si,
    wy = nx * si + ny * co,
    dot = b.vx * wx + b.vy * wy;
  if (dot < 0) e.obstacle = true;
  return {
    ...b,
    x: o.cx + lx * co - ly * si,
    y: o.cy + lx * si + ly * co,
    vx: dot < 0 ? b.vx - 2 * dot * wx : b.vx,
    vy: dot < 0 ? b.vy - 2 * dot * wy : b.vy,
  };
}
function fly(
  ball: DeepReadonly<BallState>,
  s: DeepReadonly<CaromState>,
  dt: number,
  e: Events,
): BallState {
  let b: BallState = { ...ball, trail: [...ball.trail] };
  const speed = Math.hypot(b.vx, b.vy),
    n = Math.max(1, Math.ceil((speed * dt) / C.MAX_SUBSTEP)),
    h = dt / n;
  for (let i = 0; i < n; i++) {
    const mag = Math.hypot(b.vx, b.vy);
    if (mag > 0) {
      const a = (b.spin / mag) * h,
        co = Math.cos(a),
        si = Math.sin(a);
      b = { ...b, vx: b.vx * co - b.vy * si, vy: b.vx * si + b.vy * co };
    }
    b = {
      ...b,
      spin: b.spin * Math.pow(0.5, h / C.SPIN_HALFLIFE),
      x: b.x + b.vx * h,
      y: b.y + b.vy * h,
    };
    if (b.y - C.BALL_R < 0 && b.vy < 0) {
      b = { ...b, y: C.BALL_R, vy: -b.vy };
      e.wall = true;
    } else if (b.y + C.BALL_R > C.FIELD_H && b.vy > 0) {
      b = { ...b, y: C.FIELD_H - C.BALL_R, vy: -b.vy };
      e.wall = true;
    }
    b = paddleCollision(b, s.paddles.left, C.P1_X0, C.P1_X1, "left", e);
    b = paddleCollision(b, s.paddles.right, C.P2_X0, C.P2_X1, "right", e);
    for (const o of s.obstacles) b = obstacleCollision(b, o, e);
  }
  return b;
}
function confirm(s: DeepReadonly<CaromState>): CaromState {
  if (s.screen === "title") {
    const base = { ...copy(s), titleIndex: s.menuIndex };
    return s.menuIndex === 0
      ? startMatch(base, "solo")
      : s.menuIndex === 1
        ? startMatch(base, "versus")
        : { ...base, screen: "howto", menuIndex: 0 };
  }
  if (s.screen === "howto") return title(s);
  if (s.screen === "paused")
    return s.menuIndex === 0
      ? { ...copy(s), screen: s.resumeScreen }
      : s.menuIndex === 1
        ? startMatch(s, s.mode)
        : title(s);
  if (s.screen === "matchover")
    return s.menuIndex === 0 ? startMatch(s, s.mode) : title(s);
  return copy(s);
}
function readMenu(s: DeepReadonly<CaromState>, api: UpdateApi): CaromState {
  let next = copy(s);
  const screen = s.screen;
  const up = api.input.pressed("p1-up") || api.input.pressed("p2-up");
  const down = api.input.pressed("p1-down") || api.input.pressed("p2-down");
  const keyboardConfirm = api.input.pressed("confirm");
  const back = api.input.pressed("back");
  const pause = api.input.pressed("pause");
  if (screen === "paused" && (pause || back))
    return { ...next, screen: s.resumeScreen, menuPress: null };
  if (screen === "howto" && (keyboardConfirm || back)) return title(next);
  if (screen === "matchover" && back) return title(next);
  if (up)
    next = {
      ...next,
      menuIndex: (next.menuIndex + menuLength(screen) - 1) % menuLength(screen),
    };
  else if (down)
    next = { ...next, menuIndex: (next.menuIndex + 1) % menuLength(screen) };
  if (!up && !down && keyboardConfirm) return confirm(next);
  let pointerConfirm = false;
  let press = next.menuPress ?? null;
  for (const sample of api.input.pointerSamples()) {
    const index = itemAt(screen, sample.x, sample.y);
    if (index >= 0) next = { ...next, menuIndex: index };
    if (sample.type === "down" && sample.button === "primary")
      press = index >= 0 ? { id: sample.id, index } : null;
    if (sample.type === "up" && sample.button === "primary") {
      if (press && press.id === sample.id && press.index === index) {
        next = { ...next, menuIndex: index };
        pointerConfirm = true;
      }
      press = null;
    }
  }
  const pointer = api.input.pointer();
  const hover = itemAt(screen, pointer.x, pointer.y);
  if (hover >= 0) next = { ...next, menuIndex: hover };
  next = { ...next, menuPress: press };
  return pointerConfirm ? confirm(next) : next;
}
function advance(
  s: DeepReadonly<CaromState>,
  api: UpdateApi,
  dt: number,
): CaromState {
  let next = movePaddles(s, api, dt),
    ball = next.ball;
  if (ball) {
    if (s.screen === "countdown" && ball.held) {
      const holdTimer = ball.holdTimer - dt;
      if (holdTimer <= 0) {
        const dir = s.receiver === "left" ? -1 : 1;
        ball = {
          ...ball,
          held: false,
          holdTimer: 0,
          vx: dir * C.SERVE_SPEED * Math.cos(C.SERVE_ANGLE),
          vy: ball.serveSign * C.SERVE_SPEED * Math.sin(C.SERVE_ANGLE),
          trail: [],
        };
        next = { ...next, screen: "playing" };
      } else ball = { ...ball, holdTimer };
    } else if (s.screen === "playing" && !ball.held) {
      const e: Events = { paddle: false, wall: false, obstacle: false };
      ball = fly(ball, next, dt, e);
      if (e.paddle) api.audio.play(C.CUES.paddleHit);
      if (e.wall) api.audio.play(C.CUES.wallBounce);
      if (e.obstacle) api.audio.play(C.CUES.obstacleBounce);
    }
    const trail = [
      ...ball.trail,
      { x: ball.x, y: ball.y, t: next.simTime },
    ].filter((v) => v.t >= next.simTime - C.TRAIL_TIME);
    ball = { ...ball, trail };
    next = { ...next, ball };
    if (
      s.screen === "playing" &&
      (ball.x - C.BALL_R > C.FIELD_W || ball.x + C.BALL_R < 0)
    ) {
      const scorer: Side = ball.x > C.FIELD_CX ? "left" : "right";
      const score = {
        p1: next.score.p1 + (scorer === "left" ? 1 : 0),
        p2: next.score.p2 + (scorer === "right" ? 1 : 0),
      };
      api.audio.play(C.CUES.score);
      const won =
        scorer === "left"
          ? score.p1 >= C.WIN_SCORE && score.p1 - score.p2 >= C.WIN_LEAD
          : score.p2 >= C.WIN_SCORE && score.p2 - score.p1 >= C.WIN_LEAD;
      next = {
        ...next,
        score,
        receiver: scorer === "left" ? "right" : "left",
        winner: won ? scorer : null,
        screen: won ? "matchover" : "countdown",
        menuIndex: won ? 0 : next.menuIndex,
        ball: won ? ball : park(),
      };
    }
  }
  if (next.obstacleClockRunning) {
    const t = next.obstacleClock + dt;
    next = {
      ...next,
      obstacleClock: t,
      obstacles: next.obstacles.map((o) => pose(o.index, t)),
    };
  }
  return next;
}
const panel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void => {
  ctx.fillStyle = "rgba(11,20,39,.92)";
  ctx.strokeStyle = "#31536b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.fill();
  ctx.stroke();
};
const label = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "center",
  weight = "600",
): void => {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
};
function renderField(
  s: DeepReadonly<CaromState>,
  ctx: CanvasRenderingContext2D,
): void {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
  const glow = ctx.createRadialGradient(
    C.FIELD_CX,
    C.FIELD_CY,
    80,
    C.FIELD_CX,
    C.FIELD_CY,
    740,
  );
  glow.addColorStop(0, "#172640");
  glow.addColorStop(1, BACKGROUND);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
  ctx.strokeStyle = "#26425a";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, C.FIELD_W - 40, C.FIELD_H - 40);
  ctx.setLineDash([13, 15]);
  ctx.beginPath();
  ctx.moveTo(C.NET_X, 30);
  ctx.lineTo(C.NET_X, C.FIELD_H - 30);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const o of s.obstacles) {
    ctx.save();
    ctx.translate(o.cx, o.cy);
    ctx.rotate(o.theta);
    ctx.shadowBlur = 24;
    ctx.shadowColor = "#fdbb61";
    ctx.fillStyle = "#f2a74d";
    ctx.beginPath();
    ctx.roundRect(
      -C.OBSTACLE_HW,
      -C.OBSTACLE_HH,
      C.OBSTACLE_W,
      C.OBSTACLE_H,
      10,
    );
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffe0a8";
    ctx.fillRect(-2, -C.OBSTACLE_HH + 12, 4, C.OBSTACLE_H - 24);
    ctx.restore();
  }
  const paddles: [Side, number, string][] = [
    ["left", C.P1_X0, "#62e5e0"],
    ["right", C.P2_X0, "#ef76ad"],
  ];
  for (const [side, x, color] of paddles) {
    const p = s.paddles[side];
    ctx.shadowBlur = 24;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, p.cy - C.PADDLE_HALF, C.PADDLE_W, C.PADDLE_H, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  if (s.ball) {
    const b = s.ball;
    if (b.trail.length > 1) {
      ctx.lineCap = "round";
      for (let i = 1; i < b.trail.length; i++) {
        const a = b.trail[i - 1],
          z = b.trail[i],
          alpha = (z.t - (s.simTime - C.TRAIL_TIME)) / C.TRAIL_TIME;
        ctx.strokeStyle = `rgba(255,239,194,${clamp(alpha * 0.7, 0, 0.7)})`;
        ctx.lineWidth = 3 + alpha * 11;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(z.x, z.y);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#fff0bb";
    ctx.fillStyle = "#fff3d2";
    ctx.beginPath();
    ctx.arc(b.x, b.y, C.BALL_R, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
function drawMenu(
  ctx: CanvasRenderingContext2D,
  screen: Screen,
  selected: number,
  items: readonly string[],
): void {
  for (let i = 0; i < items.length; i++) {
    const r = menuRect(screen, i)!;
    ctx.fillStyle = i === selected ? "#f6d28a" : "#15273e";
    ctx.strokeStyle = i === selected ? "#fff0bd" : "#45617b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.stroke();
    label(
      ctx,
      items[i],
      C.FIELD_CX,
      r.y + 35,
      20,
      i === selected ? "#172133" : "#d4e8ed",
    );
  }
}
function render(s: DeepReadonly<CaromState>, api: RenderApi): void {
  const ctx = api.ctx;
  renderField(s, ctx);
  if (
    s.screen === "playing" ||
    s.screen === "countdown" ||
    s.screen === "paused" ||
    s.screen === "matchover"
  ) {
    label(ctx, String(s.score.p1), C.FIELD_CX - 130, 94, 66, "#62e5e0");
    label(ctx, String(s.score.p2), C.FIELD_CX + 130, 94, 66, "#ef76ad");
    label(
      ctx,
      s.mode === "solo" ? "SOLO • VS AI" : "VERSUS • LOCAL",
      C.FIELD_CX,
      115,
      14,
      "#b4cad4",
    );
    if (s.screen === "countdown")
      label(
        ctx,
        "SERVE IN " + Math.max(0, Math.ceil(s.ball?.holdTimer ?? 0)),
        C.FIELD_CX,
        205,
        24,
        "#f6d28a",
      );
  }
  if (s.screen === "title") {
    ctx.fillStyle = "rgba(6,12,27,.72)";
    ctx.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
    label(ctx, "C A R O M", C.FIELD_CX, 225, 96, "#f7e5bb", "center", "800");
    label(ctx, "SPIN THE SHOT. OWN THE ANGLE.", C.FIELD_CX, 280, 20, "#82deda");
    drawMenu(ctx, "title", s.menuIndex, C.TITLE_ITEMS);
    label(
      ctx,
      "W / S  OR  ↑ / ↓ TO SELECT     •     ENTER TO CONFIRM",
      C.FIELD_CX,
      654,
      15,
      "#8aa7bc",
    );
  }
  if (s.screen === "howto") {
    panel(ctx, 230, 85, 820, 565);
    label(ctx, "HOW TO PLAY", C.FIELD_CX, 154, 48, "#f7e5bb");
    label(ctx, "FIRST TO 11 • WIN BY 2", C.FIELD_CX, 207, 19, "#82deda");
    label(
      ctx,
      "SOLO: W / S or ↑ / ↓ moves your paddle",
      C.FIELD_CX,
      274,
      22,
      "#e6eff1",
    );
    label(
      ctx,
      "VERSUS: W / S left, ↑ / ↓ right",
      C.FIELD_CX,
      318,
      22,
      "#e6eff1",
    );
    label(
      ctx,
      "Move at impact to put spin on the ball.",
      C.FIELD_CX,
      384,
      22,
      "#e6eff1",
    );
    label(
      ctx,
      "Bank off the turning obstacles to find an opening.",
      C.FIELD_CX,
      428,
      22,
      "#e6eff1",
    );
    label(
      ctx,
      "P or ESC to pause   •   M to mute",
      C.FIELD_CX,
      492,
      19,
      "#92afbd",
    );
    drawMenu(ctx, "howto", s.menuIndex, ["BACK TO MENU"]);
  }
  if (s.screen === "paused") {
    ctx.fillStyle = "rgba(5,11,24,.7)";
    ctx.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
    label(ctx, "PAUSED", C.FIELD_CX, 286, 62, "#f7e5bb");
    drawMenu(ctx, "paused", s.menuIndex, C.PAUSE_ITEMS);
  }
  if (s.screen === "matchover") {
    ctx.fillStyle = "rgba(5,11,24,.76)";
    ctx.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
    label(
      ctx,
      s.winner === "left" ? "PLAYER ONE WINS" : "PLAYER TWO WINS",
      C.FIELD_CX,
      272,
      54,
      "#f7e5bb",
    );
    label(
      ctx,
      `${s.score.p1}  :  ${s.score.p2}`,
      C.FIELD_CX,
      345,
      48,
      "#82deda",
    );
    drawMenu(ctx, "matchover", s.menuIndex, C.MATCHOVER_ITEMS);
  }
  label(
    ctx,
    s.muted ? "SOUND OFF  •  M TO UNMUTE" : "M TO MUTE",
    C.FIELD_W - 30,
    C.FIELD_H - 25,
    12,
    "#708da1",
    "right",
  );
}
export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>) {
    for (const name of C.ACTIONS)
      api.input.register(name, { keys: [...C.BINDINGS[name]] });
    api.audio.define(C.CUES.paddleHit, {
      wave: "triangle",
      freq: 330,
      freqTo: 580,
      durationMs: 85,
      gain: 0.18,
    });
    api.audio.define(C.CUES.wallBounce, {
      wave: "sine",
      freq: 240,
      freqTo: 180,
      durationMs: 65,
      gain: 0.13,
    });
    api.audio.define(C.CUES.obstacleBounce, {
      wave: "square",
      freq: 540,
      freqTo: 260,
      durationMs: 85,
      gain: 0.09,
    });
    api.audio.define(C.CUES.score, {
      wave: "triangle",
      freq: 740,
      freqTo: 380,
      durationMs: 230,
      gain: 0.17,
    });
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("mode", (s) => s.mode);
    api.diagnostics.register("score", (s) => `${s.score.p1} : ${s.score.p2}`);
    api.diagnostics.register("ball", (s) =>
      s.ball
        ? `${s.ball.x.toFixed(1)}, ${s.ball.y.toFixed(1)} | ${s.ball.vx.toFixed(1)}, ${s.ball.vy.toFixed(1)} | ${Math.hypot(s.ball.vx, s.ball.vy).toFixed(1)} | spin ${s.ball.spin.toFixed(1)}`
        : "absent",
    );
    api.diagnostics.register(
      "left",
      (s) =>
        `${s.paddles.left.cy.toFixed(1)} | ${s.paddles.left.vy.toFixed(1)}`,
    );
    api.diagnostics.register(
      "right",
      (s) =>
        `${s.paddles.right.cy.toFixed(1)} | ${s.paddles.right.vy.toFixed(1)}`,
    );
    const debug: CaromDebugApi = {
      version: C.CAROM_DEBUG_VERSION,
      clearWorld: (s) => ({ ...copy(s), ball: null, obstacles: [] }),
      spawnBall: (s) => ({ ...copy(s), ball: park() }),
      spawnObstacle: (s, index) => ({
        ...copy(s),
        obstacles: [
          ...s.obstacles
            .filter((o) => o.index !== index)
            .map((o) => ({ ...o })),
          pose(index, s.obstacleClock),
        ].sort((a, b) => a.index - b.index),
      }),
      reset: (s) => initial(s.muted),
      reconcile: (s) => ({
        ...copy(s),
        obstacles: s.obstacles.map((o) => pose(o.index, s.obstacleClock)),
      }),
      setScreen: (s, v) => ({ ...copy(s), screen: v }),
      setMode: (s, v) => ({ ...copy(s), mode: v }),
      setMenuIndex: (s, v) => ({ ...copy(s), menuIndex: v }),
      setTitleIndex: (s, v) => ({ ...copy(s), titleIndex: v }),
      setResumeScreen: (s, v) => ({ ...copy(s), resumeScreen: v }),
      setScore: (s, p1, p2) => ({ ...copy(s), score: { p1, p2 } }),
      setWinner: (s, v) => ({ ...copy(s), winner: v }),
      setReceiver: (s, v) => ({ ...copy(s), receiver: v }),
      setPaddleCy: (s, side, cy) => withPaddle(s, side, (p) => ({ ...p, cy })),
      setPaddleVy: (s, side, drivenVy) =>
        withPaddle(s, side, (p) => ({ ...p, drivenVy })),
      setPaddleDriven: (s, side, driven) =>
        withPaddle(s, side, (p) => ({ ...p, driven })),
      setBallPosition: (s, x, y) => withBall(s, (b) => ({ ...b, x, y })),
      setBallVelocity: (s, vx, vy) => withBall(s, (b) => ({ ...b, vx, vy })),
      setBallSpin: (s, spin) => withBall(s, (b) => ({ ...b, spin })),
      setBallHeld: (s, held) => withBall(s, (b) => ({ ...b, held })),
      setBallHoldTimer: (s, holdTimer) =>
        withBall(s, (b) => ({ ...b, holdTimer })),
      setBallServeSign: (s, serveSign) =>
        withBall(s, (b) => ({ ...b, serveSign })),
      drawBallServeSign: (s) =>
        withBall(s, (b) => ({ ...b, serveSign: signDraw() })),
      setAiTracking: (s, tracking) => ({
        ...copy(s),
        ai: { ...s.ai, tracking },
      }),
      setAiMovement: (s, movement) => ({
        ...copy(s),
        ai: { ...s.ai, movement },
      }),
      setMuted: (s, muted) => ({ ...copy(s), muted }),
      setObstacleClock: (s, obstacleClock) => ({
        ...copy(s),
        obstacleClock,
        obstacles: s.obstacles.map((o) => pose(o.index, obstacleClock)),
      }),
      setObstacleClockRunning: (s, obstacleClockRunning) => ({
        ...copy(s),
        obstacleClockRunning,
      }),
      snapshot: (s) => {
        const { menuPress, ...declared } = copy(s);
        void menuPress;
        return {
          ...declared,
          version: C.CAROM_DEBUG_VERSION,
          ball: s.ball
            ? {
                ...s.ball,
                speed: Math.hypot(s.ball.vx, s.ball.vy),
                trail: s.ball.trail.map((v) => ({ ...v })),
              }
            : null,
          obstacles: s.obstacles.map((o) => pose(o.index, s.obstacleClock)),
        };
      },
      menuItemRect: (s, index) => menuRect(s.screen, index),
    };
    return [initial(), debug];
  },
  update(state, api, dt) {
    let next: CaromState = { ...copy(state), simTime: state.simTime + dt };
    if (api.input.pressed("mute")) api.audio.setMuted(!next.muted);
    else if (next.muted !== api.audio.muted()) api.audio.setMuted(next.muted);
    next = { ...next, muted: api.audio.muted() };
    if (
      state.screen === "title" ||
      state.screen === "howto" ||
      state.screen === "paused" ||
      state.screen === "matchover"
    )
      next = readMenu(next, api);
    else if (api.input.pressed("pause"))
      next = {
        ...next,
        screen: "paused",
        resumeScreen: state.screen,
        menuIndex: 0,
        menuPress: null,
      };
    if (next.screen === "playing" || next.screen === "countdown")
      next = advance(next, api, dt);
    return next;
  },
  render,
};
