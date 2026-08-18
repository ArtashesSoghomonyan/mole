"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { CircleNotch, MagnifyingGlass, X } from "@phosphor-icons/react";

import { SearchUser } from "@/types/auth";
import { mediaUrl } from "@/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchResult = SearchUser["user"];

const SearchBar = () => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestRef = useRef(0);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    searchRequestRef.current += 1;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      setShowResults(false);
      return;
    }

    const requestId = searchRequestRef.current;
    setLoading(true);
    setError(null);
    setShowResults(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get<SearchResult[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/users/search/`,
          {
            params: { search: trimmed },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (requestId === searchRequestRef.current) {
          setResults(response.data);
        }
      } catch (err) {
        console.error("Search failed:", err);
        if (requestId === searchRequestRef.current) {
          setError("Search failed. Please try again.");
          setResults([]);
        }
      } finally {
        if (requestId === searchRequestRef.current) {
          setLoading(false);
        }
      }
    }, 300);
  };

  const handleClear = () => {
    searchRequestRef.current += 1;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setQuery("");
    setResults([]);
    setShowResults(false);
    setError(null);
  };

  const handleResultClick = () => {
    searchRequestRef.current += 1;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setShowResults(false);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-sm" ref={containerRef}>
      <div className="relative">
        <MagnifyingGlass
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || error) {
              setShowResults(true);
            }
          }}
          className="h-9 rounded-full pr-9 pl-8"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full text-muted-foreground"
            onClick={handleClear}
            aria-label="Clear search"
            title="Clear search"
          >
            <X />
          </Button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full z-50 mt-1 max-h-100 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
          {loading && (
            <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <CircleNotch className="size-4 animate-spin" />
              Searching...
            </div>
          )}

          {error && <div className="px-3 py-4 text-center text-sm text-destructive">{error}</div>}

          {!loading && !error && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">No users found</div>
          )}

          {!loading &&
            !error &&
            results.map((user) => (
              <Link
                key={user.username}
                href={`/${user.username}`}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                onClick={handleResultClick}
              >
                <Avatar>
                  <AvatarImage src={mediaUrl(user.profile?.avatar)} alt={user.username} />
                  <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">@{user.username}</span>
                  {user.profile?.bio && (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{user.profile.bio}</span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {user.followers_count} {user.followers_count === 1 ? "follower" : "followers"}
                </span>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
