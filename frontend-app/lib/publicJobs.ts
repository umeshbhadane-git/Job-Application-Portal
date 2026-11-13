export type PublicJob = {
  _id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  workplaceType: "onsite" | "remote" | "hybrid";
  employmentType: "full-time" | "part-time" | "contract" | "internship";
  experienceLevel: "entry" | "junior" | "mid" | "senior" | "lead";
  minExperience?: number;
  maxExperience?: number | null;
  openings?: number;
  salary?: { min?: number; max?: number; currency?: string };
  skills: string[];
  optionalSkills?: string[];
  status: "published";
  publishedAt?: string | null;
  closingDate?: string | null;
  createdAt: string;
};

export type PublicJobsResponse = {
  success: boolean;
  message?: string;
  data: PublicJob[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type PublicJobResponse = {
  success: boolean;
  message?: string;
  data: PublicJob;
};

export function formatJobSalary(salary?: PublicJob["salary"]) {
  if (!salary || (salary.min == null && salary.max == null)) {
    return "Salary not listed";
  }

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: salary.currency || "INR",
    maximumFractionDigits: 0,
  });

  if (salary.min != null && salary.max != null) {
    return `${formatter.format(salary.min)} – ${formatter.format(salary.max)}`;
  }

  return formatter.format(salary.min ?? salary.max ?? 0);
}

export function formatJobLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
