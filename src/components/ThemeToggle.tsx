
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // After mounting, we can safely show the theme toggle
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "relative h-9 w-9 rounded-full overflow-hidden border-primary/20 transition-all duration-500",
            isHovered && "shadow-[0_0_15px_rgba(156,163,175,0.4)] scale-110",
            theme === "dark" && "border-primary/10 bg-slate-900"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Sun className={cn(
            "h-[1.3rem] w-[1.3rem] rotate-0 scale-100 transition-all duration-300",
            theme === "dark" && "rotate-90 scale-0"
          )} />
          <Moon className={cn(
            "absolute h-[1.3rem] w-[1.3rem] rotate-90 scale-0 transition-all duration-300",
            theme === "dark" && "rotate-0 scale-100"
          )} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="animate-in slide-in-from-top-2 duration-200 glassmorphism">
        <div className="p-2 space-y-4">
          <div className="flex flex-col space-y-1.5 px-2">
            <p className="text-xs font-medium text-muted-foreground">Choose theme</p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <DropdownMenuItem 
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all duration-200",
                theme === "light" && "bg-primary/10 text-primary"
              )} 
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4" />
              <span>Light</span>
              {theme === "light" && <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all duration-200",
                theme === "dark" && "bg-primary/10 text-primary"
              )} 
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4" />
              <span>Dark</span>
              {theme === "dark" && <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all duration-200",
                theme === "system" && "bg-primary/10 text-primary"
              )} 
              onClick={() => setTheme("system")}
            >
              <Laptop className="h-4 w-4" />
              <span>System</span>
              {theme === "system" && <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>}
            </DropdownMenuItem>
          </div>
          
          <div className="pt-2 border-t border-border/10">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-muted-foreground">Dark mode</span>
              <Switch 
                checked={theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)} 
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                className="transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
