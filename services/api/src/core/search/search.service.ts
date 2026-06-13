import type { Prisma, PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";

export interface GlobalSearchInput {
  query?: string;
  limit?: number;
}

export interface GlobalSearchResult {
  type: "note" | "seller" | "campaign" | "wiki" | "faq" | "announcement";
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

function sellerScopeWhere(actor: CurrentUser): Prisma.SellerProfileWhereInput {
  if (["ADMIN", "GESTOR", "SAC", "FINANCEIRO"].includes(actor.role)) return { organizationId: actor.organizationId };
  if (actor.role === "VENDEDOR") return { organizationId: actor.organizationId, userId: actor.id };
  if (actor.role === "SUPERVISOR") return { organizationId: actor.organizationId, salesGroup: { supervisorId: actor.id } };
  return { organizationId: "__forbidden__" };
}

function salesDocumentScopeWhere(actor: CurrentUser): Prisma.SalesDocumentWhereInput {
  return { organizationId: actor.organizationId, sellerProfile: sellerScopeWhere(actor) };
}

function campaignScopeWhere(actor: CurrentUser): Prisma.SalesCampaignWhereInput {
  return {
    organizationId: actor.organizationId,
    salesGroup: actor.role === "SUPERVISOR" ? { supervisorId: actor.id } : undefined
  };
}

function containsQuery(fields: string[], query: string) {
  return fields.map((field) => ({ [field]: { contains: query } }));
}

/** Lightweight scoped global search across the commercial and knowledge domains. */
export async function globalSearch(prisma: PrismaClient, actor: CurrentUser, input: GlobalSearchInput) {
  const query = input.query;
  const limit = input.limit ?? 5;
  if (!query) {
    return { query: query ?? "", groups: [], total: 0 };
  }

  const [notes, sellers, campaigns, wikiPages, faqThreads, announcements] = await Promise.all([
    prisma.salesDocument.findMany({
      where: {
        ...salesDocumentScopeWhere(actor),
        OR: containsQuery(["fileName", "invoiceNumber", "accessKey", "issuerName", "buyerName"], query)
      },
      include: { sellerProfile: { include: { salesGroup: true } } },
      orderBy: { createdAt: "desc" },
      take: limit
    }),
    prisma.sellerProfile.findMany({
      where: {
        ...sellerScopeWhere(actor),
        OR: containsQuery(["displayName", "code", "email", "document"], query)
      },
      include: { salesGroup: true },
      orderBy: { displayName: "asc" },
      take: limit
    }),
    prisma.salesCampaign.findMany({
      where: {
        ...campaignScopeWhere(actor),
        OR: containsQuery(["name", "description", "status"], query)
      },
      include: { salesGroup: true },
      orderBy: [{ status: "asc" }, { startsAt: "desc" }],
      take: limit
    }),
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
    })
  ]);

  const groups = [
    {
      key: "notes",
      label: "Notas",
      items: notes.map(
        (item): GlobalSearchResult => ({
          type: "note",
          id: item.id,
          title: item.invoiceNumber ? `NF ${item.invoiceNumber}` : item.fileName,
          subtitle: `${item.sellerProfile.displayName} · ${item.status}`,
          href: "/notas",
          meta: item.totalAmountCents !== null ? `R$ ${(item.totalAmountCents / 100).toFixed(2)}` : item.fileName
        })
      )
    },
    {
      key: "sellers",
      label: "Vendedores",
      items: sellers.map(
        (item): GlobalSearchResult => ({
          type: "seller",
          id: item.id,
          title: item.displayName,
          subtitle: item.salesGroup?.name ?? "Sem grupo",
          href: "/ranking",
          meta: item.code
        })
      )
    },
    {
      key: "campaigns",
      label: "Campanhas",
      items: campaigns.map(
        (item): GlobalSearchResult => ({
          type: "campaign",
          id: item.id,
          title: item.name,
          subtitle: `${item.status} · ${item.salesGroup?.name ?? "Todos"}`,
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
          type: "announcement",
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
          type: "faq",
          id: item.id,
          title: item.title,
          subtitle: `${item.priority} · Aviso interno`,
          href: `/avisos/${item.slug}`,
          meta: item.summary
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
