"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BellIcon,
  ChatsIcon,
  GearFineIcon,
  ListIcon,
  PlusCircleIcon,
  SignOutIcon,
  UserIcon,
} from "@phosphor-icons/react";

import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import SearchBar from "@/components/SearchBar";
import { mediaUrl } from "@/utils";

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState<boolean>(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const iconButtonClass = "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const menuItemClass = "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

  if (loading) return null;

  if (!user) {
    return (
      <nav className="sticky top-0 z-40 flex h-16 items-center border-b border-border/80 bg-background/90 px-4 shadow-sm backdrop-blur-xl md:px-6">
        <Link href="/" className="text-xl font-bold text-foreground transition-colors hover:text-primary font-mono tracking-wider">
          mole
        </Link>

        <div className={`${menuOpen ? "flex" : "hidden"} absolute top-full right-4 left-4 mt-2 flex-col gap-3 rounded-xl border border-border bg-popover p-3 shadow-lg md:static md:ml-auto md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
          <ThemeToggle />
          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign up
          </Link>
        </div>

        <button
          type="button"
          className={`${iconButtonClass} ml-auto md:hidden`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <ListIcon className="size-5" />
        </button>
      </nav>
    );
  }

  const avatarSource = mediaUrl(user.profile.avatar);

  return (
    <nav className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border/80 bg-background/90 px-4 shadow-sm backdrop-blur-xl md:px-6">
      <Link href="/" className="shrink-0 text-xl font-bold text-foreground transition-colors hover:text-primary font-mono tracking-wider">
        mole
      </Link>

      <div className="hidden flex-1 justify-center md:flex">
        <SearchBar />
      </div>

      <div className={`${menuOpen ? "flex" : "hidden"} absolute top-full right-4 left-4 mt-2 flex-col gap-2 rounded-xl border border-border bg-popover p-3 shadow-lg md:static md:ml-auto md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
        <div className="md:hidden"><SearchBar /></div>
        <ThemeToggle />

        <div className="relative" ref={createMenuRef}>
          <button type="button" className={iconButtonClass} title="Create post" onClick={() => setCreateMenuOpen(!createMenuOpen)}>
            <PlusCircleIcon className="size-5" />
          </button>
          {createMenuOpen && (
            <div className="absolute top-full right-0 z-50 mt-2 w-52 rounded-lg border border-border bg-popover p-1 shadow-lg">
              <Link href="/new/image" className={menuItemClass} onClick={() => setCreateMenuOpen(false)}>Create image post</Link>
              <Link href="/new/say" className={menuItemClass} onClick={() => setCreateMenuOpen(false)}>Create text post</Link>
            </div>
          )}
        </div>

        <Link href="/chat" title="Messages" className={iconButtonClass} onClick={() => setMenuOpen(false)}>
          <ChatsIcon className="size-5" />
        </Link>
        <a href="#" title="Notifications" className={iconButtonClass}>
          <BellIcon className="size-5" />
        </a>

        <div className="relative" ref={profileMenuRef}>
          <button type="button" className="rounded-full outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring" title="Profile" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
            <img src={avatarSource} alt="Profile" className="size-9 rounded-full border-2 border-primary/50 object-cover" />
          </button>
          {profileMenuOpen && (
            <div className="absolute top-full right-0 z-50 mt-2 w-60 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
              <div className="flex items-center gap-3 px-3 py-2">
                <img src={avatarSource} alt="" className="size-9 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="my-1 h-px bg-border" />
              <Link href={`/${user.username}`} className={menuItemClass} onClick={() => setProfileMenuOpen(false)}><UserIcon className="size-4" />Profile</Link>
              <Link href="/settings" className={menuItemClass} onClick={() => setProfileMenuOpen(false)}><GearFineIcon className="size-4" />Settings</Link>
              <div className="my-1 h-px bg-border" />
              <button type="button" className={`${menuItemClass} text-destructive hover:text-destructive`} onClick={() => { setProfileMenuOpen(false); logout(); }}><SignOutIcon className="size-4" />Log out</button>
            </div>
          )}
        </div>
      </div>

      <button type="button" className={`${iconButtonClass} ml-auto md:hidden`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
        <ListIcon className="size-5" />
      </button>
    </nav>
  );
}

export default Navbar;
