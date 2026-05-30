// Fixed color scheme - always return light to prevent system dark mode interference
// The useColorScheme value is always either light or dark, but the built-in
// type suggests that it can be null.
export function useColorScheme(): "light" | "dark" {
  // Always return 'light' to prevent system dark mode from affecting app
  return "light";
}
