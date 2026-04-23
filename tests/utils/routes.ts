export type AuditRoute = {
  name: string;
  path: string;
  slug: string;
  navLabel?: string;
  heading: RegExp;
  expectedPath?: string;
  expectedSearchParams?: Record<string, string>;
};

export const coreRoutes: AuditRoute[] = [
  {
    name: "Home",
    path: "/",
    slug: "home",
    navLabel: "Home",
    heading: /Daily Intelligence Briefing/i,
  },
  {
    name: "Dashboard",
    path: "/dashboard",
    slug: "dashboard",
    heading: /Daily Intelligence Briefing/i,
    expectedPath: "/",
  },
  {
    name: "History",
    path: "/history",
    slug: "history",
    navLabel: "History",
    heading: /briefing history/i,
  },
  {
    name: "Account",
    path: "/account",
    slug: "account",
    navLabel: "Account",
    heading: /sign in/i,
    expectedPath: "/login",
    expectedSearchParams: {
      redirectTo: "/account",
    },
  },
  {
    name: "Topics",
    path: "/topics",
    slug: "topics",
    heading: /sign in/i,
    expectedPath: "/login",
    expectedSearchParams: {
      redirectTo: "/account",
    },
  },
  {
    name: "Sources",
    path: "/sources",
    slug: "sources",
    heading: /sign in/i,
    expectedPath: "/login",
    expectedSearchParams: {
      redirectTo: "/account",
    },
  },
  {
    name: "Settings",
    path: "/settings",
    slug: "settings",
    heading: /sign in/i,
    expectedPath: "/login",
    expectedSearchParams: {
      redirectTo: "/account",
    },
  },
];

export const appShellRoutes = coreRoutes.filter((route) => Boolean(route.navLabel));
