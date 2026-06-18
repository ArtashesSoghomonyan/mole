"use client";

import { useState } from "react";
import Link from "next/link";
import { AiOutlineMessage } from "react-icons/ai";
import { FaRegBell } from "react-icons/fa";
import { IoIosMenu } from "react-icons/io";

import "./Navbar.css";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

const Navbar = () => {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  if (loading) return <></>

  if (!user) {
    return <nav className="navbar">
      <div className="nav-logo">
        <Link href="/"><img src="/mole.png" alt="Mole" />mole</Link>
      </div>

      <div className={menuOpen ? "nav-menu open" : "nav-menu"}>
        <ul className="nav-links">
          <li><ThemeToggle /></li>
          <li><Link href="/register" title="Sign up">
            <input type="button" className="btn btn-filled" value="Sign up" />
          </Link></li>
        </ul>
      </div>

      <IoIosMenu className="menu-button" onClick={() => setMenuOpen(!menuOpen)} />
    </nav>;
  }

  return <nav className="navbar">
    <div className="nav-logo">
      <Link href="/"><img src="/mole.png" alt="Mole" />mole</Link>
    </div>

    <div className={menuOpen ? "nav-menu open" : "nav-menu"}>
      <div className="nav-search">
        <input type="text" placeholder="Search" />
      </div>

      <ul className="nav-links">
        <li><ThemeToggle /></li>
        <li><a href="#" title="Messages">
          <AiOutlineMessage />
        </a></li>
        <li><a href="#" title="Notifications">
          <FaRegBell />
        </a></li>
        <li><a href="#" className="profile-link" title="Profile">
          <img src={ user.profile.avatar
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${user.profile.avatar}/`
            : "/person.jpg" }
            alt="Profile" className="nav-avatar" />
        </a></li>
      </ul>
    </div>

    <IoIosMenu className="menu-button" onClick={() => setMenuOpen(!menuOpen)} />
  </nav>;
}

export default Navbar;
