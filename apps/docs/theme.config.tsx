import { Footer, Navbar } from "nextra-theme-docs";
import Link from "next/link";
import pkg from "./package.json";

const currentYear = new Date().getFullYear();
const projectTitle = pkg.seo?.title ?? pkg.name ?? "Docs";
const projectUrl = pkg.seo?.og?.url ?? "https://example.com";

const config = {
  docsRepositoryBase: "https://github.com/voh/admin/blob/main/apps/docs",
  nextThemes: {
    attribute: "class",
    defaultTheme: "system",
    disableTransitionOnChange: true,
    storageKey: "voh-docs-theme",
  },
  navigation: true,
  toc: {
    float: true,
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  navbar: (
    <Navbar
      logo={
        <span className="font-semibold tracking-tight text-sm sm:text-base">
          {projectTitle}
        </span>
      }
      projectLink={projectUrl}
    >
      <Link
        href={projectUrl}
        className="hidden text-sm text-foreground/80 transition-colors hover:text-foreground sm:inline-flex"
      >
        Visit Site
      </Link>
    </Navbar>
  ),
  footer: (
    <Footer>
      <span className="text-sm text-muted-foreground">
        © {currentYear} {projectTitle}
      </span>
    </Footer>
  ),
} as const;

export default config;
