const ICEBREAKERS = [
  "¿Qué pequeño detalle siempre consigue alegrarte el día?",
  "Si pudieras viajar ahora mismo a cualquier lugar, ¿adónde irías?",
  "¿Qué canción podrías escuchar una y otra vez?",
  "¿Qué plan sencillo disfrutas mucho en un día libre?",
  "¿Qué tema te entusiasma tanto que podrías hablar horas?",
  "¿Prefieres una aventura espontánea o una noche tranquila?",
  "¿Cuál es un lugar al que te gustaría volver?",
  "¿Qué película o serie recomendarías sin pensarlo?",
  "¿Qué habilidad te gustaría aprender este año?",
  "¿Qué comida te recuerda a un buen momento?",
  "¿Qué es lo más bonito que has descubierto últimamente?",
  "¿Qué actividad te ayuda a desconectar?",
];

export function getIcebreakers(round: number): string[] {
  const start = (round * 3) % ICEBREAKERS.length;
  return Array.from(
    { length: 3 },
    (_, index) => ICEBREAKERS[(start + index) % ICEBREAKERS.length],
  );
}
