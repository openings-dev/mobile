import { Component, type PropsWithChildren } from "react";
import { Pressable, Text, View } from "react-native";

import { captureTechnicalException } from "@/services/telemetry";

interface ErrorFallbackCopy {
  message: string;
  retry: string;
  title: string;
}

interface AppErrorBoundaryProps extends PropsWithChildren {
  fallback: ErrorFallbackCopy;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public state: AppErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error): void {
    captureTechnicalException(error, { category: "render-boundary" });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  public render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { fallback } = this.props;

    return (
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <View className="w-full max-w-xl items-start gap-16 rounded-panel border border-line bg-paper p-6">
          <Text className="font-display text-product-title font-semibold text-foreground">
            {fallback.title}
          </Text>
          <Text className="font-body text-product-body text-muted-foreground">
            {fallback.message}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="min-h-touch min-w-touch items-center justify-center rounded-control bg-primary px-5"
            onPress={this.handleRetry}
          >
            <Text className="font-body text-product-body font-semibold text-primary-foreground">
              {fallback.retry}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
}
