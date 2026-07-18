import type { PrismaClient } from "@prisma/client";
import { supportOperationsRoles, type CurrentUser } from "@alwaystrack/shared";

export interface GlobalSearchInput {
  query?: string;
  limit?: number;
}

export interface GlobalSearchResult {
  type: "campaign" | "wiki" | "faq" | "announcement" | "script";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  meta?: string | null;
}

function cleanQuery(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length >= 2 ? trimmed.slice(0, 80) : undefined;
}

function cleanLimit(value: unknown) {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : typeof value === "number" ? value : Number.NaN;
  return Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), 8) : 5;
}

export function parseGlobalSearchInput(query: Record<string, unknown>): GlobalSearchInput {
  return {
    query: cleanQuery(query.q),
    limit: cleanLimit(query.limit)
  };
}

function containsQuery(fields: string[], query: string) {
  return fields.map((field) => ({ [field]: { contains: query } }));
}

/** Lightweight scoped global search across support operations and knowledge. */
export async function globalSearch(prisma: PrismaClient, actor: CurrentUser, input: GlobalSearchInput) {
  const query = input.query;
  const limit = input.limit ?? 5;
  if (!query) {
    return { query: query ?? "", groups: [], total: 0 };
  }
  const canSearchSupport = (supportOperationsRoles as readonly string[]).includes(actor.role);
  const now = new Date();

  const [campaigns, wikiPages, faqThreads, announcements, scripts] = await Promise.all([
    canSearchSupport
      ? prisma.supportCampaign.findMany({
          where: {
            organizationId: actor.organizationId,
            OR: actor.role === "ADMIN" || actor.role === "GESTOR"
              ? containsQuery(["name", "description", "status"], query)
              : [{
                  AND: [
                    {
                      OR: [
                        { scopeType: "ORGANIZATION" },
                        { userId: actor.id },
                        {
                          team: {
                            memberships: {
                              some: {
                                userId: actor.id,
                                validFrom: { lte: now },
                                OR: [{ validTo: null }, { validTo: { gte: now } }]
                              }
                            }
                          }
                        }
                      ]
                    },
                    { OR: containsQuery(["name", "description", "status"], query) }
                  ]
                }],
          },
          include: { team: true },
          orderBy: [{ status: "asc" }, { startsAt: "desc" }],
          take: limit
        })
      : Promise.resolve([]),
    prisma.wikiPage.findMany({
      where: {
        organizationId: actor.organizationId,
        active: actor.role === "ADMIN" ? undefined : true,
        OR: containsQuery(["title", "content", "slug", "tagsJson"], query)
      },
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
      take: limit
    }),
    prisma.faqThread.findMany({
      where: {
        organizationId: actor.organizationId,
        OR: containsQuery(["title", "body", "tagsJson", "status"], query)
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: limit
    }),
    prisma.announcement.findMany({
      where: {
        organizationId: actor.organizationId,
        status: "PUBLISHED",
        targetRolesJson: { contains: `"${actor.role}"` },
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
          { OR: containsQuery(["title", "summary", "content", "tagsJson", "priority"], query) }
        ]
      },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: limit
    }),
    prisma.operationalScript.findMany({
      where: {
        organizationId: actor.organizationId,
        status: "VALIDATED",
        OR: containsQuery(["title", "body", "tagsJson", "channel"], query)
      },
      include: { category: true },
      orderBy: [{ usageCount: "desc" }, { updatedAt: "desc" }],
      take: limit
    })
  ]);

  const groups = [
    {
      key: "campaigns",
      label: "Campanhas SAC",
      items: campaigns.map(
        (item): GlobalSearchResult => ({
          type: "campaign",
          id: item.id,
          title: item.name,
          subtitle: `${item.status} · ${item.team?.name ?? "Todo o SAC"}`,
          href: "/campanhas",
          meta: item.description
        })
      )
    },
    {
      key: "wiki",
      label: "Wiki",
      items: wikiPages.map(
        (item): GlobalSearchResult => ({
          type: "wiki",
          id: item.id,
          title: item.title,
          subtitle: item.active ? "Página ativa" : "Página arquivada",
          href: `/wiki/${item.slug}`,
          meta: item.slug
        })
      )
    },
    {
      key: "faq",
      label: "FAQ",
      items: faqThreads.map(
        (item): GlobalSearchResult => ({
          type: "faq",
          id: item.id,
          title: item.title,
          subtitle: item.status,
          href: "/faq",
          meta: item.body
        })
      )
    },
    {
      key: "announcements",
      label: "Avisos",
      items: announcements.map(
        (item): GlobalSearchResult => ({
          type: "announcement",
          id: item.id,
          title: item.title,
          subtitle: `${item.priority} · Aviso interno`,
          href: `/avisos/${item.slug}`,
          meta: item.summary
        })
      )
    },
    {
      key: "scripts",
      label: "Scriptoteca",
      items: scripts.map(
        (item): GlobalSearchResult => ({
          type: "script",
          id: item.id,
          title: item.title,
          subtitle: `${item.category.name} · ${item.channel}`,
          href: "/scriptoteca",
          meta: item.tagsJson
        })
      )
    }
  ].filter((group) => group.items.length > 0);

  return {
    query,
    groups,
    total: groups.reduce((sum, group) => sum + group.items.length, 0)
  };
}
