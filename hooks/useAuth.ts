"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Role } from "@/types";

interface AuthState {
  user: User | null;
  role: Role | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, role: null, loading: false });
        return;
      }

      const tokenResult = await user.getIdTokenResult();
      const role = (tokenResult.claims["role"] as Role) ?? null;
      setState({ user, role, loading: false });
    });

    return unsubscribe;
  }, []);

  return state;
}
