"use client"

import { useTheme } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Terminal } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "terminal", icon: Terminal, label: "Terminal" },
  ] as const

  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 terminal:bg-gray-900 rounded-lg">
      {themes.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant={theme === value ? "default" : "ghost"}
          size="sm"
          onClick={() => setTheme(value)}
          className={`
            px-3 py-1 text-xs
            ${
              theme === value
                ? "bg-white dark:bg-gray-700 terminal:bg-gray-700 shadow-sm"
                : "hover:bg-gray-200 dark:hover:bg-gray-700 terminal:hover:bg-gray-800"
            }
          `}
        >
          <Icon className="w-3 h-3 mr-1" />
          {label}
        </Button>
      ))}
    </div>
  )
}
