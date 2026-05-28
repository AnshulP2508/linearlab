export const frontendTechOptions = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "Svelte",
  "Tailwind CSS",
  "Bootstrap",
  "Material UI",
  "Redux",
  "GraphQL",
];

export const backendTechOptions = [
  "Node.js",
  "Express.js",
  "Nest.js",
  "Python",
  "Django",
  "Flask",
  "FastAPI",
  "Java",
  "Spring Boot",
  "C#",
  ".NET",
  "PHP",
  "Laravel",
  "Ruby",
  "Ruby on Rails",
  "Go",
  "Rust",
  "Kotlin",
];

export const databaseTechOptions = [
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "SQLite",
  "Microsoft SQL Server",
  "Oracle Database",
  "Firebase",
  "Supabase",
];

export const techStackOptions = [
  ...frontendTechOptions,
  ...backendTechOptions,
  ...databaseTechOptions,
];

const canonicalTechNames = new Map(
  techStackOptions.map((option) => [option.trim().toLowerCase(), option]),
);

export function getCanonicalTechName(value: string) {
  return canonicalTechNames.get(value.trim().toLowerCase()) ?? null;
}
