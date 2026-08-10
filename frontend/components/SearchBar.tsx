"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { FiSearch, FiX } from "react-icons/fi";
import { SearchUser } from "@/types/auth";

import "./SearchBar.css";

const SearchBar = () => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get<SearchUser[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/users/search/`,
          {
            params: { search: trimmed },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        setResults(response.data);
        setShowResults(true);
      } catch (err) {
        console.error("Search failed:", err);
        setError("Search failed. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setError(null);
  };

  const handleResultClick = () => {
    setShowResults(false);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="search-container" ref={containerRef}>
      <div className="search-input-wrapper">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || error) {
              setShowResults(true);
            }
          }}
        />
        {query && (
          <button className="search-clear" onClick={handleClear} title="Clear search">
            <FiX />
          </button>
        )}
      </div>

      {showResults && (
        <div className="search-results">
          {loading && <div className="search-loading">Searching...</div>}

          {error && <div className="search-error">{error}</div>}

          {!loading && !error && results.length === 0 && query.trim().length >= 2 && (
            <div className="search-no-results">No users found</div>
          )}

          {!loading &&
            !error &&
            results.map((user) => (
              <Link
                key={user.username}
                href={`/${user.username}`}
                className="search-result-item"
                onClick={handleResultClick}
              >
                <img
                  src={user.profile?.avatar || "/person.jpg"}
                  alt={user.username}
                  className="search-result-avatar"
                />
                <div className="search-result-info">
                  <span className="search-result-name">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="search-result-username">@{user.username}</span>
                  {user.profile?.bio && (
                    <span className="search-result-bio">{user.profile.bio}</span>
                  )}
                </div>
                <span className="search-result-followers">
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
