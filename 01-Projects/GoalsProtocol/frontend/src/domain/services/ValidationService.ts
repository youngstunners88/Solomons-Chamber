/**
 * ═══════════════════════════════════════════════════════════════
 * DOMAIN - VALIDATION SERVICE
 * ═══════════════════════════════════════════════════════════════
 */

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<string>;
}

export const createValidationResult = (
  isValid: boolean,
  errors: string[] = []
): ValidationResult => ({
  isValid,
  errors,
});

export const combineValidations = (
  ...results: ValidationResult[]
): ValidationResult => {
  const allErrors = results.flatMap((r) => r.errors);
  return createValidationResult(allErrors.length === 0, allErrors);
};

export const validatePlayerName = (name: string): ValidationResult => {
  const errors: string[] = [];
  if (!name || name.trim().length < 2) {
    errors.push('Player name must be at least 2 characters');
  }
  if (name.length > 50) {
    errors.push('Player name must be at most 50 characters');
  }
  return createValidationResult(errors.length === 0, errors);
};

export const validateStat = (statName: string, value: number): ValidationResult => {
  const errors: string[] = [];
  if (value < 0 || value > 99) {
    errors.push(`${statName} must be between 0 and 99`);
  }
  return createValidationResult(errors.length === 0, errors);
};
