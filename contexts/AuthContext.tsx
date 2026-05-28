import {
  clearRememberMePreference,
  REMEMBER_ME_STORAGE_KEY,
  setRememberMePreference,
} from "@/lib/authPreferences";
import { supabase, UserProfile } from "@/lib/supabase";
import { isNetworkRequestFailed } from "@/utils/networkError";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    options?: { rememberMe?: boolean }
  ) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ needsEmailVerification: boolean }>;
  signOut: () => Promise<void>;
  getUserProfile: (userIdOverride?: string) => Promise<UserProfile | null>;
  updateUserProfile: (
    data: Partial<UserProfile>
  ) => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Cold-start auth can be slow after device sleep, but startup should not block indefinitely. */
const AUTH_INIT_TIMEOUT_MS = 4_500;
const REMEMBER_ME_READ_TIMEOUT_MS = 2_000;

/** Stale or revoked refresh token in local storage — clear session instead of surfacing a red error loop. */
function isRefreshTokenDeadError(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  const code = (err.code ?? "").toLowerCase();
  return (
    msg.includes("invalid refresh token") ||
    msg.includes("refresh token not found") ||
    code === "refresh_token_not_found"
  );
}

async function readSessionOrClearStaleAuth(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (!error) return data.session ?? null;

  if (isRefreshTokenDeadError(error)) {
    await supabase.auth.signOut().catch(() => {});
    return null;
  }

  if (__DEV__) {
    console.warn("Auth getSession failed");
  }
  return data.session ?? null;
}

async function fetchUserProfileById(
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      if (__DEV__ && !isNetworkRequestFailed(error)) {
        console.error("Error fetching user profile");
      }
      return null;
    }

    return (data ?? null) as UserProfile | null;
  } catch (error) {
    if (__DEV__ && !isNetworkRequestFailed(error)) {
      console.error("Error in fetchUserProfileById");
    }
    return null;
  }
}

function readSessionWithinTimeout(ms: number): Promise<Session | null> {
  return Promise.race([
    readSessionOrClearStaleAuth(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("auth-init-timeout")), ms);
    }),
  ]);
}

function isAuthInitTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message === "auth-init-timeout";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data (pass user id when React state `user` is not updated yet)
  // Fetch profile: `.single()` errors with PGRST116 when no row exists; `.maybeSingle()` returns null.
  const getUserProfile = useCallback(
    async (userIdOverride?: string): Promise<UserProfile | null> => {
      const id = userIdOverride ?? user?.id;
      if (!id) return null;
      const profile = await fetchUserProfileById(id);
      setUserProfile(profile);
      return profile;
    },
    [user?.id]
  );

  // Update user profile data
  const updateUserProfile = async (
    data: Partial<UserProfile>
  ): Promise<UserProfile | null> => {
    try {
      if (!user) return null;

      // Remove id from data if present as it shouldn't be updated
      const { id, ...updateData } = data;

      const { data: updatedProfile, error } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        if (__DEV__ && !isNetworkRequestFailed(error)) {
          console.error("Error updating user profile");
        }
        throw error;
      }

      // Update the local state
      setUserProfile(updatedProfile as UserProfile);
      return updatedProfile as UserProfile;
    } catch (error) {
      if (__DEV__ && !isNetworkRequestFailed(error)) {
        console.error("Error in updateUserProfile");
      }
      throw error;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        let session = await readSessionWithinTimeout(AUTH_INIT_TIMEOUT_MS);

        const rememberRaw = await Promise.race([
          AsyncStorage.getItem(REMEMBER_ME_STORAGE_KEY),
          new Promise<string | null>((resolve) =>
            setTimeout(() => resolve(null), REMEMBER_ME_READ_TIMEOUT_MS)
          ),
        ]);

        if (session && rememberRaw === "false") {
          await supabase.auth.signOut();
          session = await readSessionOrClearStaleAuth();
        }

        if (cancelled) return;

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          void fetchUserProfileById(session.user.id).then((profile) => {
            if (!cancelled) setUserProfile(profile);
          });
        }
      } catch (error) {
        if (cancelled) return;
        if (__DEV__) {
          console.warn(
            isAuthInitTimeoutError(error) ? "Auth init timed out" : "Auth init failed"
          );
        }
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    void init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userId = session.user.id;
          setTimeout(() => {
            void fetchUserProfileById(userId).then((profile) => {
              if (!cancelled) setUserProfile(profile);
            });
          }, 0);
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
    options?: { rememberMe?: boolean }
  ) => {
    try {
      const rememberMe = options?.rememberMe !== false;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      setSession(data.session ?? null);
      setUser(data.user ?? data.session?.user ?? null);
      setLoading(false);

      const signedInUser = data.user ?? data.session?.user ?? null;
      if (signedInUser) {
        void fetchUserProfileById(signedInUser.id)
          .then((profile) => {
            setUserProfile(profile);
          })
          .catch(() => {});
      }

      await Promise.race([
        setRememberMePreference(rememberMe),
        new Promise<void>((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch (error: any) {
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ needsEmailVerification: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) throw error;

      // Supabase returns a user with no identities when the email
      // is already registered for an existing account.
      if (
        data?.user &&
        Array.isArray((data.user as any).identities) &&
        (data.user as any).identities.length === 0
      ) {
        throw new Error("An account with this email already exists.");
      }

      if (data?.user && fullName) {
        // Update user profile with full name
        await supabase
          .from("user_profiles")
          .update({ full_name: fullName })
          .eq("id", data.user.id);
      }

      // No session until the user confirms email (when confirmation is enabled in Supabase).
      return { needsEmailVerification: !data?.session };
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await clearRememberMePreference();
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        getUserProfile,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
