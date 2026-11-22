import * as React from "react";

export type Theme = "light" | "dark" | "system" | string;

export interface UseThemeProps {
  themes: string[];
  forcedTheme?: string;
  setTheme: (theme: string | ((prev: string) => string)) => void;
  theme?: string;
  resolvedTheme?: "light" | "dark";
  systemTheme?: "light" | "dark";
}

export interface ThemeProviderProps {
  children?: React.ReactNode;
  themes?: string[];
  forcedTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  enableColorScheme?: boolean;
  storageKey?: string;
  defaultTheme?: string;
  attribute?: string | string[];
  value?: Record<string, string>;
  nonce?: string;
  scriptProps?: Record<string, any>;
}

const ThemeContext = React.createContext<UseThemeProps | undefined>(undefined);

const MEDIA = "(prefers-color-scheme: dark)";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(MEDIA).matches ? "dark" : "light";
}

export function ThemeProvider({
  children,
  themes = ["light", "dark", "system"],
  forcedTheme,
  enableSystem = true,
  disableTransitionOnChange = false,
  enableColorScheme = true,
  storageKey = "theme",
  defaultTheme = "system",
  attribute = "class",
  value,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<string>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      return localStorage.getItem(storageKey) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [systemTheme, setSystemTheme] = React.useState<"light" | "dark">(getSystemTheme);

  // Keep systemTheme updated
  React.useEffect(() => {
    if (!enableSystem) return;
    const media = window.matchMedia(MEDIA);
    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [enableSystem]);

  const effectiveTheme = forcedTheme || theme;
  const resolvedTheme: "light" | "dark" =
    effectiveTheme === "system" ? systemTheme : effectiveTheme === "dark" ? "dark" : "light";

  // Apply to DOM without rendering any script tag
  React.useEffect(() => {
    const root = document.documentElement;

    let cleanupTransition: (() => void) | undefined;
    if (disableTransitionOnChange) {
      const css = document.createElement("style");
      css.appendChild(
        document.createTextNode(
          "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"
        )
      );
      document.head.appendChild(css);
      cleanupTransition = () => {
        window.getComputedStyle(document.body);
        setTimeout(() => {
          document.head.removeChild(css);
        }, 1);
      };
    }

    const targetVal = value?.[resolvedTheme] || resolvedTheme;

    const attributes = Array.isArray(attribute) ? attribute : [attribute];
    for (const attr of attributes) {
      if (attr === "class") {
        root.classList.remove("light", "dark");
        if (targetVal) {
          root.classList.add(targetVal);
        }
      } else if (attr.startsWith("data-")) {
        if (targetVal) {
          root.setAttribute(attr, targetVal);
        } else {
          root.removeAttribute(attr);
        }
      }
    }

    if (enableColorScheme) {
      root.style.colorScheme = resolvedTheme;
    }

    cleanupTransition?.();
  }, [resolvedTheme, attribute, value, enableColorScheme, disableTransitionOnChange]);

  const setTheme = React.useCallback(
    (newTheme: string | ((prev: string) => string)) => {
      setThemeState((prev) => {
        const next = typeof newTheme === "function" ? newTheme(prev) : newTheme;
        try {
          localStorage.setItem(storageKey, next);
        } catch {
          // Ignore localStorage errors
        }
        return next;
      });
    },
    [storageKey]
  );

  // Sync across tabs
  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  const contextValue = React.useMemo<UseThemeProps>(
    () => ({
      themes: enableSystem ? [...themes.filter((t) => t !== "system"), "system"] : themes,
      forcedTheme,
      setTheme,
      theme: effectiveTheme,
      resolvedTheme,
      systemTheme: enableSystem ? systemTheme : undefined,
    }),
    [themes, forcedTheme, setTheme, effectiveTheme, resolvedTheme, systemTheme, enableSystem]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme(): UseThemeProps {
  const context = React.useContext(ThemeContext);
  if (!context) {
    return {
      themes: ["light", "dark", "system"],
      setTheme: () => {},
      theme: "system",
      resolvedTheme: "light",
      systemTheme: "light",
    };
  }
  return context;
}
