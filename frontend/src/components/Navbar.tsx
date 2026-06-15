"use client";

import "./Navbar.css";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const { user, loading } = useAuth();

  if (loading) return <></>

  if (!user) {
    return <h1>Login right now!</h1>
  }

  return <h1>Hello {user.username}</h1>
}

export default Navbar;
