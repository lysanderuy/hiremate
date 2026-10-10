export const APPLICATION_STATUSES = [
  "submitted",
  "viewed",
  "shortlisted",
  "interview",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  viewed: "Viewed",
  shortlisted: "Shortlisted",
  interview: "Interview",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const APPLICANT_APPLICATION_STATUSES = [
  "submitted",
  "viewed",
  "shortlisted",
  "rejected",
  "withdrawn",
] as const;

export type ApplicantApplicationStatus = (typeof APPLICANT_APPLICATION_STATUSES)[number];

export function toApplicantStatus(status: ApplicationStatus): ApplicantApplicationStatus {
  return status === "interview" ? "shortlisted" : status;
}
