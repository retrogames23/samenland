/** Small reusable raster surface: never run a CSS filter on the world canvas. */
let surface: HTMLCanvasElement | undefined;
let ink: CanvasRenderingContext2D | null = null;
const LEFT = 24, TOP = 40, WIDTH = 48, HEIGHT = 48;
const PARCHMENT = "#dfcaa0";

export function drawParchment(
  target: CanvasRenderingContext2D, x: number, y: number, scale: number,
  paint: (context: CanvasRenderingContext2D) => void,
) {
  if (!surface) {
    surface = document.createElement("canvas");
    ink = surface.getContext("2d");
  }
  if (!ink) return;
  const resolution = Math.max(1, Math.min(scale, 12));
  const width = Math.ceil(WIDTH * resolution), height = Math.ceil(HEIGHT * resolution);
  if (surface.width !== width || surface.height !== height) {
    surface.width = width; surface.height = height;
  }
  ink.setTransform(1, 0, 0, 1, 0, 0);
  ink.clearRect(0, 0, width, height);
  ink.save();
  ink.setTransform(resolution, 0, 0, resolution, (LEFT - x) * resolution, (TOP - y) * resolution);
  paint(ink);
  ink.restore();
  ink.globalCompositeOperation = "source-in";
  ink.fillStyle = PARCHMENT;
  ink.fillRect(0, 0, width, height);
  ink.globalCompositeOperation = "source-over";
  // Shadow is an inexpensive alpha-mask outline, not a filtered world-sized layer.
  target.save();
  target.shadowColor = "rgba(45,30,18,0.7)";
  target.shadowBlur = 0.6 * resolution;
  target.globalAlpha = 0.42;
  target.drawImage(surface, x - LEFT, y - TOP, width / resolution, height / resolution);
  target.restore();
}