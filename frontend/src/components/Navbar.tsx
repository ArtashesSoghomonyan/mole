"use client";

import "./Navbar.css";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

const Navbar = () => {
  const { user, loading } = useAuth();

  if (loading) return <></>

  if (!user) {
    return <>
      Login right now!
      <ThemeToggle />
    </>
  }

  return <>
    Hello {user.username}
    <ThemeToggle />
  </>
}

export default Navbar;
