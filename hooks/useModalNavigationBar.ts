import * as NavigationBar from "expo-navigation-bar";
import {
  setStatusBarBackgroundColor,
  setStatusBarStyle,
  setStatusBarTranslucent,
} from "expo-status-bar";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";

const MODAL_SYSTEM_BAR_BG = "#9CA3AF";
const DEFAULT_SYSTEM_BAR_BG = "#FFFFFF";

let visibleModalCount = 0;

function applySystemBarStyle() {
  if (Platform.OS !== "android") return;
  const dimmed = visibleModalCount > 0;

  setStatusBarTranslucent(false);
  setStatusBarBackgroundColor(
    dimmed ? MODAL_SYSTEM_BAR_BG : DEFAULT_SYSTEM_BAR_BG,
    true
  );
  setStatusBarStyle("dark", true);

  void NavigationBar.setBackgroundColorAsync(
    dimmed ? MODAL_SYSTEM_BAR_BG : DEFAULT_SYSTEM_BAR_BG
  ).catch(() => {});
  void NavigationBar.setButtonStyleAsync("dark").catch(() => {});
}

export function useModalNavigationBar(visible: boolean) {
  useEffect(() => {
    if (Platform.OS !== "android" || !visible) return;

    visibleModalCount += 1;
    applySystemBarStyle();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        applySystemBarStyle();
      }
    });

    return () => {
      sub.remove();
      visibleModalCount = Math.max(0, visibleModalCount - 1);
      applySystemBarStyle();
    };
  }, [visible]);
}
