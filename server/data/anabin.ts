// Real Anabin (KMK Germany) institution classifications for Indian Higher Education
export interface AnabinInstitution {
  name: string;
  state: string;
  status: 'H+' | 'H+/-' | 'H-';
  type: string;
  notes: string;
}

export const ANABIN_INDIAN_INSTITUTIONS: AnabinInstitution[] = [
  { name: 'Indian Institute of Technology Bombay (IITB)', state: 'Maharashtra', status: 'H+', type: 'Institute of National Importance', notes: 'Direct qualification equivalence for all engineering and science master degrees.' },
  { name: 'Indian Institute of Technology Delhi (IITD)', state: 'Delhi', status: 'H+', type: 'Institute of National Importance', notes: 'Fully recognized H+ status.' },
  { name: 'Indian Institute of Technology Madras (IITM)', state: 'Tamil Nadu', status: 'H+', type: 'Institute of National Importance', notes: 'Fully recognized H+ status.' },
  { name: 'University of Delhi (DU)', state: 'Delhi', status: 'H+', type: 'Central University', notes: '3-year BA/BSc degrees require 180 ECTS verification; 4-year honours or postgrad is recognized directly.' },
  { name: 'Anna University, Chennai', state: 'Tamil Nadu', status: 'H+', type: 'State University', notes: 'All B.E. / B.Tech degrees recognized as 240 ECTS equivalent.' },
  { name: 'Visvesvaraya Technological University (VTU), Belagavi', state: 'Karnataka', status: 'H+', type: 'State Technological University', notes: 'Engineering degrees fully recognized for German Master admissions.' },
  { name: 'University of Mumbai', state: 'Maharashtra', status: 'H+', type: 'State University', notes: 'H+ verified. APS certification required.' },
  { name: 'Jawaharlal Nehru Technological University (JNTU) Hyderabad', state: 'Telangana', status: 'H+', type: 'State Technological University', notes: 'Recognized engineering and technology degrees.' },
  { name: 'Birla Institute of Technology and Science (BITS Pilani)', state: 'Rajasthan', status: 'H+', type: 'Deemed University', notes: 'Equivalent to German university diploma / Bachelor.' },
  { name: 'Manipal Academy of Higher Education (MAHE)', state: 'Karnataka', status: 'H+', type: 'Deemed to be University', notes: 'H+ recognized for engineering, life sciences, and health disciplines.' },
  { name: 'SRM Institute of Science and Technology', state: 'Tamil Nadu', status: 'H+', type: 'Deemed to be University', notes: 'Fully recognized H+ status.' },
  { name: 'Vellore Institute of Technology (VIT)', state: 'Tamil Nadu', status: 'H+', type: 'Deemed to be University', notes: 'H+ status. 4-year B.Tech gives direct access to German Master.' },
  { name: 'Savitribai Phule Pune University (SPPU)', state: 'Maharashtra', status: 'H+', type: 'State University', notes: 'Fully recognized H+.' },
  { name: 'Amity University, Noida', state: 'Uttar Pradesh', status: 'H+', type: 'Private University', notes: 'H+ recognized. Individual study program equivalence applies.' },
  { name: 'Punjab Technical University (IKGPTU)', state: 'Punjab', status: 'H+', type: 'State University', notes: 'Recognized for engineering and computer science.' }
];

// Modified Bavarian Formula (Modifizierte Bayerische Formel) for German Grade Conversion
// Formula: N = 1 + 3 * (N_max - N_d) / (N_max - N_min)
// where:
// N = German Grade (1.0 = Sehr gut / best, 4.0 = Ausreichend / pass, 5.0 = Nicht bestanden)
// N_max = Maximum achievable grade in origin system (e.g. 10.0 CGPA or 100%)
// N_min = Minimum passing grade in origin system (e.g. 4.0 or 5.0 CGPA, or 40% / 50%)
// N_d = Actual grade achieved by applicant
export function calculateBavarianGrade(
  obtained: number,
  max: number,
  minPass: number
): { germanGrade: number; formulaString: string; classification: string } {
  if (obtained < minPass) {
    return {
      germanGrade: 5.0,
      formulaString: `Obtained (${obtained}) is below passing threshold (${minPass})`,
      classification: 'Nicht bestanden (Failed / Ineligible)'
    };
  }

  // Cap if obtained exceeds max
  const clampedObtained = Math.min(obtained, max);
  const rawGrade = 1 + 3 * ((max - clampedObtained) / (max - minPass));
  const roundedGrade = Math.round(rawGrade * 10) / 10;

  let classification = 'Ausreichend (Sufficient / Pass)';
  if (roundedGrade <= 1.5) {
    classification = 'Sehr gut (Very Good / Outstanding)';
  } else if (roundedGrade <= 2.5) {
    classification = 'Gut (Good / Above Average)';
  } else if (roundedGrade <= 3.5) {
    classification = 'Befriedigend (Satisfactory)';
  }

  const formulaString = `1 + 3 * (${max} - ${clampedObtained}) / (${max} - ${minPass}) = ${roundedGrade.toFixed(1)}`;

  return {
    germanGrade: roundedGrade,
    formulaString,
    classification
  };
}

// Chancenkarte (Opportunity Card) German Points System Calculation (Section 20a AufenthG)
export interface ChancenkarteCriteria {
  ageYears: number;
  anabinRecognizedDegree: boolean;
  germanLevel: string; // NONE, A1, A2, B1, B2, C1
  englishLevel: string; // NONE, B2, C1, C2
  yearsExperienceInProfession: number;
  shortageOccupation: boolean; // MINT / STEM, Nursing, Engineering, IT
  previousLegalStayInGermanyMonths: number;
  spouseQualifies: boolean;
}

export function evaluateChancenkartePoints(criteria: ChancenkarteCriteria) {
  let totalPoints = 0;
  const breakdown: { category: string; pointsAwarded: number; maxPoints: number; explanation: string }[] = [];

  // 1. Qualification Recognition (Up to 4 points)
  if (criteria.anabinRecognizedDegree) {
    totalPoints += 4;
    breakdown.push({
      category: 'Partial or Full Professional Recognition',
      pointsAwarded: 4,
      maxPoints: 4,
      explanation: 'Indian degree conferred by an Anabin H+ institution or recognized professional qualification.'
    });
  } else {
    breakdown.push({
      category: 'Professional Recognition',
      pointsAwarded: 0,
      maxPoints: 4,
      explanation: 'Degree not yet verified on Anabin or requires ZAB statement of comparability.'
    });
  }

  // 2. Professional Experience (Up to 3 points)
  if (criteria.yearsExperienceInProfession >= 5) {
    totalPoints += 3;
    breakdown.push({
      category: 'Professional Experience (5+ years)',
      pointsAwarded: 3,
      maxPoints: 3,
      explanation: '5 or more years of continuous relevant professional experience.'
    });
  } else if (criteria.yearsExperienceInProfession >= 2) {
    totalPoints += 2;
    breakdown.push({
      category: 'Professional Experience (2-4 years)',
      pointsAwarded: 2,
      maxPoints: 3,
      explanation: 'At least 2 years of relevant professional work experience.'
    });
  } else {
    breakdown.push({
      category: 'Professional Experience',
      pointsAwarded: 0,
      maxPoints: 3,
      explanation: 'Less than 2 years of relevant professional work experience.'
    });
  }

  // 3. Language Skills (Up to 3 points)
  let langPoints = 0;
  let langExplanation = '';
  if (['B2', 'C1', 'C2'].includes(criteria.germanLevel)) {
    langPoints = 3;
    langExplanation = `German at CEFR ${criteria.germanLevel} level (B2+) awards maximum 3 points.`;
  } else if (criteria.germanLevel === 'B1') {
    langPoints = 2;
    langExplanation = 'German at CEFR B1 level awards 2 points.';
  } else if (criteria.germanLevel === 'A2') {
    langPoints = 1;
    langExplanation = 'German at CEFR A2 level awards 1 point.';
  } else if (['C1', 'C2'].includes(criteria.englishLevel)) {
    langPoints = 1;
    langExplanation = 'Fluent English (C1/IELTS 7.0+) with basic German awards 1 point.';
  } else {
    langExplanation = 'Minimum A1/A2 German or English C1 required for points.';
  }
  totalPoints += langPoints;
  breakdown.push({
    category: 'Language Proficiency (German / English)',
    pointsAwarded: langPoints,
    maxPoints: 3,
    explanation: langExplanation
  });

  // 4. Age (Up to 2 points)
  if (criteria.ageYears <= 35) {
    totalPoints += 2;
    breakdown.push({
      category: 'Applicant Age (<= 35 years)',
      pointsAwarded: 2,
      maxPoints: 2,
      explanation: `Age ${criteria.ageYears} falls within prime age bracket (<= 35).`
    });
  } else if (criteria.ageYears <= 40) {
    totalPoints += 1;
    breakdown.push({
      category: 'Applicant Age (36-40 years)',
      pointsAwarded: 1,
      maxPoints: 2,
      explanation: `Age ${criteria.ageYears} falls within bracket 36 to 40.`
    });
  } else {
    breakdown.push({
      category: 'Applicant Age (> 40 years)',
      pointsAwarded: 0,
      maxPoints: 2,
      explanation: `Age ${criteria.ageYears} is above 40 years.`
    });
  }

  // 5. Shortage Occupation (Engpassberuf / STEM / IT / Healthcare) (1 point)
  if (criteria.shortageOccupation) {
    totalPoints += 1;
    breakdown.push({
      category: 'Shortage Occupation (Engpassberuf)',
      pointsAwarded: 1,
      maxPoints: 1,
      explanation: 'Target occupation is in a defined German shortage category (IT, Engineering, Nursing, Logistics).'
    });
  }

  // 6. Previous stays in Germany (1 point)
  if (criteria.previousLegalStayInGermanyMonths >= 6) {
    totalPoints += 1;
    breakdown.push({
      category: 'Prior Stay in Germany (>= 6 months)',
      pointsAwarded: 1,
      maxPoints: 1,
      explanation: 'Prior legal study or work stay in Germany verified.'
    });
  }

  return {
    totalPoints,
    minimumRequired: 6,
    isEligible: totalPoints >= 6,
    breakdown
  };
}
