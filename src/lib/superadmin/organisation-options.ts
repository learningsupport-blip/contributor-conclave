export const OPEN_SOURCE_PROGRAMS = [
  { value: "GSOC", label: "GSOC" },
  { value: "LFX", label: "LFX" },
  { value: "ESOC", label: "ESOC" },
] as const;

export const ORGANISATION_TECHNOLOGIES = [
  { value: "React", label: "React" },
  { value: "React-Native", label: "React-Native" },
  { value: "Javascript", label: "Javascript" },
  { value: "Typescript", label: "Typescript" },
] as const;

export type OpenSourceProgram = (typeof OPEN_SOURCE_PROGRAMS)[number]["value"];
export type OrganisationTechnology = (typeof ORGANISATION_TECHNOLOGIES)[number]["value"];

const programValues: readonly string[] = OPEN_SOURCE_PROGRAMS.map((program) => program.value);
const technologyValues: readonly string[] = ORGANISATION_TECHNOLOGIES.map((technology) => technology.value);

export function isOpenSourceProgram(value: string): value is OpenSourceProgram {
  return programValues.includes(value);
}

export function isOrganisationTechnology(value: string): value is OrganisationTechnology {
  return technologyValues.includes(value);
}
