import { useAuth } from "@/contexts/AuthContext";
import {
  peekPendingResetPasswordUrl,
  setPendingResetPasswordUrl,
} from "@/lib/pendingResetUrl";
import { isSupabaseRecoveryLink } from "@/lib/supabaseRecoveryLink";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

const SPLASH_BACKGROUND = "rgb(204, 245, 201)";
const INITIAL_URL_TIMEOUT_MS = 5000;
const SPLASH_FAILSAFE_MS = 5_000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

export default function Index() {
  const router = useRouter();
  const { loading, session } = useAuth();
  const [showFallback, setShowFallback] = useState(false);
  const navigatedRef = useRef(false);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    const hideNativeSplash = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          void ExpoSplashScreen.hideAsync().catch(() => {});
        });
      });
    };

    const route = async () => {
      const initialUrl = await withTimeout(
        Linking.getInitialURL(),
        INITIAL_URL_TIMEOUT_MS,
        null
      );
      if (cancelled || navigatedRef.current) return;

      const pending = peekPendingResetPasswordUrl();
      const pendingIsReset = isSupabaseRecoveryLink(pending);
      const initialIsReset = isSupabaseRecoveryLink(initialUrl);

      navigatedRef.current = true;

      if (pending && pendingIsReset) {
        setPendingResetPasswordUrl(pending);
        router.replace("/(auth)/reset-password" as never);
      } else if (initialUrl && initialIsReset) {
        setPendingResetPasswordUrl(initialUrl);
        router.replace("/(auth)/reset-password" as never);
      } else {
        const activeSession = sessionRef.current;
        router.replace((activeSession?.user ? "/(tabs)" : "/(auth)/welcome") as never);
      }

      hideNativeSplash();
    };

    if (!loading && !navigatedRef.current) {
      void route();
    }

    const failsafe = setTimeout(() => {
      if (cancelled || navigatedRef.current) return;
      setShowFallback(true);
      hideNativeSplash();
    }, SPLASH_FAILSAFE_MS);

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, [loading, router]);

  return (
    <View style={styles.container}>
      {showFallback && (
        <>
          <Image
            source={require("../assets/images/launchpng.png")}
            style={styles.logo}
            resizeMode="contain"
            accessible
            accessibilityLabel="FridgeWise logo"
          />
          <ActivityIndicator color="#15803D" size="small" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SPLASH_BACKGROUND,
  },
  logo: {
    width: "64%",
    height: 180,
    marginBottom: 16,
  },
});
