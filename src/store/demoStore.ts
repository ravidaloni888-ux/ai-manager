import { getMandantType } from './mandantStore'

// Der frühere Demo-Schalter ist im Mandantenmodell aufgegangen:
// "Demo" ist jetzt ein Mandant vom Typ 'demo'. Diese Funktion bleibt als
// Adapter bestehen, damit die Stores unverändert danach fragen können.
export function getDemoMode(): boolean {
  return getMandantType() === 'demo'
}
