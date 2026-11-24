import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { BlockedAuthorsProvider, useBlockedAuthors } from "@/contexts/blocked-authors";
import { CandidateStateProvider, useCandidateState } from "@/contexts/candidate-state";
import { OpeningsCatalogProvider, useOpeningsCatalog } from "@/contexts/openings-catalog";
import { makeCommunity, makeOpportunity } from "../fixtures/openings";

function Harness(): React.ReactNode {
  const catalog = useOpeningsCatalog();
  const { blockedHandles, unblockAuthor, blockAuthor } = useBlockedAuthors();
  const { savedIds } = useCandidateState();
  return <><Text>{catalog.communities[0]?.opportunitiesCount ?? "waiting"} community jobs</Text><Text>{catalog.opportunities.map((job) => job.id).join(",") || "empty"}</Text><Text>{savedIds.has("saved") ? "still saved" : "not saved"}</Text><Pressable onPress={() => void (blockedHandles.size ? unblockAuthor("alice") : blockAuthor("Alice"))}><Text>toggle block</Text></Pressable></>;
}

it("filters cached catalog before hydration, restores saved listings without changing the shared cache", async () => {
  let resolve!: (value: string | null) => void;
  jest.spyOn(AsyncStorage, "getItem").mockImplementation(async (key) => {
    if (key === "openings:blocked-authors") return new Promise((done) => { resolve = done; });
    return JSON.stringify({ version: 3, lastVisitAt: null, newMatchesDismissedAt: null, saved: { saved: "2026-11-23" }, viewed: {} });
  });
  jest.spyOn(AsyncStorage, "setItem").mockResolvedValue();
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const source = Object.freeze([makeOpportunity("saved")]);
  const cache = { opportunities: source, communities: { items: [makeCommunity("openings-dev/jobs", { opportunitiesCount: 1 })] }, manifest: { pages: [], totals: { openOpportunities: 1 } } };
  client.setQueryData(["openings", "catalog"], cache);
  const screen = await render(<QueryClientProvider client={client}><CandidateStateProvider><BlockedAuthorsProvider><OpeningsCatalogProvider><Harness /></OpeningsCatalogProvider></BlockedAuthorsProvider></CandidateStateProvider></QueryClientProvider>);
  expect(screen.queryByText("saved")).toBeNull();
  await act(async () => resolve('["alice"]'));
  expect(screen.getByText("empty")).toBeTruthy();
  expect(screen.getByText("0 community jobs")).toBeTruthy();
  expect(screen.getByText("still saved")).toBeTruthy();
  await fireEvent.press(screen.getByText("toggle block"));
  expect(await screen.findByText("saved")).toBeTruthy();
  await fireEvent.press(screen.getByText("toggle block"));
  expect(await screen.findByText("empty")).toBeTruthy();
  expect(screen.getByText("still saved")).toBeTruthy();
  expect(client.getQueryData(["openings", "catalog"])).toEqual(cache);
  await screen.unmount();
  client.clear();
  jest.restoreAllMocks();
});
