import * as NavigationBar from "expo-navigation-bar";
import {
  setStatusBarBackgroundColor,
  setStatusBarStyle,
  setStatusBarTranslucent,
} from "expo-status-bar";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";

const MODAL_SYSTEM_BAR_BG = "#9CA3AF";
const MODAL_STATUS_BAR_BG = "#E8EBF0";
const DEFAULT_SYSTEM_BAR_BG = "#FFFFFF";

let visibleModalCount = 0;

function applySystemBarStyle() {
  if (Platform.OS !== "android") return;
  const dimmed = visibleModalCount > 0;

  setStatusBarTranslucent(false);
  setStatusBarBackgroundColor(
    dimmed ? MODAL_STATUS_BAR_BG : DEFAULT_SYSTEM_BAR_BG,
    true
  );
  setStatusBarStyle("dark", true);

  void NavigationBar.setBackgroundColorAsync(
    dimmed ? MODAL_SYSTEM_BAR_BG : DEFAULT_SYSTEM_BAR_BG
  ).catch(() => {});
  void NavigationBar.setButtonStyleAsync("dark").catch(() => {});
}

function scheduleSystemBarStyleRefresh() {
  applySystemBarStyle();

  const timers = [80, 250, 500].map((delay) =>
    setTimeout(applySystemBarStyle, delay)
  );

  return () => {
    timers.forEach(clearTimeout);
  };
}

export function useModalNavigationBar(visible: boolean) {
  useEffect(() => {
    if (Platform.OS !== "android" || !visible) return;

    visibleModalCount += 1;
    const clearScheduledRefresh = scheduleSystemBarStyleRefresh();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        applySystemBarStyle();
      }
    });

    return () => {
      clearScheduledRefresh();
      sub.remove();
      visibleModalCount = Math.max(0, visibleModalCount - 1);
      scheduleSystemBarStyleRefresh();
    };
  }, [visible]);
}
