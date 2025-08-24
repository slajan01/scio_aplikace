// server/utils/ai.ts

// Definujeme, jak má vypadat odpověď od AI
interface AnalysisResult {
  isRelevant: boolean;
  progressIncrement: number; // O kolik kroků se student posunul (0 nebo 1)
  feedback: string;
  needsHelp: boolean;
}

export async function analyzeMessage(message: string, goal: string, currentProgress: number, targetValue: number): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Chybí GEMINI_API_KEY");
    // Vrátíme neutrální odpověď, pokud klíč chybí
    return { isRelevant: false, progressIncrement: 0, feedback: '', needsHelp: false };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  // Pečlivě sestavený prompt pro AI
  const prompt = `
    Jsi asistent učitele v chatovací aplikaci. Tvým úkolem je analyzovat zprávu od studenta.

    **Kontext:**
    - Cíl studenta: "${goal}"
    - Celkový počet kroků k cíli: ${targetValue}
    - Aktuálně splněno kroků: ${currentProgress}

    **Zpráva od studenta:**
    "${message}"

    **Tvoje úloha:**
    Analyzuj zprávu a odpověz POUZE ve formátu JSON. Nepřidávej žádný další text ani formátování.
    - "isRelevant": Je zpráva relevantní k řešení cíle? (true/false)
    - "progressIncrement": Posunul se student o další krok blíže k cíli? Odpověz 1 pokud ano, 0 pokud ne. Buď přísný, pokrok uděl jen za jasné vyřešení části úkolu.
    - "feedback": Velmi krátká zpětná vazba pro studenta v češtině (např. "Správně!", "To se netýká úkolu.", "Zkus to jinak.").
    - "needsHelp": Zdá se, že student potřebuje pomoc učitele? (true/false)

    Příklad odpovědi: {"isRelevant": true, "progressIncrement": 1, "feedback": "Výborně, další rovnice je správně!", "needsHelp": false}
  `;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
      throw new Error(`Chyba API: ${response.statusText}`);
    }

    const result = await response.json();
    const jsonString = result.candidates[0].content.parts[0].text;

    // Očistíme odpověď od případného formátování
    const cleanedJson = jsonString.replace(/```json|```/g, '').trim();

    return JSON.parse(cleanedJson) as AnalysisResult;

  } catch (error) {
    console.error("Chyba při komunikaci s AI:", error);
    return { isRelevant: false, progressIncrement: 0, feedback: '', needsHelp: false };
  }
}
