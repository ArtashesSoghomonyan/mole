"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AiOutlineMessage } from "react-icons/ai";
import { FaRegBell } from "react-icons/fa";
import { IoIosMenu } from "react-icons/io";
import { FiLogOut, FiUser, FiSettings } from "react-icons/fi";

import "./Navbar.css";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <li>
          <div className="profile-menu-container" ref={profileMenuRef}>
            <button
              className="profile-btn"
              title="Profile"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <img src={ user.profile.avatar
                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${user.profile.avatar}/`
                : "/person.jpg" }
                alt="Profile" className="nav-avatar" />
            </button>

            {profileMenuOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <img src={ user.profile.avatar
                    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${user.profile.avatar}/`
                    : "/person.jpg" }
                    alt="Profile" className="dropdown-avatar" />
                  <div className="dropdown-user-info">
                    <span className="dropdown-username">{user.username}</span>
                    <span className="dropdown-email">{user.email}</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <Link href={`/${user.username}`} className="dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                  <FiUser /> Profile
                </Link>
                <Link href="/settings" className="dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                  <FiSettings /> Settings
                </Link>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item dropdown-logout" onClick={() => { setProfileMenuOpen(false); logout(); }}>
                  <FiLogOut /> Log Out
                </button>
              </div>
            )}
          </div>
        </li>
      </ul>
    </div>

    <IoIosMenu className="menu-button" onClick={() => setMenuOpen(!menuOpen)} />
  </nav>;
}

export default Navbar;
