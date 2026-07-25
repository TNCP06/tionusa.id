"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

// Blog lives on its own subdomain in prod (Phase 2) or /blog on localhost preview.
const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL || "/blog";

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const close = () => setMenuOpen(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      if (currentScrollY < 80) {
        setVisible(true);
      } else {
        if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 8) {
          setVisible(false);
        } else if (lastScrollY - currentScrollY > 8) {
          setVisible(true);
        }
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        className={`site-nav${scrolled ? " site-nav--scrolled" : ""}${
          !visible && !menuOpen ? " site-nav--hidden" : ""
        }`}
      >
        <div className="nav-inner wrap">
          <div className="nav-brand-group">
            <Link className="nav-brand" href="/" onClick={close}>
              TNCP
            </Link>
            <a
              className="nav-github"
              href="https://github.com/TNCP06"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.7 5.38-5.27 5.67.42.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .3.21.66.8.55A10.99 10.99 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
              </svg>
            </a>
          </div>

          {/* Desktop Centered Navigation Links */}
          <div className="nav-center-links desktop-only">
            <Link className="nav-link" href="/#about">
              About
            </Link>
            <Link
              className={`nav-link${isActive("/portfolio") ? " nav-link--active" : ""}`}
              href="/portfolio"
            >
              Portfolio
            </Link>
            <Link
              className={`nav-link${isActive("/gallery") ? " nav-link--active" : ""}`}
              href="/gallery"
            >
              Gallery
            </Link>
            <Link
              className={`nav-link${isActive("/stack") ? " nav-link--active" : ""}`}
              href="/stack"
            >
              Tech Stack
            </Link>
            {blogUrl ? (
              <a className="nav-link" href={blogUrl}>
                Blog
              </a>
            ) : null}
          </div>

          {/* Desktop Right Actions */}
          <div className="nav-right-actions desktop-only">
            <Link className="nav-cta" href="/#contact">
              Contact
            </Link>
            <ThemeToggle />
          </div>

          {/* Mobile Right Controls */}
          <div className="mobile-controls">
            <ThemeToggle />
            <button
              className="nav-hamburger"
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
          </div>
        </div>
      </nav>

      {/* Premium Mobile Overlay Drawer */}
      {/* inert, not just pointer-events:none — otherwise Tab walks into the hidden drawer */}
      <div
        className={`mobile-menu-overlay${menuOpen ? " mobile-menu-overlay--open" : ""}`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="mobile-menu-content wrap">
          <div className="mobile-menu-head">
            <span className="mono mobile-menu-tag">INDEX // NAVIGATION</span>
            <button
              className="mobile-menu-close"
              onClick={close}
              type="button"
              aria-label="Close menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <ul className="mobile-nav-list">
            <li>
              <Link
                className="mobile-nav-link"
                href="/#about"
                onClick={close}
              >
                <span className="mono nav-num">01</span>
                <span className="nav-text">About</span>
                <span className="nav-arrow">→</span>
              </Link>
            </li>
            <li>
              <Link
                className={`mobile-nav-link${isActive("/portfolio") ? " active" : ""}`}
                href="/portfolio"
                onClick={close}
              >
                <span className="mono nav-num">02</span>
                <span className="nav-text">Portfolio</span>
                <span className="nav-arrow">→</span>
              </Link>
            </li>
            <li>
              <Link
                className={`mobile-nav-link${isActive("/gallery") ? " active" : ""}`}
                href="/gallery"
                onClick={close}
              >
                <span className="mono nav-num">03</span>
                <span className="nav-text">Gallery</span>
                <span className="nav-arrow">→</span>
              </Link>
            </li>
            <li>
              <Link
                className={`mobile-nav-link${isActive("/stack") ? " active" : ""}`}
                href="/stack"
                onClick={close}
              >
                <span className="mono nav-num">04</span>
                <span className="nav-text">Tech Stack</span>
                <span className="nav-arrow">→</span>
              </Link>
            </li>
            {blogUrl ? (
              <li>
                <a
                  className="mobile-nav-link"
                  href={blogUrl}
                  onClick={close}
                >
                  <span className="mono nav-num">05</span>
                  <span className="nav-text">Blog</span>
                  <span className="nav-arrow">↗</span>
                </a>
              </li>
            ) : null}
          </ul>

          <div className="mobile-menu-footer">
            <Link className="mobile-cta-btn" href="/#contact" onClick={close}>
              Get in Touch / Contact →
            </Link>
            <div className="mobile-footer-meta">
              <a
                className="mobile-meta-link"
                href="https://github.com/TNCP06"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.7 5.38-5.27 5.67.42.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .3.21.66.8.55A10.99 10.99 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
                </svg>
                github.com/TNCP06
              </a>
              <span>TNCP &copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
