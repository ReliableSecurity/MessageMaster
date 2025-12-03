import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(resolvedTheme === "light" ? "dark" : "light");
    } else {
      setTheme(theme === "light" ? "dark" : "light");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
    >
      {resolvedTheme === "light" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </Button>
  );
}
