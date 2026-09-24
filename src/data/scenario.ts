// Escenarios de demo (D8): ?escenario=lenta retrasa cada búsqueda y cada «Ver
// más» 1500 ms; ?escenario=ocupada hace fallar el envío válido de la vista 3.
// Viajan en la URL con los parámetros de V1 (D1).

export const SCENARIOS = ['lenta', 'ocupada'] as const
export type Scenario = (typeof SCENARIOS)[number] | null

export const SLOW_MS = 1500

export function scenarioFrom(params: URLSearchParams): Scenario {
  return SCENARIOS.find((s) => s === params.get('escenario')) ?? null
}

/** Resultado de `run`, tras el retraso de `lenta` si toca. */
export async function withScenario<T>(scenario: Scenario, run: () => T): Promise<T> {
  if (scenario === 'lenta') await new Promise((resolve) => setTimeout(resolve, SLOW_MS))
  return run()
}
