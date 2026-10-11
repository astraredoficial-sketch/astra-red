import * as SunCalc from "suncalc";

export interface AstralCalculationResult {
  date: string;
  phaseName: string;
  illumination: number;
  recommendation: string;
  bestTime: string;
}

export function calculateRealAstralData(targetDate: Date, activityType: string): AstralCalculationResult {
  const illum = SunCalc.getMoonIllumination(targetDate);
  const illumPercent = Math.round(illum.fraction * 100);
  const phaseVal = illum.phase; // 0 = Luna Nueva, 0.25 = Cuarto Creciente, 0.5 = Luna Llena, 0.75 = Cuarto Menguante
  
  let phaseName = "Luna Nueva 🌑";
  if (phaseVal > 0.03 && phaseVal < 0.24) phaseName = "Luna Creciente 🌒";
  else if (phaseVal >= 0.24 && phaseVal <= 0.26) phaseName = "Cuarto Creciente 🌓";
  else if (phaseVal > 0.26 && phaseVal < 0.48) phaseName = "Luna Gibosa Creciente 🌔";
  else if (phaseVal >= 0.48 && phaseVal <= 0.52) phaseName = "Luna Llena 🌕";
  else if (phaseVal > 0.52 && phaseVal < 0.74) phaseName = "Luna Gibosa Menguante 🌖";
  else if (phaseVal >= 0.74 && phaseVal <= 0.76) phaseName = "Cuarto Menguante 🌗";
  else if (phaseVal > 0.76 && phaseVal < 0.97) phaseName = "Luna Menguante 🌘";

  const dateStr = targetDate.toISOString().split("T")[0];

  let recommendation = `Cálculo astronómico de efemérides: Fase ${phaseName} con ${illumPercent}% de iluminación del disco lunar. `;
  let bestTime = "07:00 AM - 11:00 AM";

  const q = activityType.toLowerCase();
  if (q.includes("cosechar") || q.includes("maiz") || q.includes("maíz") || q.includes("podar") || q.includes("mata") || q.includes("siembra")) {
    if (phaseVal >= 0.50 && phaseVal <= 0.95) {
      recommendation += "Fase menguante científica ideal: menor concentración de agua en tejidos vegetales, savia descendente, excelente para evitar plagas en almacenamiento y poda de raíces.";
      bestTime = "06:00 AM - 10:00 AM";
    } else {
      recommendation += "Fase ascendente: mayor actividad de savia en la parte aérea de la planta.";
    }
  } else if (q.includes("cabello") || q.includes("pelo") || q.includes("cortar")) {
    if (phaseVal >= 0.05 && phaseVal <= 0.50) {
      recommendation += "Fase creciente activa: estimula el vigor del folículo y un crecimiento capilar más rápido y fuerte.";
      bestTime = "10:00 AM - 03:00 PM";
    } else {
      recommendation += "Fase menguante: ideal si prefieres que el corte de cabello mantenga su forma y tarde más en crecer.";
    }
  } else {
    recommendation += "Tránsito celeste verificado para alinear tus actividades con los ciclos naturales.";
  }

  return {
    date: dateStr,
    phaseName,
    illumination: illumPercent,
    recommendation,
    bestTime,
  };
}

export function findOptimalAstralDates(query: string, year: number, startMonth: number, endMonth: number): AstralCalculationResult[] {
  const results: AstralCalculationResult[] = [];
  
  for (let m = startMonth; m <= endMonth; m++) {
    for (let d = 1; d <= 28; d += 4) {
      const testDate = new Date(year, m - 1, d);
      const calc = calculateRealAstralData(testDate, query);
      
      const illum = SunCalc.getMoonIllumination(testDate);
      const q = query.toLowerCase();
      const isHarvestOrGarden = q.includes("cosechar") || q.includes("maiz") || q.includes("maíz") || q.includes("podar") || q.includes("mata");
      const isHair = q.includes("cabello") || q.includes("pelo");

      let keep = false;
      if (isHarvestOrGarden && illum.phase >= 0.55 && illum.phase <= 0.90) keep = true; // Menguante
      else if (isHair && illum.phase >= 0.05 && illum.phase <= 0.45) keep = true; // Creciente
      else if (!isHarvestOrGarden && !isHair) keep = true;

      if (keep && !results.some(r => r.date.substring(0, 7) === calc.date.substring(0, 7)) && results.length < 3) {
        results.push(calc);
      }
    }
  }

  if (results.length === 0) {
    results.push(calculateRealAstralData(new Date(year, startMonth - 1, 15), query));
  }

  return results;
}


