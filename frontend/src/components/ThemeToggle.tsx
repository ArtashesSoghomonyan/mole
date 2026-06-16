import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeToggle = () => {
    const getInitialTheme = (): Theme => {
        const storedTheme = window.localStorage.getItem("theme");

        if (storedTheme === "light" || storedTheme === "dark") {
            return storedTheme;
        } else {
            return "light";
        }
    }

    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        window.localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(currentTheme => currentTheme === "dark" ? "light" : "dark");
    }

    return (
        <span className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "☀️" : "🌑"}
        </span>
    )
}

export default ThemeToggle;
