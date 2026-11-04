import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { insertUser, removeFixtures } from "@/test/fixtures";
import { createOrganisation } from "@/lib/superadmin/organisations";
import { createProject } from "@/lib/superadmin/projects";
import { getStudentOpportunities, saveStudentInterests, startStudentProject } from "@/lib/student/opportunities";

const domain = "@student-opportunity.example";

let superadminId = "";
let studentId = "";
let mentorId = "";
let projectId = "";

beforeAll(async () => {
  await removeFixtures(domain, "Opportunity ");
  const superadmin = await insertUser({
    role: "SUPERADMIN",
    email: `root${domain}`,
    firstName: "Root",
    lastName: "Admin",
  });
  const student = await insertUser({
    role: "STUDENT",
    email: `student${domain}`,
    firstName: "Sam",
    lastName: "Student",
  });
  const mentor = await insertUser({
    role: "MENTOR",
    email: `mentor${domain}`,
    firstName: "Mia",
    lastName: "Mentor",
  });
  superadminId = superadmin.id;
  studentId = student.id;
  mentorId = mentor.id;

  const organisation = await createOrganisation(superadminId, {
    name: "React Org",
    program: "GSOC",
    websiteUrl: "https://react.example",
    repositoryUrl: "https://github.com/react-org",
    technologies: ["React"],
  });
  if (!organisation.ok) {
    throw new Error(organisation.message);
  }
  const project = await createProject(superadminId, {
    name: "Portal",
    organisationId: organisation.data.id,
    program: "GSOC",
    websiteUrl: "https://react.example/portal",
    repositoryUrl: "https://github.com/react-org/portal",
    technologies: ["Typescript"],
  });
  if (!project.ok) {
    throw new Error(project.message);
  }
  projectId = project.data.id;
});

afterAll(async () => {
  await removeFixtures(domain, "Opportunity ");
});

describe("student opportunities", () => {
  it("lets a student save a stack used by a project and start that project", async () => {
    const refused = await saveStudentInterests(mentorId, ["Typescript"]);
    expect(refused).toMatchObject({ ok: false, code: "forbidden" });

    const saved = await saveStudentInterests(studentId, ["Typescript"]);
    expect(saved.ok).toBe(true);

    const opportunities = await getStudentOpportunities(studentId);
    expect(opportunities.ok).toBe(true);
    if (opportunities.ok) {
      expect(opportunities.data.organisations.map((organisation) => organisation.name)).toContain("React Org");
      expect(opportunities.data.technologies).toEqual(expect.arrayContaining(["React", "Typescript"]));
    }

    const started = await startStudentProject(studentId, projectId);
    expect(started.ok).toBe(true);
  });
});
