import { Linking, Share } from "react-native";

export function requireHttpsUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error("not https");
    return url.toString();
  } catch {
    throw new Error("Only valid HTTPS destinations can be opened");
  }
}

export async function openHttpsUrl(value: string): Promise<void> {
  await Linking.openURL(requireHttpsUrl(value));
}

export async function shareUrl(title: string, value: string): Promise<void> {
  const url = requireHttpsUrl(value);
  await Share.share({ message: `${title}\n${url}`, title, url });
}
