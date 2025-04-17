
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
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // After mounting, we can safely show the theme toggle
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "relative h-10 w-10 rounded-full overflow-hidden border-primary/20 transition-all duration-500",
            isHovered && "shadow-[0_0_15px_rgba(156,163,175,0.5)] scale-110",
            isOpen && "shadow-[0_0_20px_rgba(156,163,175,0.6)] scale-110 border-primary/30",
            theme === "dark" ? "border-primary/10 bg-slate-900" : "bg-white"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Sun className={cn(
            "h-[1.3rem] w-[1.3rem] absolute inset-0 m-auto rotate-0 scale-100 transition-all duration-500",
            theme === "dark" && "rotate-90 scale-0"
          )} />
          <Moon className={cn(
            "h-[1.3rem] w-[1.3rem] absolute inset-0 m-auto rotate-90 scale-0 transition-all duration-500",
            theme === "dark" && "rotate-0 scale-100"
          )} />
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 transition-opacity duration-500",
            theme === "dark" ? "from-blue-900/30 to-purple-900/30" : "from-blue-500/20 to-purple-500/20",
            (isHovered || isOpen) && "opacity-100"
          )} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="animate-in slide-in-from-top-2 duration-300 glassmorphism border-primary/10 shadow-lg backdrop-blur-xl bg-background/70"
      >
        <div className="p-2 space-y-4">
          <div className="flex flex-col space-y-1.5 px-2">
            <p className="text-xs font-medium text-muted-foreground">Choose theme</p>
          </div>
          
          <div className="flex flex-col space-y-1">
            <DropdownMenuItem 
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-300",
                theme === "light" ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
              )} 
              onClick={() => setTheme("light")}
            >
              <div className="p-1 rounded-full bg-primary/10">
                <Sun className={cn("h-4 w-4", theme === "light" ? "text-primary" : "text-foreground")} />
              </div>
              <span>Light</span>
              {theme === "light" && <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-300",
                theme === "dark" ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
              )} 
              onClick={() => setTheme("dark")}
            >
              <div className="p-1 rounded-full bg-primary/10">
                <Moon className={cn("h-4 w-4", theme === "dark" ? "text-primary" : "text-foreground")} />
              </div>
              <span>Dark</span>
              {theme === "dark" && <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-300",
                theme === "system" ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
              )} 
              onClick={() => setTheme("system")}
            >
              <div className="p-1 rounded-full bg-primary/10">
                <Laptop className={cn("h-4 w-4", theme === "system" ? "text-primary" : "text-foreground")} />
              </div>
              <span>System</span>
              {theme === "system" && <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>}
            </DropdownMenuItem>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
