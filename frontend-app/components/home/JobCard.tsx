
import { ArrowUpRight, MapPin } from "lucide-react";

export type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  category: string;
  featured?: boolean;
};

export default function JobCard({ job }: { job: Job }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {job.company.charAt(0)}
        </div>

        {job.featured && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Featured
          </span>
        )}
      </div>

      <p className="mt-5 text-xs font-medium text-blue-600 dark:text-blue-400">
        {job.category}
      </p>

      <h3 className="mt-2 text-lg font-bold text-slate-950 dark:text-white">
        {job.title}
      </h3>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {job.company}
      </p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <MapPin size={15} />
          {job.location}
        </span>
        <span>{job.type}</span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Salary range
          </p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
            {job.salary}
          </p>
        </div>

        <button
          type="button"
          aria-label={`View ${job.title} at ${job.company}`}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white dark:border-slate-700 dark:text-slate-300"
        >
          <ArrowUpRight size={18} />
        </button>
      </div>
    </article>
  );
}
