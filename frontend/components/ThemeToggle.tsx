import { useEffect, useState } from "react";

import { FaRegMoon } from "react-icons/fa";
import { GoSun } from "react-icons/go";

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
    <span className="theme-toggle" onClick={toggleTheme} title="Theme">
      {theme === "dark" ? <GoSun /> : <FaRegMoon />}
    </span>
  )
}

export default ThemeToggle;
