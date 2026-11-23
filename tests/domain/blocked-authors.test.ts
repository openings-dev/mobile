import { visibleOpportunities, parseBlockedAuthors } from "@/domain/blocked-authors";
import { makeOpportunity } from "../fixtures/openings";

it("withholds cached jobs until hydration and filters without mutating the source", () => {
  const alice = Object.freeze(makeOpportunity("saved"));
  const bob = Object.freeze(makeOpportunity("other", { author: { id: "bob", handle: "bob", name: "Bob", avatarUrl: null } }));
  const source = Object.freeze([alice, bob]);
  expect(visibleOpportunities(source, new Set(), false)).toEqual([]);
  expect(visibleOpportunities(source, new Set(["alice"]), true)).toEqual([bob]);
  expect(visibleOpportunities(source, new Set(), true)).toEqual([alice, bob]);
  expect(source).toHaveLength(2);
});
it("validates and normalizes stored handles", () => {
  expect(parseBlockedAuthors('[" Alice ", "ALICE", "bob"]')).toEqual(["alice", "bob"]);
  expect(parseBlockedAuthors(null)).toEqual([]);
  expect(() => parseBlockedAuthors('{"bad":true}')).toThrow();
});
