export type ManagedMentorOrganisation = {
  id: string;
  name: string;
  approved: boolean;
};

export type ManagedMentor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  githubUsername: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  active: boolean;
  registeredAt: string;
  organisations: ManagedMentorOrganisation[];
};
