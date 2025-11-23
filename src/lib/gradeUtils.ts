import { indexedDB } from "./indexedDB";

export interface GradeThreshold {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

const DEFAULT_GRADE_THRESHOLDS: GradeThreshold = {
  A: 85,
  B: 70,
  C: 55,
  D: 40,
  E: 0,
};

/**
 * Get grade thresholds from settings
 */
export const getGradeThresholds = async (): Promise<GradeThreshold> => {
  try {
    const settings = await indexedDB.select("pengaturan");
    const gradeSetting = settings.find((s: any) => s.key === "grade_thresholds");
    
    if (gradeSetting?.value) {
      return JSON.parse(gradeSetting.value);
    }
    
    return DEFAULT_GRADE_THRESHOLDS;
  } catch (error) {
    console.error("Error loading grade thresholds:", error);
    return DEFAULT_GRADE_THRESHOLDS;
  }
};

/**
 * Save grade thresholds to settings
 */
export const saveGradeThresholds = async (thresholds: GradeThreshold): Promise<void> => {
  try {
    const settings = await indexedDB.select("pengaturan");
    const existing = settings.find((s: any) => s.key === "grade_thresholds");
    
    if (existing) {
      await indexedDB.update("pengaturan", existing.id, {
        value: JSON.stringify(thresholds),
      });
    } else {
      await indexedDB.insert("pengaturan", {
        key: "grade_thresholds",
        value: JSON.stringify(thresholds),
      });
    }
  } catch (error) {
    console.error("Error saving grade thresholds:", error);
    throw error;
  }
};

/**
 * Convert numeric score to letter grade
 * Uses >= logic: A >= 85, B >= 70, C >= 55, D >= 40, E < 40
 */
export const getLetterGrade = (score: number, thresholds: GradeThreshold): string => {
  if (score >= thresholds.A) return "A";
  if (score >= thresholds.B) return "B";
  if (score >= thresholds.C) return "C";
  if (score >= thresholds.D) return "D";
  return "E";
};

/**
 * Get grade range description for display
 */
export const getGradeRange = (grade: keyof GradeThreshold, thresholds: GradeThreshold): string => {
  const grades = ['A', 'B', 'C', 'D', 'E'] as const;
  const currentIndex = grades.indexOf(grade);
  const currentThreshold = thresholds[grade];
  
  if (currentIndex === 0) {
    // Grade A
    return `≥ ${currentThreshold}`;
  } else if (currentIndex === grades.length - 1) {
    // Grade E
    const previousGrade = grades[currentIndex - 1];
    const previousThreshold = thresholds[previousGrade];
    return `< ${previousThreshold}`;
  } else {
    // Grades B, C, D
    const previousGrade = grades[currentIndex - 1];
    const previousThreshold = thresholds[previousGrade];
    return `${currentThreshold} - ${previousThreshold - 0.01}`;
  }
};

/**
 * Validate grade thresholds
 */
export const validateGradeThresholds = (thresholds: GradeThreshold): { valid: boolean; error?: string } => {
  // Check if thresholds are in descending order
  if (thresholds.A <= thresholds.B) {
    return { valid: false, error: "Threshold A harus lebih besar dari B" };
  }
  if (thresholds.B <= thresholds.C) {
    return { valid: false, error: "Threshold B harus lebih besar dari C" };
  }
  if (thresholds.C <= thresholds.D) {
    return { valid: false, error: "Threshold C harus lebih besar dari D" };
  }
  if (thresholds.D <= thresholds.E) {
    return { valid: false, error: "Threshold D harus lebih besar dari E" };
  }
  
  // Check if all values are within 0-100
  const values = Object.values(thresholds);
  if (values.some(v => v < 0 || v > 100)) {
    return { valid: false, error: "Semua threshold harus antara 0-100" };
  }
  
  // E should always be 0
  if (thresholds.E !== 0) {
    return { valid: false, error: "Threshold E harus 0" };
  }
  
  return { valid: true };
};
