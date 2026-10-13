import { ASPECT_META, PLANET_META } from "@/lib/astro/constants";
import type { SynastryResult } from "@/lib/types";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

export async function createSynastryShareCard(
  nameA: string,
  nameB: string,
  result: SynastryResult,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Este navegador no permite generar la tarjeta.");

  const background = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  background.addColorStop(0, "#1c2943");
  background.addColorStop(1, "#070a15");
  context.fillStyle = background;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  for (let index = 0; index < 120; index += 1) {
    context.beginPath();
    context.arc(
      (index * 197 + 83) % CARD_WIDTH,
      (index * 317 + 41) % CARD_HEIGHT,
      index % 6 === 0 ? 2.8 : 1.5,
      0,
      Math.PI * 2,
    );
    context.fillStyle = index % 2 ? "rgba(233,214,158,0.2)" : "rgba(233,214,158,0.38)";
    context.fill();
  }

  context.strokeStyle = "#d5b66f";
  context.lineWidth = 3;
  context.roundRect(28, 28, CARD_WIDTH - 56, CARD_HEIGHT - 56, 36);
  context.stroke();

  context.textAlign = "center";
  context.fillStyle = "#d9bd7c";
  context.font = "600 27px Georgia, serif";
  context.fillText("ASTRARED · SINASTRÍA", CARD_WIDTH / 2, 150);

  context.fillStyle = "#f5e8c4";
  context.font = "64px Georgia, serif";
  context.fillText("Conexión astral", CARD_WIDTH / 2, 280);

  context.fillStyle = "#e4c77f";
  context.font = "36px Georgia, serif";
  context.fillText(`${nameA}  ✦  ${nameB}`, CARD_WIDTH / 2, 365, CARD_WIDTH - 140);

  context.fillStyle = "#f5e8c4";
  context.font = "bold 190px Georgia, serif";
  context.fillText(`${result.percent}%`, CARD_WIDTH / 2, 650);

  context.fillStyle = "#d9bd7c";
  context.font = "600 25px Georgia, serif";
  context.fillText("ÍNDICE DE COMPATIBILIDAD ASTRAL", CARD_WIDTH / 2, 715);

  context.strokeStyle = "rgba(213,182,111,0.55)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(140, 790);
  context.lineTo(CARD_WIDTH - 140, 790);
  context.stroke();

  context.textAlign = "left";
  context.fillStyle = "#e4c77f";
  context.font = "600 27px Georgia, serif";
  context.fillText("ASPECTOS DESTACADOS", 130, 855);

  context.fillStyle = "#e8dfca";
  context.font = "30px Georgia, serif";
  const aspects = result.aspects.slice(0, 5);
  if (aspects.length === 0) {
    context.fillText("Una conexión única para explorar", 130, 925);
  } else {
    aspects.forEach((aspect, index) => {
      const description = `${PLANET_META[aspect.a].name} · ${PLANET_META[aspect.b].name}: ${ASPECT_META[aspect.type].name}`;
      context.fillText(description, 130, 925 + index * 62, CARD_WIDTH - 260);
    });
  }

  context.textAlign = "center";
  context.fillStyle = "#c6bb9c";
  context.font = "24px Georgia, serif";
  context.fillText("Zodiaco tropical · Astrología para la reflexión", CARD_WIDTH / 2, 1215);
  if (result.timeApproximate) {
    context.font = "20px Georgia, serif";
    context.fillText("Al menos una hora de nacimiento es aproximada", CARD_WIDTH / 2, 1255);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo exportar la tarjeta como imagen."));
    }, "image/png");
  });
}
