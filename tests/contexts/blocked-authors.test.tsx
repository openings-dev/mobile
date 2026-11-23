import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { BlockedAuthorsProvider, useBlockedAuthors } from "@/contexts/blocked-authors";

function Harness(): React.ReactNode {
  const { hydrated, blockedHandles, blockAuthor, unblockAuthor } = useBlockedAuthors();
  return <><Text>{hydrated ? "ready" : "loading"}</Text><Text>{[...blockedHandles].join(",") || "none"}</Text><Pressable onPress={() => void blockAuthor(" Alice ")}><Text>block</Text></Pressable><Pressable onPress={() => void unblockAuthor("ALICE")}><Text>restore</Text></Pressable></>;
}

it("waits for persisted blocks, normalizes and persists restoration", async () => {
  let resolve!: (value: string | null) => void;
  jest.spyOn(AsyncStorage, "getItem").mockImplementation(() => new Promise((done) => { resolve = done; }));
  const save = jest.spyOn(AsyncStorage, "setItem").mockResolvedValue();
  const screen = await render(<BlockedAuthorsProvider><Harness /></BlockedAuthorsProvider>);
  expect(screen.getByText("loading")).toBeTruthy();
  await act(async () => resolve(JSON.stringify(["ALICE"])));
  expect(screen.getByText("alice")).toBeTruthy();
  await fireEvent.press(screen.getByText("restore"));
  await waitFor(() => expect(screen.getByText("none")).toBeTruthy());
  expect(save).toHaveBeenLastCalledWith("openings:blocked-authors", "[]");
  await fireEvent.press(screen.getByText("block"));
  await waitFor(() => expect(screen.getByText("alice")).toBeTruthy());
  expect(save).toHaveBeenLastCalledWith("openings:blocked-authors", '["alice"]');
  jest.restoreAllMocks();
});
