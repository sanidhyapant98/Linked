import { useEffect, useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import { HealthBadge } from "./components/HealthBadge";
import { DashboardSection } from "./pages/Dashboard";
import { Detail, NotFound } from "./pages/Detail";
import { Home } from "./pages/Home";

function Shell() {
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(t);
  }, [notice]);
  const notify = (m: string) => setNotice(m);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-full focus:bg-pine focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <header className="border-b-[1.5px] border-pine">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Linked home">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine text-lg text-paper"
            >
              ⛓
            </span>
            <span className="display text-[26px] font-bold">Linked</span>
          </Link>
          <nav
            aria-label="Primary"
            className="ml-auto flex items-center gap-1 text-[15px] font-medium"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-full px-4 py-2 ${isActive ? "bg-pine text-paper" : "text-pine/70 hover:text-pine"}`
              }
            >
              Shorten
            </NavLink>
            <NavLink
              to="/links"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 ${isActive ? "bg-pine text-paper" : "text-pine/70 hover:text-pine"}`
              }
            >
              Ledger
            </NavLink>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20">
        <Routes>
          <Route path="/" element={<Home onNotice={notify} />} />
          <Route
            path="/links"
            element={
              <div className="pt-10">
                <DashboardSection onNotice={notify} />
              </div>
            }
          />
          <Route path="/links/:id" element={<Detail onNotice={notify} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="h-[72px] shrink-0 border-t border-line">
        <div className="mx-auto flex h-full max-w-5xl flex-wrap items-center gap-3 px-5 text-sm text-pine/60">
          <span>Linked shortens and remembers. Paste, share, count the taps.</span>
          <span className="ml-auto flex items-center gap-3">
            <span className="hidden sm:inline">
              Short links open in a new tab, never via fetch.
            </span>
            <HealthBadge />
          </span>
        </div>
      </footer>

      {notice && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border-[1.5px] border-pine bg-pine px-5 py-2.5 text-sm font-medium text-paper shadow-lg"
        >
          {notice}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
