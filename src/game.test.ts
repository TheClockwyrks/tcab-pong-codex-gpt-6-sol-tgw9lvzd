import { createCanvas } from "@napi-rs/canvas";
import { ConstantClock, createEngine } from "@clockwyrks/simple-2d";
import { describe, expect, it } from "vitest";
import {
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  PADDLE_SPEED,
  SERVE_SPEED,
  WIN_SCORE,
} from "./constants";
import { game } from "./game";

function setup(step = 10) {
  const canvas = createCanvas(FIELD_W, FIELD_H);
  const events = new EventTarget();
  const engine = createEngine({
    canvas: canvas as unknown as HTMLCanvasElement,
    width: FIELD_W,
    height: FIELD_H,
    game,
    clock: new ConstantClock(step),
    background: "#090f1f",
    surface: {
      cssWidth: () => FIELD_W,
      cssHeight: () => FIELD_H,
      dpr: () => 1,
      events: () => events,
    },
  });
  return { engine, events };
}
async function ready(step = 10) {
  const v = setup(step);
  await v.engine.initialize();
  return v;
}
const key = (target: EventTarget, code: string, type: "keydown" | "keyup") => {
  const event = new Event(type) as Event & { code: string; repeat: boolean };
  Object.defineProperty(event, "code", { value: code });
  Object.defineProperty(event, "repeat", { value: false });
  target.dispatchEvent(event);
};

describe("Carom simulation", () => {
  it("starts from the title, remembers its selection, and serves toward player one", async () => {
    const { engine, events } = await ready();
    expect(engine.state.screen).toBe("title");
    key(events, "Enter", "keydown");
    await engine.advance(1);
    expect(engine.state.screen).toBe("countdown");
    await engine.advance(100);
    expect(engine.state.screen).toBe("playing");
    expect(engine.state.ball?.held).toBe(false);
    expect(engine.state.ball?.vx).toBeLessThan(0);
    expect(
      Math.hypot(engine.state.ball!.vx, engine.state.ball!.vy),
    ).toBeCloseTo(SERVE_SPEED, 5);
    engine.destroy();
  });
  it("integrates the driven paddle and uses its velocity to spin a paddle hit", async () => {
    const { engine } = await ready();
    const d = engine.debug;
    engine.apply((s) => d.setScreen(s, "playing"));
    engine.apply((s) => d.setPaddleDriven(s, "left", true));
    engine.apply((s) => d.setPaddleVy(s, "left", PADDLE_SPEED));
    engine.apply((s) => d.setBallHeld(s, false));
    engine.apply((s) => d.setBallPosition(s, 90, FIELD_CY + 8));
    engine.apply((s) => d.setBallVelocity(s, -SERVE_SPEED, 0));
    await engine.advance(3);
    expect(engine.state.paddles.left.cy).toBeGreaterThan(FIELD_CY);
    expect(engine.state.ball!.vx).toBeGreaterThan(0);
    expect(engine.state.ball!.spin).toBeGreaterThan(0);
    engine.destroy();
  });
  it("scores a real point and ends a win-by-two match", async () => {
    const { engine } = await ready();
    const d = engine.debug;
    engine.apply((s) => d.setScreen(s, "playing"));
    engine.apply((s) => d.setScore(s, WIN_SCORE - 1, WIN_SCORE - 2));
    engine.apply((s) => d.setBallHeld(s, false));
    engine.apply((s) => d.setBallPosition(s, FIELD_W + 20, 100));
    engine.apply((s) => d.setBallVelocity(s, 100, 0));
    await engine.advance(1);
    expect(engine.state.screen).toBe("matchover");
    expect(engine.state.winner).toBe("left");
    expect(engine.state.score.p1).toBe(WIN_SCORE);
    engine.destroy();
  });
  it("holds the obstacle clock while paused and poses obstacles from the clock", async () => {
    const { engine } = await ready();
    const d = engine.debug;
    engine.apply((s) => d.setObstacleClock(s, 1));
    const before = engine.state.obstacles[0].cy;
    expect(before).not.toBe(220);
    engine.apply((s) => d.setScreen(s, "paused"));
    await engine.advance(20);
    expect(engine.state.obstacleClock).toBe(1);
    expect(engine.state.obstacles[0].cy).toBe(before);
    engine.apply((s) => d.setScreen(s, "countdown"));
    await engine.advance(1);
    expect(engine.state.obstacleClock).toBeGreaterThan(1);
    expect(engine.state.ball!.holdTimer).toBeLessThan(HOLD_TIME);
    engine.destroy();
  });
  it("clears and respawns the world through its debug surface", async () => {
    const { engine } = await ready();
    const d = engine.debug;
    engine.apply((s) => d.clearWorld(s));
    expect(engine.state.ball).toBeNull();
    expect(engine.state.obstacles).toHaveLength(0);
    expect(() => d.setBallSpin(engine.state, 1)).toThrow();
    engine.apply((s) => d.spawnBall(s));
    engine.apply((s) => d.spawnObstacle(s, 1));
    expect(engine.state.ball?.held).toBe(true);
    expect(engine.state.obstacles.map((o) => o.index)).toEqual([1]);
    expect(d.menuItemRect(engine.state, 0)).not.toBeNull();
    engine.destroy();
  });
  it("reflects from a tilted obstacle without changing speed", async () => {
    const { engine } = await ready();
    const d = engine.debug;
    engine.apply((s) => d.clearWorld(s));
    engine.apply((s) => d.spawnBall(s));
    engine.apply((s) => d.spawnObstacle(s, 0));
    engine.apply((s) => d.setObstacleClockRunning(s, false));
    engine.apply((s) => d.setObstacleClock(s, 0.75));
    engine.apply((s) => d.setScreen(s, "playing"));
    engine.apply((s) => d.setBallHeld(s, false));
    const obstacle = engine.state.obstacles[0];
    engine.apply((s) => d.setBallPosition(s, obstacle.cx - 47, obstacle.cy));
    engine.apply((s) => d.setBallVelocity(s, SERVE_SPEED, 0));
    await engine.advance(10);
    expect(Math.abs(engine.state.ball!.vy)).toBeGreaterThan(300);
    expect(
      Math.hypot(engine.state.ball!.vx, engine.state.ball!.vy),
    ).toBeCloseTo(SERVE_SPEED, 3);
    engine.destroy();
  });

  it("lets the AI return home, and stops it when movement is disabled", async () => {
    const { engine } = await ready();
    const d = engine.debug;
    engine.apply((s) => d.setScreen(s, "playing"));
    engine.apply((s) => d.setPaddleCy(s, "right", 600));
    engine.apply((s) => d.setAiTracking(s, false));
    await engine.advance(10);
    expect(engine.state.paddles.right.cy).toBeLessThan(600);
    engine.apply((s) => d.setAiMovement(s, false));
    const stopped = engine.state.paddles.right.cy;
    await engine.advance(10);
    expect(engine.state.paddles.right.cy).toBe(stopped);
    expect(engine.state.paddles.right.vy).toBe(0);
    engine.destroy();
  });
});
