import { comparisonRows, packages } from "@/data/packages";
import { cn } from "@/lib/utils";

export function PackageComparison() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
      <h3 className="px-2 font-display text-lg font-bold text-navy sm:px-0">Compare Plans</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <caption className="sr-only">
            Comparison of Basic, Premium, and VIP Elite nutrition packages
          </caption>
          <thead>
            <tr className="border-b border-border/70 text-left">
              <th scope="col" className="w-1/4 py-3 pl-2 font-semibold text-navy sm:pl-0">
                Feature
              </th>
              {packages.map((pkg) => (
                <th key={pkg.slug} scope="col" className="w-1/4 py-3 px-2 font-semibold text-navy">
                  <div className="flex flex-col gap-1">
                    <span>{pkg.name}</span>
                    {pkg.badge && (
                      <span
                        className={cn(
                          "w-fit rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide",
                          pkg.slug === "vip-elite"
                            ? "bg-navy text-turquoise"
                            : "bg-turquoise/20 text-primary",
                        )}
                      >
                        {pkg.badge}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, index) => (
              <tr
                key={row.label}
                className={cn("border-b border-border/50", index % 2 === 1 && "bg-secondary/30")}
              >
                <th scope="row" className="py-3 pl-2 text-left font-medium text-navy/80 sm:pl-0">
                  {row.label}
                </th>
                <td className="py-3 px-2 text-muted-foreground">{row.basic}</td>
                <td className="py-3 px-2 font-medium text-navy">{row.premium}</td>
                <td className="py-3 px-2 font-semibold text-primary">{row.vipElite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 px-2 text-xs text-muted-foreground sm:px-0">
        Scroll horizontally on smaller screens to see the full comparison.
      </p>
    </div>
  );
}
