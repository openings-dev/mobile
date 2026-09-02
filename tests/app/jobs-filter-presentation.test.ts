import { createDefaultJobFilters } from "@/domain/openings/discovery";
import {
  countModalFilters,
  getActiveJobFilters,
  removeActiveJobFilter,
  toggleDiscoveryShortcut,
} from "@/app/jobs/helpers/filter-presentation";

describe("Jobs filter presentation", () => {
  it("counts only filters owned by the More modal", () => {
    const filters = {
      ...createDefaultJobFilters(),
      country: "Brazil",
      technologies: ["react"],
      workModels: ["remote"],
      freshnessDays: 30,
      savedOnly: true,
    };

    expect(countModalFilters(filters)).toBe(3);
  });

  it.each([
    ["remote", "workModels", ["remote"]],
    ["internship", "seniority", ["internship"]],
    ["react", "technologies", ["react"]],
    ["data-ai", "areas", ["data-ai"]],
    ["devops", "areas", ["devops-sre"]],
  ] as const)("toggles the %s discovery shortcut", (shortcut, field, expected) => {
    const selected = toggleDiscoveryShortcut(createDefaultJobFilters(), shortcut);
    expect(selected[field]).toEqual(expected);
    expect(toggleDiscoveryShortcut(selected, shortcut)[field]).toEqual([]);
  });

  it("toggles boolean and freshness discovery shortcuts", () => {
    const salary = toggleDiscoveryShortcut(createDefaultJobFilters(), "salary");
    const saved = toggleDiscoveryShortcut(salary, "saved");
    const fresh = toggleDiscoveryShortcut(saved, "freshness-90");
    const recent = toggleDiscoveryShortcut(fresh, "new");

    expect(recent.salaryOnly).toBe(true);
    expect(recent.savedOnly).toBe(true);
    expect(recent.freshnessDays).toBe(90);
    expect(recent.newOnly).toBe(true);
    expect(toggleDiscoveryShortcut(recent, "freshness-90").freshnessDays).toBeNull();
  });

  it("describes active values and removes one selected value", () => {
    const filters = {
      ...createDefaultJobFilters(),
      authors: ["octocat", "hubot"],
      country: "Brazil",
      freshnessDays: 7,
      salaryOnly: true,
      technologies: ["react"],
    };
    const items = getActiveJobFilters(filters);

    expect(items.map(({ id }) => id)).toEqual([
      "country:Brazil",
      "author:octocat",
      "author:hubot",
      "technology:react",
      "freshness:7",
      "salary:true",
    ]);

    const withoutOctocat = removeActiveJobFilter(
      filters,
      items.find(({ id }) => id === "author:octocat")!,
    );
    expect(withoutOctocat.authors).toEqual(["hubot"]);
  });
});
