import { createDefaultJobFilters } from "@/domain/openings/discovery";
import { buildWebDiscoveryUrl } from "@/app/jobs/helpers/share-search";

describe("buildWebDiscoveryUrl", () => {
  it("uses the public web query contract in deterministic order", () => {
    const filters = {
      ...createDefaultJobFilters(),
      country: "Brazil",
      freshnessDays: 30,
      query: "frontend",
      salaryOnly: true,
      sort: "salary" as const,
      technologies: ["react"],
      workModels: ["remote"],
    };

    expect(buildWebDiscoveryUrl(filters)).toBe(
      "https://openings.dev/?country=Brazil&workModels=remote&technologies=react&freshness=30&salary=true&search=frontend&sort=salary",
    );
  });

  it("never shares device-local candidate filters", () => {
    const url = buildWebDiscoveryUrl({
      ...createDefaultJobFilters(),
      newOnly: true,
      savedOnly: true,
    });

    expect(url).toBe("https://openings.dev/");
    expect(url).not.toContain("new");
    expect(url).not.toContain("saved");
  });
});
