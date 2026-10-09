import {
  Alert,
  Platform,
  type AlertButton,
  type AlertOptions,
} from "react-native";

// React Native's Alert has no browser implementation. Keep confirmation
// mandatory on both the mobile preview and native builds.
export const AppAlert = {
  alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) {
    if (Platform.OS !== "web")
      return Alert.alert(title, message, buttons, options);
    const text = [title, message].filter(Boolean).join("\n\n");
    const action = buttons?.find((button) => button.style !== "cancel");
    if (!action) {
      window.alert(text);
      return;
    }
    if (window.confirm(text)) action.onPress?.();
  },
};
