import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";

const MODAL_NAV_BAR_BG = "#2A272E";
const DEFAULT_NAV_BAR_BG = "#FFFFFF";

let visibleModalCount = 0;

function applyNavigationBarStyle() {
  if (Platform.OS !== "android") return;
  const dimmed = visibleModalCount > 0;
  void NavigationBar.setBackgroundColorAsync(
    dimmed ? MODAL_NAV_BAR_BG : DEFAULT_NAV_BAR_BG
  ).catch(() => {});
  void NavigationBar.setButtonStyleAsync(dimmed ? "light" : "dark").catch(() => {});
}

export function useModalNavigationBar(visible: boolean) {
  useEffect(() => {
    if (Platform.OS !== "android" || !visible) return;

    visibleModalCount += 1;
    applyNavigationBarStyle();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        applyNavigationBarStyle();
      }
    });

    return () => {
      sub.remove();
      visibleModalCount = Math.max(0, visibleModalCount - 1);
      applyNavigationBarStyle();
    };
  }, [visible]);
}
