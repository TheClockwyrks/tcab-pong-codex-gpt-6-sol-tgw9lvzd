# Carom

Carom is a browser paddle duel built around curved shots and bank shots. Move your paddle as the ball meets it to add spin, then use the two rotating obstacles to send the return somewhere your opponent cannot reach. Play against the AI or share a keyboard for a local two-player match. The first player to reach 11 points with a two-point lead wins.

## Run

```sh
npm ci
npm run dev
```

Open the address printed by Vite. To build the complete static site, run `npm run build` and serve the resulting `dist/` directory from any static host. Run `npm test` for the simulation suite.

## Controls

- **Solo:** W/S or Up/Down moves the left paddle.
- **Versus:** W/S moves the left paddle; Up/Down moves the right paddle.
- **Menus:** W/S or Up/Down selects; Enter or Space confirms. Mouse and touch also select and confirm items.
- **During play:** P or Escape pauses. M toggles sound. Escape resumes from pause.

On a touch screen, use the engine's on-screen movement controls. The entire game runs locally in the browser; it needs no account or server.
