import { useState } from "react";
import { Linking, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocale } from "@/contexts/locale";

interface JobReportProps {
  canonicalUrl: string;
  onClose: () => void;
  sourceUrl: string;
  title: string;
}
const SUPPORT_EMAIL = "support@openings.dev";

export function JobReport({ canonicalUrl, onClose, sourceUrl, title }: JobReportProps): React.ReactNode {
  const { messages } = useLocale();
  const copy = messages.safety;
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const openDraft = async () => {
    setPending(true);
    setFailed(false);
    const subject = copy.emailSubject.replace("{title}", title);
    const body = `${copy.emailBody}\n\n\n${copy.listingReference}: ${canonicalUrl}\n${copy.originalReference}: ${sourceUrl}`;
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };
  return (
    <Modal animationType="slide" onRequestClose={onClose} visible>
      <SafeAreaView className="flex-1 bg-paper" accessibilityViewIsModal>
        <ScrollView contentContainerClassName="gap-5 p-6">
          <Text accessibilityRole="header" className="font-display text-card-title font-semibold text-foreground">{copy.reportTitle}</Text>
          <Text className="font-body text-product-body text-foreground">{copy.reportHelp}</Text>
          {failed ? <Text accessibilityRole="alert" className="font-body text-product-body text-foreground">{copy.emailError}</Text> : null}
          <Text selectable className="font-body text-product-body text-foreground">{SUPPORT_EMAIL}</Text>
          <View className="gap-2">
            <Text className="font-body text-label font-semibold text-foreground">{copy.listingReference}</Text>
            <Text selectable className="font-body text-product-body text-foreground">{canonicalUrl}</Text>
            <Text className="font-body text-label font-semibold text-foreground">{copy.originalReference}</Text>
            <Text selectable className="font-body text-product-body text-foreground">{sourceUrl}</Text>
          </View>
          <Pressable accessibilityRole="button" className="min-h-11 items-center justify-center rounded-control bg-primary px-16 py-3 disabled:opacity-50" disabled={pending} onPress={() => void openDraft()}>
            <Text className="font-body text-label font-semibold text-primary-foreground">{copy.openEmail}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" className="min-h-11 items-center justify-center rounded-control border border-line px-16 py-3" onPress={onClose}>
            <Text className="font-body text-label text-foreground">{messages.common.close}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
