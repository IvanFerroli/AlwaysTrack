import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { hashPassword } from "../src/core/auth/password.js";
import { hashUploadToken } from "../src/core/documents/upload-tokens.service.js";

process.env.DATABASE_URL ??= "file:./dev.db";

const prisma = new PrismaClient();
const now = new Date();
const enableLegacySylembra = process.env.ENABLE_LEGACY_SYLEMBRA === "true";

function addDays(days: number) {
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function daysAgo(days: number) {
  return addDays(-days);
}

function seedSecret(envKey: string) {
  return process.env[envKey]?.trim() || randomBytes(12).toString("base64url");
}

function seedText(envKey: string, fallback: string) {
  return process.env[envKey]?.trim() || fallback;
}

async function ensureDocument(input: {
  professionalId: string;
  licenseId: string;
  fileKey: string;
  fileName: string;
  status: string;
  validatedById?: string;
  validatedAt?: Date;
  rejectionReason?: string;
}) {
  const existing = await prisma.document.findFirst({ where: { fileKey: input.fileKey } });
  if (existing) {
    return prisma.document.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        validatedById: input.validatedById,
        validatedAt: input.validatedAt,
        rejectionReason: input.rejectionReason
      }
    });
  }

  return prisma.document.create({
    data: {
      professionalId: input.professionalId,
      licenseId: input.licenseId,
      fileKey: input.fileKey,
      fileName: input.fileName,
      mimeType: "application/pdf",
      size: 128000,
      status: input.status,
      validatedById: input.validatedById,
      validatedAt: input.validatedAt,
      rejectionReason: input.rejectionReason
    }
  });
}

async function ensureNotificationJob(input: {
  organizationId: string;
  professionalId: string;
  licenseId: string;
  notificationRuleId: string;
  periodKey: string;
  dedupeKey: string;
  recipientPhone: string | null;
  recipientEmail: string | null;
  templateKey: string;
  payloadJson: string;
  status: string;
  scheduledFor: Date;
  sentAt?: Date;
  failedAt?: Date;
  providerMessageId?: string;
  errorMessage?: string;
}) {
  const job = await prisma.notificationJob.upsert({
    where: { dedupeKey: input.dedupeKey },
    update: {
      status: input.status,
      scheduledFor: input.scheduledFor,
      sentAt: input.sentAt,
      failedAt: input.failedAt,
      provider: input.providerMessageId ? "fake" : undefined,
      providerMessageId: input.providerMessageId,
      errorMessage: input.errorMessage
    },
    create: {
      organizationId: input.organizationId,
      professionalId: input.professionalId,
      licenseId: input.licenseId,
      notificationRuleId: input.notificationRuleId,
      periodKey: input.periodKey,
      dedupeKey: input.dedupeKey,
      channel: "WHATSAPP",
      recipientPhone: input.recipientPhone,
      recipientEmail: input.recipientEmail,
      templateKey: input.templateKey,
      payloadJson: input.payloadJson,
      status: input.status,
      scheduledFor: input.scheduledFor,
      sentAt: input.sentAt,
      failedAt: input.failedAt,
      provider: input.providerMessageId ? "fake" : undefined,
      providerMessageId: input.providerMessageId,
      errorMessage: input.errorMessage
    }
  });

  const existingLog = await prisma.notificationLog.findFirst({
    where: { notificationJobId: job.id, status: input.status }
  });
  if (!existingLog && input.status !== "PENDING") {
    await prisma.notificationLog.create({
      data: {
        notificationJobId: job.id,
        provider: "fake",
        providerMessageId: input.providerMessageId,
        status: input.status,
        rawResponse: input.errorMessage ? JSON.stringify({ error: input.errorMessage }) : JSON.stringify({ ok: true })
      }
    });
  }

  return job;
}

async function ensureAuditLog(input: {
  organizationId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
}) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      organizationId: input.organizationId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId
    }
  });
  if (existing) {
    return prisma.auditLog.update({
      where: { id: existing.id },
      data: {
        actorId: input.actorId,
        metadataJson: JSON.stringify(input.metadata)
      }
    });
  }

  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadataJson: JSON.stringify(input.metadata)
    }
  });
}

async function ensureSellerProfile(input: {
  organizationId: string;
  userId: string;
  salesGroupId: string;
  code: string;
  displayName: string;
  email: string;
  phone: string | null;
  monthlyGoalCents: number;
}) {
  const existing = await prisma.sellerProfile.findFirst({
    where: {
      organizationId: input.organizationId,
      OR: [{ code: input.code }, { userId: input.userId }]
    }
  });

  if (existing) {
    return prisma.sellerProfile.update({
      where: { id: existing.id },
      data: {
        userId: input.userId,
        salesGroupId: input.salesGroupId,
        code: input.code,
        displayName: input.displayName,
        email: input.email,
        phone: input.phone,
        active: true,
        monthlyGoalCents: input.monthlyGoalCents
      }
    });
  }

  return prisma.sellerProfile.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      salesGroupId: input.salesGroupId,
      code: input.code,
      displayName: input.displayName,
      email: input.email,
      phone: input.phone,
      monthlyGoalCents: input.monthlyGoalCents
    }
  });
}

async function ensureSalesDocument(input: {
  organizationId: string;
  sellerProfileId: string;
  uploadedById: string;
  reviewedById?: string;
  fileKey: string;
  fileName: string;
  status: string;
  accessKey: string;
  invoiceNumber: string;
  issuedAt: Date;
  issuerName: string;
  buyerName: string;
  totalAmountCents: number;
  reviewedAt?: Date;
  rejectionReason?: string;
  items: Array<{
    sku: string;
    description: string;
    category: string;
    quantity: number;
    unitAmountCents: number;
    totalAmountCents: number;
  }>;
}) {
  const document = await prisma.salesDocument.upsert({
    where: {
      organizationId_accessKey: {
        organizationId: input.organizationId,
        accessKey: input.accessKey
      }
    },
    update: {
      sellerProfileId: input.sellerProfileId,
      uploadedById: input.uploadedById,
      reviewedById: input.reviewedById,
      status: input.status,
      invoiceNumber: input.invoiceNumber,
      series: "1",
      issuedAt: input.issuedAt,
      issuerName: input.issuerName,
      buyerName: input.buyerName,
      totalAmountCents: input.totalAmountCents,
      extractionConfidence: 0.95,
      reviewedAt: input.reviewedAt,
      rejectionReason: input.rejectionReason
    },
    create: {
      organizationId: input.organizationId,
      sellerProfileId: input.sellerProfileId,
      uploadedById: input.uploadedById,
      reviewedById: input.reviewedById,
      fileKey: input.fileKey,
      fileName: input.fileName,
      mimeType: "application/pdf",
      size: 128000,
      status: input.status,
      accessKey: input.accessKey,
      invoiceNumber: input.invoiceNumber,
      series: "1",
      issuedAt: input.issuedAt,
      issuerName: input.issuerName,
      buyerName: input.buyerName,
      totalAmountCents: input.totalAmountCents,
      extractionConfidence: 0.95,
      reviewedAt: input.reviewedAt,
      rejectionReason: input.rejectionReason
    }
  });

  await prisma.salesItem.deleteMany({ where: { salesDocumentId: document.id } });
  if (input.items.length > 0) {
    await prisma.salesItem.createMany({
      data: input.items.map((item) => ({
        salesDocumentId: document.id,
        sellerProfileId: input.sellerProfileId,
        ...item
      }))
    });
  }

  return document;
}

async function ensureFaqThread(input: {
  organizationId: string;
  authorId: string;
  title: string;
  body: string;
  tags: string[];
  status: string;
  wikiPageId?: string;
  promotedById?: string;
}) {
  const existing = await prisma.faqThread.findFirst({ where: { organizationId: input.organizationId, title: input.title } });
  const data = {
    authorId: input.authorId,
    body: input.body,
    tagsJson: JSON.stringify(input.tags),
    status: input.status,
    wikiPageId: input.wikiPageId,
    promotedAt: input.wikiPageId ? daysAgo(1) : null,
    promotedById: input.promotedById
  };
  return existing
    ? prisma.faqThread.update({ where: { id: existing.id }, data })
    : prisma.faqThread.create({ data: { organizationId: input.organizationId, title: input.title, ...data } });
}

async function ensureFaqComment(input: { organizationId: string; threadId: string; authorId: string; body: string }) {
  const existing = await prisma.faqComment.findFirst({
    where: { organizationId: input.organizationId, threadId: input.threadId, authorId: input.authorId, body: input.body }
  });
  return existing ?? prisma.faqComment.create({ data: input });
}

async function ensureInAppNotification(input: {
  organizationId: string;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  entityType: string;
  entityId: string;
  href: string;
  dedupeKey: string;
  readAt?: Date | null;
}) {
  return prisma.inAppNotification.upsert({
    where: {
      organizationId_recipientId_dedupeKey: {
        organizationId: input.organizationId,
        recipientId: input.recipientId,
        dedupeKey: input.dedupeKey
      }
    },
    update: {
      type: input.type,
      title: input.title,
      body: input.body,
      entityType: input.entityType,
      entityId: input.entityId,
      href: input.href,
      readAt: input.readAt ?? null
    },
    create: input
  });
}

async function ensureAnnouncement(input: {
  organizationId: string;
  createdById: string;
  updatedById: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  links?: Array<{ type: string; label: string; href: string }>;
  targetRoles?: string[];
  priority?: string;
  pinned?: boolean;
  requiresAck?: boolean;
  startsAt?: Date | null;
  expiresAt?: Date | null;
}) {
  return prisma.announcement.upsert({
    where: { organizationId_slug: { organizationId: input.organizationId, slug: input.slug } },
    update: {
      title: input.title,
      summary: input.summary,
      content: input.content,
      tagsJson: JSON.stringify(input.tags),
      linksJson: JSON.stringify(input.links ?? []),
      targetRolesJson: JSON.stringify(input.targetRoles ?? ["ADMIN", "GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"]),
      status: "PUBLISHED",
      priority: input.priority ?? "NORMAL",
      pinned: input.pinned ?? false,
      requiresAck: input.requiresAck ?? false,
      startsAt: input.startsAt ?? null,
      expiresAt: input.expiresAt ?? null,
      publishedAt: daysAgo(0),
      archivedAt: null,
      updatedById: input.updatedById
    },
    create: {
      organizationId: input.organizationId,
      createdById: input.createdById,
      updatedById: input.updatedById,
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      content: input.content,
      tagsJson: JSON.stringify(input.tags),
      linksJson: JSON.stringify(input.links ?? []),
      targetRolesJson: JSON.stringify(input.targetRoles ?? ["ADMIN", "GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"]),
      status: "PUBLISHED",
      priority: input.priority ?? "NORMAL",
      pinned: input.pinned ?? false,
      requiresAck: input.requiresAck ?? false,
      startsAt: input.startsAt ?? null,
      expiresAt: input.expiresAt ?? null,
      publishedAt: daysAgo(0)
    }
  });
}

async function ensureScriptCategory(input: { organizationId: string; createdById: string; slug: string; name: string; description: string; order: number }) {
  return prisma.scriptCategory.upsert({
    where: { organizationId_slug: { organizationId: input.organizationId, slug: input.slug } },
    update: { name: input.name, description: input.description, order: input.order, active: true },
    create: { ...input, active: true }
  });
}

async function ensureOperationalScript(input: {
  organizationId: string;
  categoryId: string;
  createdById: string;
  updatedById: string;
  validatedById: string;
  title: string;
  channel: string;
  body: string;
  tags: string[];
  wikiPageId?: string;
  faqThreadId?: string;
  reviewDueAt?: Date | null;
}) {
  const placeholders = [...new Set([...input.body.matchAll(/\{([a-zA-Z0-9_.-]+)\}/g)].map((match) => match[1]))].sort();
  const script = await prisma.operationalScript.upsert({
    where: { organizationId_categoryId_title: { organizationId: input.organizationId, categoryId: input.categoryId, title: input.title } },
    update: {
      channel: input.channel,
      body: input.body,
      tagsJson: JSON.stringify(input.tags),
      placeholdersJson: JSON.stringify(placeholders),
      wikiPageId: input.wikiPageId,
      faqThreadId: input.faqThreadId,
      reviewDueAt: input.reviewDueAt,
      status: "VALIDATED",
      updatedById: input.updatedById,
      validatedById: input.validatedById,
      validatedAt: daysAgo(0)
    },
    create: {
      organizationId: input.organizationId,
      categoryId: input.categoryId,
      title: input.title,
      channel: input.channel,
      body: input.body,
      tagsJson: JSON.stringify(input.tags),
      placeholdersJson: JSON.stringify(placeholders),
      wikiPageId: input.wikiPageId,
      faqThreadId: input.faqThreadId,
      reviewDueAt: input.reviewDueAt,
      status: "VALIDATED",
      createdById: input.createdById,
      updatedById: input.updatedById,
      validatedById: input.validatedById,
      validatedAt: daysAgo(0)
    }
  });
  const existingRevision = await prisma.operationalScriptRevision.findFirst({ where: { scriptId: script.id, version: 1 } });
  if (!existingRevision) {
    await prisma.operationalScriptRevision.create({
      data: {
        organizationId: input.organizationId,
        scriptId: script.id,
        authorId: input.updatedById,
        version: 1,
        title: script.title,
        channel: script.channel,
        body: script.body,
        tagsJson: script.tagsJson,
        placeholdersJson: script.placeholdersJson,
        status: script.status
      }
    });
  }
  return script;
}

async function ensureOperationalScriptSuggestion(input: {
  organizationId: string;
  authorId: string;
  categoryId?: string | null;
  scriptId?: string | null;
  title: string;
  channel: string;
  body: string;
  tags: string[];
  suggestionType: string;
  status?: string;
  decisionComment?: string | null;
  decidedById?: string | null;
}) {
  const existing = await prisma.operationalScriptSuggestion.findFirst({ where: { organizationId: input.organizationId, title: input.title } });
  const data = {
    categoryId: input.categoryId ?? null,
    scriptId: input.scriptId ?? null,
    authorId: input.authorId,
    title: input.title,
    channel: input.channel,
    body: input.body,
    tagsJson: JSON.stringify(input.tags),
    suggestionType: input.suggestionType,
    status: input.status ?? "SUGGESTED",
    decisionComment: input.decisionComment ?? null,
    decidedById: input.decidedById ?? null,
    decidedAt: input.decidedById ? daysAgo(0) : null
  };
  return existing ? prisma.operationalScriptSuggestion.update({ where: { id: existing.id }, data }) : prisma.operationalScriptSuggestion.create({ data: { organizationId: input.organizationId, ...data } });
}

async function ensureScriptPack(input: {
  organizationId: string;
  categoryId?: string | null;
  wikiPageId?: string | null;
  faqThreadId?: string | null;
  createdById: string;
  updatedById: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  status?: string;
  order?: number;
  scriptIds: string[];
}) {
  const pack = await prisma.scriptPack.upsert({
    where: { organizationId_slug: { organizationId: input.organizationId, slug: input.slug } },
    update: {
      categoryId: input.categoryId ?? null,
      wikiPageId: input.wikiPageId ?? null,
      faqThreadId: input.faqThreadId ?? null,
      title: input.title,
      summary: input.summary,
      tagsJson: JSON.stringify(input.tags),
      status: input.status ?? "ACTIVE",
      order: input.order ?? 0,
      updatedById: input.updatedById
    },
    create: {
      organizationId: input.organizationId,
      categoryId: input.categoryId ?? null,
      wikiPageId: input.wikiPageId ?? null,
      faqThreadId: input.faqThreadId ?? null,
      createdById: input.createdById,
      updatedById: input.updatedById,
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      tagsJson: JSON.stringify(input.tags),
      status: input.status ?? "ACTIVE",
      order: input.order ?? 0
    }
  });
  await prisma.scriptPackItem.deleteMany({ where: { packId: pack.id } });
  await prisma.scriptPackItem.createMany({
    data: input.scriptIds.map((scriptId, index) => ({
      organizationId: input.organizationId,
      packId: pack.id,
      scriptId,
      order: index + 1,
      required: index === 0
    }))
  });
  return pack;
}

async function ensureServiceFlow(input: {
  organizationId: string;
  createdById: string;
  updatedById: string;
  wikiPageId?: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  status: string;
  priority: number;
  steps: Array<{
    title: string;
    body: string;
    kind: string;
    decision?: Record<string, unknown> | null;
    order: number;
    required?: boolean;
    scriptIds?: string[];
  }>;
}) {
  const flow = await prisma.serviceFlow.upsert({
    where: { organizationId_slug: { organizationId: input.organizationId, slug: input.slug } },
    update: {
      wikiPageId: input.wikiPageId,
      title: input.title,
      summary: input.summary,
      content: input.content,
      tagsJson: JSON.stringify(input.tags),
      status: input.status,
      priority: input.priority,
      updatedById: input.updatedById,
      publishedAt: input.status === "PUBLISHED" ? daysAgo(0) : null
    },
    create: {
      organizationId: input.organizationId,
      wikiPageId: input.wikiPageId,
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      content: input.content,
      tagsJson: JSON.stringify(input.tags),
      status: input.status,
      priority: input.priority,
      createdById: input.createdById,
      updatedById: input.updatedById,
      publishedAt: input.status === "PUBLISHED" ? daysAgo(0) : null
    }
  });
  const existingSteps = await prisma.serviceFlowStep.findMany({ where: { flowId: flow.id }, select: { id: true } });
  const existingStepIds = existingSteps.map((step) => step.id);
  if (existingStepIds.length) {
    await prisma.serviceFlowSessionStep.deleteMany({ where: { stepId: { in: existingStepIds } } });
    await prisma.serviceFlowStepScript.deleteMany({ where: { stepId: { in: existingStepIds } } });
  }
  await prisma.serviceFlowStep.deleteMany({ where: { flowId: flow.id } });
  for (const step of input.steps) {
    const createdStep = await prisma.serviceFlowStep.create({
      data: {
        organizationId: input.organizationId,
        flowId: flow.id,
        title: step.title,
        body: step.body,
        kind: step.kind,
        decisionJson: step.decision ? JSON.stringify(step.decision) : null,
        order: step.order,
        required: step.required ?? false
      }
    });
    for (const [index, scriptId] of (step.scriptIds ?? []).entries()) {
      await prisma.serviceFlowStepScript.create({
        data: {
          organizationId: input.organizationId,
          stepId: createdStep.id,
          scriptId,
          order: index + 1
        }
      });
    }
  }
  return flow;
}

async function main() {
  const organizationId = seedText("SEED_ORGANIZATION_ID", "alwaystrack-local");
  const organizationName = seedText("SEED_ORGANIZATION_NAME", "AlwaysTrack Local");
  const adminPassword = seedSecret("SEED_ADMIN_PASSWORD");
  const sacPassword = seedSecret("SEED_SAC_PASSWORD");
  const financeiroPassword = seedSecret("SEED_FINANCEIRO_PASSWORD");
  const sellerPassword = seedSecret("SEED_SELLER_PASSWORD");
  const supervisorPassword = seedSecret("SEED_SUPERVISOR_PASSWORD");
  const adminPasswordHash = await hashPassword(adminPassword);
  const sacPasswordHash = await hashPassword(sacPassword);
  const financeiroPasswordHash = await hashPassword(financeiroPassword);
  const sellerPasswordHash = await hashPassword(sellerPassword);
  const supervisorPasswordHash = await hashPassword(supervisorPassword);

  const organization = await prisma.organization.upsert({
    where: { id: organizationId },
    update: {
      name: organizationName,
      document: "00.000.000/0001-00",
      logoUrl: "/favicon/favicon-512.png",
      settingsJson: JSON.stringify({
        defaultTags: ["campanhas", "faq", "notas", "processo", "ranking", "sac", "vendas"],
        dashboardDefaultRange: "30",
        dashboardDefaultBucket: "day"
      }),
      active: true
    },
    create: {
      id: organizationId,
      name: organizationName,
      document: "00.000.000/0001-00",
      logoUrl: "/favicon/favicon-512.png",
      settingsJson: JSON.stringify({
        defaultTags: ["campanhas", "faq", "notas", "processo", "ranking", "sac", "vendas"],
        dashboardDefaultRange: "30",
        dashboardDefaultBucket: "day"
      })
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { name: "Admin Demo", passwordHash: adminPasswordHash, role: "ADMIN", active: true, organizationId: organization.id },
    create: {
      name: "Admin Demo",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      organizationId: organization.id
    }
  });

  const wikiPage = await prisma.wikiPage.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "primeiros-passos"
      }
    },
    update: {
      title: "Primeiros passos",
      content:
        "Use esta wiki para registrar procedimentos transversais do AlwaysTrack: SAC, financeiro, vendedores, supervisores, campanhas, extratos e revisao de notas.\n\nAdmins publicam mudancas diretamente. Outros perfis podem sugerir alteracoes para aprovacao administrativa.",
      updatedById: admin.id,
      active: true
    },
    create: {
      organizationId: organization.id,
      slug: "primeiros-passos",
      title: "Primeiros passos",
      content:
        "Use esta wiki para registrar procedimentos transversais do AlwaysTrack: SAC, financeiro, vendedores, supervisores, campanhas, extratos e revisao de notas.\n\nAdmins publicam mudancas diretamente. Outros perfis podem sugerir alteracoes para aprovacao administrativa.",
      createdById: admin.id,
      updatedById: admin.id
    }
  });
  const existingWikiRevision = await prisma.wikiRevision.findFirst({
    where: { pageId: wikiPage.id, version: wikiPage.version }
  });
  if (!existingWikiRevision) {
    await prisma.wikiRevision.create({
      data: {
        organizationId: organization.id,
        pageId: wikiPage.id,
        authorId: admin.id,
        version: wikiPage.version,
        title: wikiPage.title,
        content: wikiPage.content
      }
    });
  }

  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@example.com" },
    update: {
      name: "Supervisor Demo",
      passwordHash: supervisorPasswordHash,
      role: "SUPERVISOR",
      phone: "+5511999990002",
      active: true,
      organizationId: organization.id,
      unitScopeJson: null,
      sectorScopeJson: null
    },
    create: {
      name: "Supervisor Demo",
      email: "supervisor@example.com",
      passwordHash: supervisorPasswordHash,
      role: "SUPERVISOR",
      phone: "+5511999990002",
      organizationId: organization.id
    }
  });

  const sac = await prisma.user.upsert({
    where: { email: "sac@example.com" },
    update: { name: "SAC Demo", passwordHash: sacPasswordHash, role: "SAC", active: true, organizationId: organization.id },
    create: {
      name: "SAC Demo",
      email: "sac@example.com",
      passwordHash: sacPasswordHash,
      role: "SAC",
      organizationId: organization.id
    }
  });

  const financeiro = await prisma.user.upsert({
    where: { email: "financeiro@example.com" },
    update: {
      name: "Financeiro Demo",
      passwordHash: financeiroPasswordHash,
      role: "FINANCEIRO",
      active: true,
      organizationId: organization.id
    },
    create: {
      name: "Financeiro Demo",
      email: "financeiro@example.com",
      passwordHash: financeiroPasswordHash,
      role: "FINANCEIRO",
      organizationId: organization.id
    }
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: "vendedor@example.com" },
    update: {
      name: "Vendedor Demo",
      passwordHash: sellerPasswordHash,
      role: "VENDEDOR",
      phone: "+5511999992001",
      active: true,
      organizationId: organization.id
    },
    create: {
      name: "Vendedor Demo",
      email: "vendedor@example.com",
      passwordHash: sellerPasswordHash,
      role: "VENDEDOR",
      phone: "+5511999992001",
      organizationId: organization.id
    }
  });

  const salesGroup = await prisma.salesGroup.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: "Equipe Farma Norte"
      }
    },
    update: { supervisorId: supervisor.id, active: true },
    create: {
      organizationId: organization.id,
      name: "Equipe Farma Norte",
      supervisorId: supervisor.id
    }
  });

  const sellerProfile = await ensureSellerProfile({
    organizationId: organization.id,
    userId: sellerUser.id,
    salesGroupId: salesGroup.id,
    code: "VD-001",
    displayName: "Vendedor Demo",
    email: sellerUser.email,
    phone: sellerUser.phone,
    monthlyGoalCents: 2500000
  });

  const demoSellerProfiles = [{ profile: sellerProfile, user: sellerUser }];
  for (const extraSeller of [
    { email: "vendedor2@example.com", name: "Vendedor Demo 2", code: "VD-002", phone: "+5511999992002", monthlyGoalCents: 2200000 },
    { email: "vendedor3@example.com", name: "Vendedor Demo 3", code: "VD-003", phone: "+5511999992003", monthlyGoalCents: 2000000 }
  ]) {
    const user = await prisma.user.upsert({
      where: { email: extraSeller.email },
      update: {
        name: extraSeller.name,
        passwordHash: sellerPasswordHash,
        role: "VENDEDOR",
        phone: extraSeller.phone,
        active: true,
        organizationId: organization.id
      },
      create: {
        name: extraSeller.name,
        email: extraSeller.email,
        passwordHash: sellerPasswordHash,
        role: "VENDEDOR",
        phone: extraSeller.phone,
        organizationId: organization.id
      }
    });

    const profile = await ensureSellerProfile({
      organizationId: organization.id,
      userId: user.id,
      salesGroupId: salesGroup.id,
      code: extraSeller.code,
      displayName: extraSeller.name,
      email: user.email,
      phone: user.phone,
      monthlyGoalCents: extraSeller.monthlyGoalCents
    });
    demoSellerProfiles.push({ profile, user });
  }

  const approvedSalesDocument = await ensureSalesDocument({
      organizationId: organization.id,
      sellerProfileId: sellerProfile.id,
      uploadedById: sellerUser.id,
      reviewedById: financeiro.id,
      fileKey: `${organization.id}/sales-documents/${sellerProfile.id}/seed-danfe.pdf`,
      fileName: "danfe-demo-aprovada.pdf",
      status: "APPROVED",
      accessKey: "35260500000000000100550010000000011000000010",
      invoiceNumber: "000000001",
      issuedAt: daysAgo(3),
      issuerName: "Distribuidora Suplementos Demo",
      buyerName: "Cliente Farma Norte",
      totalAmountCents: 189970,
      reviewedAt: daysAgo(2),
      items: [
        {
          sku: "WHEY-900-BAU",
          description: "Whey Protein 900g Baunilha",
          category: "Proteinas",
          quantity: 4,
          unitAmountCents: 18990,
          totalAmountCents: 75960
        },
        {
          sku: "CREA-300",
          description: "Creatina 300g",
          category: "Performance",
          quantity: 6,
          unitAmountCents: 8990,
          totalAmountCents: 53940
        },
        {
          sku: "PRE-300-LIM",
          description: "Pre treino 300g Limao",
          category: "Performance",
          quantity: 5,
          unitAmountCents: 12014,
          totalAmountCents: 60070
        }
      ]
  });

  await ensureSalesDocument({
    organizationId: organization.id,
    sellerProfileId: demoSellerProfiles[1].profile.id,
    uploadedById: demoSellerProfiles[1].user.id,
    reviewedById: sac.id,
    fileKey: `${organization.id}/sales-documents/${demoSellerProfiles[1].profile.id}/seed-danfe-2.pdf`,
    fileName: "danfe-demo-aprovada-2.pdf",
    status: "APPROVED",
    accessKey: "35260500000000000100550010000000022000000020",
    invoiceNumber: "000000002",
    issuedAt: daysAgo(5),
    issuerName: "Distribuidora Suplementos Demo",
    buyerName: "Cliente Farma Centro",
    totalAmountCents: 246820,
    reviewedAt: daysAgo(4),
    items: [
      {
        sku: "WHEY-900-CHO",
        description: "Whey Protein 900g Chocolate",
        category: "Proteinas",
        quantity: 8,
        unitAmountCents: 18990,
        totalAmountCents: 151920
      },
      {
        sku: "COLL-300",
        description: "Colageno 300g",
        category: "Saude",
        quantity: 5,
        unitAmountCents: 18980,
        totalAmountCents: 94900
      }
    ]
  });

  await ensureSalesDocument({
    organizationId: organization.id,
    sellerProfileId: demoSellerProfiles[2].profile.id,
    uploadedById: demoSellerProfiles[2].user.id,
    reviewedById: financeiro.id,
    fileKey: `${organization.id}/sales-documents/${demoSellerProfiles[2].profile.id}/seed-danfe-3.pdf`,
    fileName: "danfe-demo-aprovada-3.pdf",
    status: "APPROVED",
    accessKey: "35260500000000000100550010000000033000000030",
    invoiceNumber: "000000003",
    issuedAt: daysAgo(8),
    issuerName: "Distribuidora Suplementos Demo",
    buyerName: "Cliente Farma Sul",
    totalAmountCents: 98240,
    reviewedAt: daysAgo(7),
    items: [
      {
        sku: "CREA-300",
        description: "Creatina 300g",
        category: "Performance",
        quantity: 4,
        unitAmountCents: 8990,
        totalAmountCents: 35960
      },
      {
        sku: "OMEGA-120",
        description: "Omega 3 120 caps",
        category: "Saude",
        quantity: 7,
        unitAmountCents: 8897,
        totalAmountCents: 62280
      }
    ]
  });

  const pendingSalesDocument = await ensureSalesDocument({
    organizationId: organization.id,
    sellerProfileId: demoSellerProfiles[0].profile.id,
    uploadedById: demoSellerProfiles[0].user.id,
    fileKey: `${organization.id}/sales-documents/${demoSellerProfiles[0].profile.id}/seed-danfe-pendente.pdf`,
    fileName: "danfe-demo-pendente.pdf",
    status: "PENDING_REVIEW",
    accessKey: "35260500000000000100550010000000044000000040",
    invoiceNumber: "000000004",
    issuedAt: daysAgo(1),
    issuerName: "Distribuidora Suplementos Demo",
    buyerName: "Cliente Farma Norte",
    totalAmountCents: 75400,
    items: [
      {
        sku: "BCAA-240",
        description: "BCAA 240 caps",
        category: "Performance",
        quantity: 4,
        unitAmountCents: 18850,
        totalAmountCents: 75400
      }
    ]
  });

  const currentCampaignStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const currentCampaignEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const demoCampaign = await prisma.salesCampaign.upsert({
    where: { id: "seed-campaign-demo-current" },
    update: {
      organizationId: organization.id,
      salesGroupId: salesGroup.id,
      name: "Campanha Demo Atual",
      description: "Campanha de apresentacao com ranking, extratos e dashboard preenchidos.",
      metric: "TOTAL_AMOUNT",
      status: "ACTIVE",
      startsAt: currentCampaignStart,
      endsAt: currentCampaignEnd
    },
    create: {
      id: "seed-campaign-demo-current",
      organizationId: organization.id,
      salesGroupId: salesGroup.id,
      name: "Campanha Demo Atual",
      description: "Campanha de apresentacao com ranking, extratos e dashboard preenchidos.",
      metric: "TOTAL_AMOUNT",
      status: "ACTIVE",
      startsAt: currentCampaignStart,
      endsAt: currentCampaignEnd
    }
  });

  await prisma.rankingSnapshot.upsert({
    where: { id: "seed-ranking-snapshot-demo" },
    update: {
      organizationId: organization.id,
      campaignId: demoCampaign.id,
      periodStart: currentCampaignStart,
      periodEnd: currentCampaignEnd,
      scopeType: "SALES_GROUP",
      scopeId: salesGroup.id,
      payloadJson: JSON.stringify({
        campaign: { id: demoCampaign.id, name: demoCampaign.name },
        items: [
          { position: 1, sellerName: "Vendedor Demo 2", totalAmountCents: 246820 },
          { position: 2, sellerName: "Vendedor Demo", totalAmountCents: 189970 },
          { position: 3, sellerName: "Vendedor Demo 3", totalAmountCents: 98240 }
        ]
      })
    },
    create: {
      id: "seed-ranking-snapshot-demo",
      organizationId: organization.id,
      campaignId: demoCampaign.id,
      periodStart: currentCampaignStart,
      periodEnd: currentCampaignEnd,
      scopeType: "SALES_GROUP",
      scopeId: salesGroup.id,
      payloadJson: JSON.stringify({
        campaign: { id: demoCampaign.id, name: demoCampaign.name },
        items: [
          { position: 1, sellerName: "Vendedor Demo 2", totalAmountCents: 246820 },
          { position: 2, sellerName: "Vendedor Demo", totalAmountCents: 189970 },
          { position: 3, sellerName: "Vendedor Demo 3", totalAmountCents: 98240 }
        ]
      })
    }
  });

  await prisma.salesCampaign.upsert({
    where: { id: "seed-campaign-maio" },
    update: {
      organizationId: organization.id,
      salesGroupId: salesGroup.id,
      name: "Campanha Maio Proteinas",
      metric: "TOTAL_AMOUNT",
      status: "ACTIVE",
      startsAt: new Date(Date.UTC(2026, 4, 1)),
      endsAt: new Date(Date.UTC(2026, 4, 31))
    },
    create: {
      id: "seed-campaign-maio",
      organizationId: organization.id,
      salesGroupId: salesGroup.id,
      name: "Campanha Maio Proteinas",
      description: "Ranking inicial por valor aprovado em notas fiscais.",
      metric: "TOTAL_AMOUNT",
      status: "ACTIVE",
      startsAt: new Date(Date.UTC(2026, 4, 1)),
      endsAt: new Date(Date.UTC(2026, 4, 31))
    }
  });

  const faqWikiPage = await prisma.wikiPage.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "conferencia-de-danfe"
      }
    },
    update: {
      title: "Conferência de DANFE",
      content:
        "## Quando revisar\nConfira vendedor, chave de acesso, NF, data de emissão e total antes de aprovar.\n\n## Quando rejeitar\nRejeite com comentário quando a imagem estiver ilegível, vendedor estiver incorreto ou a nota não pertencer ao período da campanha.\n\n_Fonte: FAQ interna de demo._",
      tagsJson: JSON.stringify(["faq", "notas", "processo"]),
      updatedById: admin.id,
      active: true
    },
    create: {
      organizationId: organization.id,
      slug: "conferencia-de-danfe",
      title: "Conferência de DANFE",
      content:
        "## Quando revisar\nConfira vendedor, chave de acesso, NF, data de emissão e total antes de aprovar.\n\n## Quando rejeitar\nRejeite com comentário quando a imagem estiver ilegível, vendedor estiver incorreto ou a nota não pertencer ao período da campanha.\n\n_Fonte: FAQ interna de demo._",
      tagsJson: JSON.stringify(["faq", "notas", "processo"]),
      createdById: admin.id,
      updatedById: admin.id
    }
  });
  const existingFaqWikiRevision = await prisma.wikiRevision.findFirst({ where: { pageId: faqWikiPage.id, version: faqWikiPage.version } });
  if (!existingFaqWikiRevision) {
    await prisma.wikiRevision.create({
      data: {
        organizationId: organization.id,
        pageId: faqWikiPage.id,
        authorId: admin.id,
        version: faqWikiPage.version,
        title: faqWikiPage.title,
        content: faqWikiPage.content
      }
    });
  }

  const faqThread = await ensureFaqThread({
    organizationId: organization.id,
    authorId: sellerUser.id,
    title: "Como conferir uma DANFE antes de aprovar?",
    body: "Quando a nota chega com vários itens, o que precisa bater antes de aprovar para o ranking?",
    tags: ["faq", "notas", "ranking"],
    status: "RESOLVED",
    wikiPageId: faqWikiPage.id,
    promotedById: admin.id
  });
  const faqComment = await ensureFaqComment({
    organizationId: organization.id,
    threadId: faqThread.id,
    authorId: sac.id,
    body: "Confira vendedor, NF, chave de acesso, data de emissão e total. Se algo divergir, devolva com comentário objetivo."
  });
  await prisma.faqReaction.upsert({
    where: {
      organizationId_targetType_targetId_userId_type: {
        organizationId: organization.id,
        targetType: "COMMENT",
        targetId: faqComment.id,
        userId: supervisor.id,
        type: "USEFUL"
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      threadId: faqThread.id,
      commentId: faqComment.id,
      userId: supervisor.id,
      targetType: "COMMENT",
      targetId: faqComment.id,
      type: "USEFUL"
    }
  });

  await ensureInAppNotification({
    organizationId: organization.id,
    recipientId: admin.id,
    type: "sales_document.pending_review",
    title: "Nota aguardando revisão",
    body: "A DANFE demo pendente está pronta para validar o fluxo de aprovação.",
    entityType: "SalesDocument",
    entityId: pendingSalesDocument.id,
    href: "/notas",
    dedupeKey: "seed:pending-sales-document"
  });
  await ensureInAppNotification({
    organizationId: organization.id,
    recipientId: sellerUser.id,
    type: "wiki.promoted",
    title: "FAQ promovida para Wiki",
    body: "A pergunta de conferência de DANFE virou uma seção consultável.",
    entityType: "WikiPage",
    entityId: faqWikiPage.id,
    href: "/wiki/conferencia-de-danfe",
    dedupeKey: "seed:wiki-promoted-faq"
  });
  await ensureInAppNotification({
    organizationId: organization.id,
    recipientId: supervisor.id,
    type: "sales_ranking.snapshot",
    title: "Snapshot de ranking criado",
    body: "A campanha demo atual tem um ranking congelado para comparação.",
    entityType: "RankingSnapshot",
    entityId: "seed-ranking-snapshot-demo",
    href: "/campanhas",
    dedupeKey: "seed:ranking-snapshot"
  });

  const criticalAnnouncement = await ensureAnnouncement({
    organizationId: organization.id,
    createdById: admin.id,
    updatedById: admin.id,
    slug: "conferencia-obrigatoria-de-danfe",
    title: "Conferência obrigatória de DANFE",
    summary: "Antes de aprovar notas, confira vendedor, NF, total, emissão e duplicidade.",
    content:
      "# Conferência obrigatória\n\n- Validar vendedor e grupo antes da aprovação.\n- Conferir NF, data de emissão, chave de acesso e total.\n- Usar Diagnóstico de DANFE quando a extração parecer inconsistente.\n\nEsse aviso exige ciência porque impacta ranking, extrato e auditoria.",
    tags: ["notas", "processo", "ranking"],
    links: [{ type: "WIKI", label: "Procedimento de conferência", href: "/wiki/conferencia-de-danfe" }],
    priority: "CRITICAL",
    pinned: true,
    requiresAck: true,
    expiresAt: addDays(14)
  });
  const dailyAnnouncement = await ensureAnnouncement({
    organizationId: organization.id,
    createdById: supervisor.id,
    updatedById: supervisor.id,
    slug: "prioridade-comercial-do-dia",
    title: "Prioridade comercial do dia",
    summary: "Campanhas ativas devem ser acompanhadas junto do ranking parcial.",
    content:
      "## Prioridade do dia\n\nAcompanhe campanhas ativas, ranking parcial e notas pendentes antes de cobrar resultado do time.\n\n- Use a Central Operacional Hoje.\n- Abra o ranking explicável em caso de contestação.\n- Registre dúvidas recorrentes no FAQ.",
    tags: ["campanhas", "ranking", "vendas"],
    links: [{ type: "CAMPAIGN", label: "Campanhas", href: "/campanhas" }],
    priority: "HIGH",
    pinned: false,
    requiresAck: false,
    expiresAt: addDays(7)
  });
  await ensureInAppNotification({
    organizationId: organization.id,
    recipientId: sellerUser.id,
    type: "announcement.published",
    title: "Aviso crítico: Conferência obrigatória de DANFE",
    body: criticalAnnouncement.summary ?? "Novo comunicado interno.",
    entityType: "Announcement",
    entityId: criticalAnnouncement.id,
    href: "/avisos/conferencia-obrigatoria-de-danfe",
    dedupeKey: "seed:announcement-critical"
  });
  await ensureInAppNotification({
    organizationId: organization.id,
    recipientId: sac.id,
    type: "announcement.published",
    title: "Novo aviso: Prioridade comercial do dia",
    body: dailyAnnouncement.summary ?? "Novo comunicado interno.",
    entityType: "Announcement",
    entityId: dailyAnnouncement.id,
    href: "/avisos/prioridade-comercial-do-dia",
    dedupeKey: "seed:announcement-daily"
  });

  const categoryDelivery = await ensureScriptCategory({
    organizationId: organization.id,
    createdById: supervisor.id,
    slug: "entrega-e-rastreio",
    name: "Entrega e rastreio",
    description: "Textos para prazo, rastreio e endereço",
    order: 1
  });
  const categoryFinancial = await ensureScriptCategory({
    organizationId: organization.id,
    createdById: supervisor.id,
    slug: "financeiro-e-estorno",
    name: "Financeiro e estorno",
    description: "Scripts para cobrança, reembolso e comprovantes",
    order: 2
  });
  const categoryProduct = await ensureScriptCategory({
    organizationId: organization.id,
    createdById: supervisor.id,
    slug: "produto-e-duvida",
    name: "Produto e dúvida",
    description: "Atendimento sobre produto, indicação e troca",
    order: 3
  });
  const trackingScript = await ensureOperationalScript({
    organizationId: organization.id,
    categoryId: categoryDelivery.id,
    createdById: supervisor.id,
    updatedById: supervisor.id,
    validatedById: supervisor.id,
    title: "Enviar código de rastreio",
    channel: "WHATSAPP",
    body: "Olá {nome_cliente}, tudo bem? Seu pedido {numero_pedido} já está em transporte. O código de rastreio é {codigo_rastreio}. O prazo estimado é {prazo}. Qualquer dúvida sigo por aqui.",
    tags: ["entrega", "pedido", "rastreio", "whatsapp"],
    reviewDueAt: addDays(45)
  });
  await ensureOperationalScript({
    organizationId: organization.id,
    categoryId: categoryFinancial.id,
    createdById: supervisor.id,
    updatedById: supervisor.id,
    validatedById: supervisor.id,
    title: "Confirmar solicitação de estorno",
    channel: "WHATSAPP",
    body: "Oi {nome_cliente}. Recebemos sua solicitação de estorno do pedido {numero_pedido}. O valor de {valor} será analisado pelo financeiro e retornamos com a confirmação em até {prazo}.",
    tags: ["estorno", "financeiro", "pedido", "whatsapp"],
    reviewDueAt: addDays(30)
  });
  const productGuidanceScript = await ensureOperationalScript({
    organizationId: organization.id,
    categoryId: categoryProduct.id,
    createdById: supervisor.id,
    updatedById: supervisor.id,
    validatedById: supervisor.id,
    title: "Orientação inicial sobre produto",
    channel: "WHATSAPP",
    body: "Olá {nome_cliente}. Sobre o produto {produto}, a orientação inicial é conferir modo de uso, objetivo e restrições no rótulo. Se quiser, posso encaminhar sua dúvida para um atendente especializado. Atendente: {atendente}.",
    tags: ["produto", "sac", "treinamento", "whatsapp"],
    wikiPageId: faqWikiPage.id,
    faqThreadId: faqThread.id,
    reviewDueAt: daysAgo(2)
  });
  const healthUsageScript = await ensureOperationalScript({
    organizationId: organization.id,
    categoryId: categoryProduct.id,
    createdById: supervisor.id,
    updatedById: supervisor.id,
    validatedById: supervisor.id,
    title: "Investigar forma de uso em relato de saúde",
    channel: "WHATSAPP",
    body: "Entendi, {nome_cliente}. Para te orientar corretamente, me confirma por favor: qual produto foi usado, quantidade por dia, horário de uso, há quanto tempo iniciou e se houve uso junto com outro suplemento ou medicamento?",
    tags: ["saude", "produto", "sac", "triagem"],
    wikiPageId: faqWikiPage.id,
    reviewDueAt: addDays(45)
  });
  const reverseScript = await ensureOperationalScript({
    organizationId: organization.id,
    categoryId: categoryProduct.id,
    createdById: supervisor.id,
    updatedById: supervisor.id,
    validatedById: supervisor.id,
    title: "Orientar reversa de produto fechado",
    channel: "WHATSAPP",
    body: "Perfeito, {nome_cliente}. Como há frasco fechado, podemos seguir com a análise de reversa. Vou confirmar os dados do pedido {numero_pedido} e te passar os próximos passos para coleta/postagem.",
    tags: ["saude", "reversa", "troca", "estorno"],
    wikiPageId: faqWikiPage.id,
    reviewDueAt: addDays(45)
  });

  await ensureScriptPack({
    organizationId: organization.id,
    categoryId: categoryProduct.id,
    wikiPageId: faqWikiPage.id,
    faqThreadId: faqThread.id,
    createdById: supervisor.id,
    updatedById: supervisor.id,
    slug: "triagem-saude-reversa",
    title: "Triagem de saúde com possível reversa",
    summary: "Sequência curta para coletar relato, orientar produto e conduzir reversa quando houver frasco fechado.",
    tags: ["saude", "reversa", "sac", "triagem"],
    order: 1,
    scriptIds: [healthUsageScript.id, productGuidanceScript.id, reverseScript.id]
  });

  await ensureServiceFlow({
    organizationId: organization.id,
    createdById: supervisor.id,
    updatedById: supervisor.id,
    wikiPageId: faqWikiPage.id,
    slug: "problema-de-saude-reacao-adversa",
    title: "Problema de saúde / reação adversa",
    summary: "Triagem guiada para relatos de mal-estar, reação, uso incorreto ou necessidade de reversa.",
    content: "Use este fluxo quando o cliente relata sintomas, desconforto ou suspeita de reação após uso de produto. O foco é coletar contexto, reduzir risco, preservar evidências e encaminhar troca/estorno quando fizer sentido.",
    tags: ["saude", "sac", "reversa", "triagem"],
    status: "PUBLISHED",
    priority: 1,
    steps: [
      {
        title: "Entender relato e forma de uso",
        body: "Pergunte produto, dose, horário, tempo de uso, combinações e sintomas. Registre o relato sem prometer diagnóstico.",
        kind: "MANUAL",
        order: 1,
        required: true,
        scriptIds: [healthUsageScript.id, productGuidanceScript.id]
      },
      {
        title: "Verificar frascos fechados e evidências",
        body: "Confirme se há unidades fechadas, lote, validade, fotos e condição da embalagem.",
        kind: "YES_NO",
        decision: { yes: "Seguir para reversa/troca se política permitir.", no: "Avaliar exceção ou manter orientação sem reversa." },
        order: 2,
        required: true,
        scriptIds: [reverseScript.id]
      },
      {
        title: "Definir solução: estorno, troca ou orientação",
        body: "Com base no relato e evidências, alinhe com Supervisor/Admin quando necessário e registre a decisão.",
        kind: "DECISION",
        decision: { options: ["Estorno", "Troca", "Reversa", "Orientação sem reversa", "Escalar supervisor"] },
        order: 3,
        scriptIds: [reverseScript.id]
      }
    ]
  });

  await ensureOperationalScriptSuggestion({
    organizationId: organization.id,
    authorId: sac.id,
    categoryId: categoryDelivery.id,
    scriptId: trackingScript.id,
    title: "Adicionar confirmação de endereço ao rastreio",
    channel: "WHATSAPP",
    body: "Olá {nome_cliente}, antes de seguir com o rastreio do pedido {numero_pedido}, confirma se o endereço de entrega segue correto?",
    tags: ["entrega", "rastreio", "endereco"],
    suggestionType: "CHANGE"
  });
  const existingScriptSearchGap = await prisma.operationalScriptSearchEvent.findFirst({ where: { organizationId: organization.id, userId: sac.id, query: "troca de sabor" } });
  if (!existingScriptSearchGap) {
    await prisma.operationalScriptSearchEvent.create({
      data: {
        organizationId: organization.id,
        userId: sac.id,
        query: "troca de sabor",
        filtersJson: JSON.stringify({ source: "seed-demo" }),
        resultCount: 0
      }
    });
  }

  await ensureAuditLog({
    organizationId: organization.id,
    actorId: admin.id,
    action: "seed.local",
    entityType: "Organization",
    entityId: organization.id,
    metadata: { source: "local-seed", sellers: demoSellerProfiles.length, salesDocuments: 4, provider: "fake" }
  });
  await ensureAuditLog({
    organizationId: organization.id,
    actorId: financeiro.id,
    action: "sales_document.review",
    entityType: "SalesDocument",
    entityId: approvedSalesDocument.id,
    metadata: { source: "local-seed", status: "APPROVED", totalAmountCents: approvedSalesDocument.totalAmountCents }
  });
  await ensureAuditLog({
    organizationId: organization.id,
    actorId: admin.id,
    action: "faq.promote_to_wiki",
    entityType: "FaqThread",
    entityId: faqThread.id,
    metadata: { source: "local-seed", wikiPageId: faqWikiPage.id }
  });

  if (enableLegacySylembra) {
    const licenseTypeName = "Registro profissional padrão";
    const licenseTypeDescription = "Registro profissional usado no seed local do AlwaysTrack.";
    const rtPassword = seedSecret("SEED_RT_PASSWORD");
    const uploadToken = seedSecret("SEED_UPLOAD_TOKEN");
    const rtPasswordHash = await hashPassword(rtPassword);

    const rt = await prisma.user.upsert({
      where: { email: "rt@example.com" },
      update: {
        name: "RT Demo",
        passwordHash: rtPasswordHash,
        role: "RT",
        phone: "+5511999990001",
        active: true,
        organizationId: organization.id
      },
      create: {
        name: "RT Demo",
        email: "rt@example.com",
        passwordHash: rtPasswordHash,
        role: "RT",
        phone: "+5511999990001",
        organizationId: organization.id
      }
    });

    const unit = await prisma.unit.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: "Unidade Demo"
        }
      },
      update: { active: true },
      create: {
        organizationId: organization.id,
        name: "Unidade Demo"
      }
    });

    const sector = await prisma.sector.upsert({
      where: {
        unitId_name: {
          unitId: unit.id,
          name: "Setor Demo"
        }
      },
      update: { active: true },
      create: {
        unitId: unit.id,
        name: "Setor Demo"
      }
    });

    await prisma.user.update({
      where: { id: supervisor.id },
      data: {
        unitScopeJson: JSON.stringify([unit.id]),
        sectorScopeJson: JSON.stringify([sector.id])
      }
    });

  const licenseType = await prisma.licenseType.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: licenseTypeName
      }
    },
    update: { description: licenseTypeDescription, defaultWarningDays: "90,60,30", active: true },
    create: {
      organizationId: organization.id,
      name: licenseTypeName,
      description: licenseTypeDescription,
      defaultWarningDays: "90,60,30"
    }
  });

  const regularProfessional = await prisma.professional.upsert({
    where: {
      organizationId_cpf: {
        organizationId: organization.id,
        cpf: "00000000001"
      }
    },
    update: {
      unitId: unit.id,
      sectorId: sector.id,
      responsibleRtId: rt.id,
      name: "Ana Regular",
      email: "ana.regular@example.com",
      phone: "+5511999991001",
      active: true
    },
    create: {
      organizationId: organization.id,
      unitId: unit.id,
      sectorId: sector.id,
      responsibleRtId: rt.id,
      name: "Ana Regular",
      cpf: "00000000001",
      email: "ana.regular@example.com",
      phone: "+5511999991001",
      position: "Enfermeira"
    }
  });

  const expiringProfessional = await prisma.professional.upsert({
    where: {
      organizationId_cpf: {
        organizationId: organization.id,
        cpf: "00000000002"
      }
    },
    update: {
      unitId: unit.id,
      sectorId: sector.id,
      responsibleRtId: rt.id,
      name: "Bruno A Vencer",
      email: "bruno.vencer@example.com",
      phone: "+5511999991002",
      active: true
    },
    create: {
      organizationId: organization.id,
      unitId: unit.id,
      sectorId: sector.id,
      responsibleRtId: rt.id,
      name: "Bruno A Vencer",
      cpf: "00000000002",
      email: "bruno.vencer@example.com",
      phone: "+5511999991002",
      position: "Tecnico de enfermagem"
    }
  });

  const expiredProfessional = await prisma.professional.upsert({
    where: {
      organizationId_cpf: {
        organizationId: organization.id,
        cpf: "00000000003"
      }
    },
    update: {
      unitId: unit.id,
      sectorId: sector.id,
      responsibleRtId: rt.id,
      name: "Carla Vencida",
      email: "carla.vencida@example.com",
      phone: "+5511999991003",
      active: true
    },
    create: {
      organizationId: organization.id,
      unitId: unit.id,
      sectorId: sector.id,
      responsibleRtId: rt.id,
      name: "Carla Vencida",
      cpf: "00000000003",
      email: "carla.vencida@example.com",
      phone: "+5511999991003",
      position: "Enfermeira"
    }
  });

  const regularLicense = await prisma.license.upsert({
    where: {
      professionalId_licenseTypeId_number: {
        professionalId: regularProfessional.id,
        licenseTypeId: licenseType.id,
        number: "DEMO-0001"
      }
    },
    update: {
      issuer: "CONSELHO",
      uf: "SP",
      issuedAt: daysAgo(180),
      expiresAt: addDays(365),
      status: "REGULAR",
      validatedById: admin.id,
      lastValidatedAt: daysAgo(2)
    },
    create: {
      professionalId: regularProfessional.id,
      licenseTypeId: licenseType.id,
      number: "DEMO-0001",
      issuer: "CONSELHO",
      uf: "SP",
      issuedAt: daysAgo(180),
      expiresAt: addDays(365),
      status: "REGULAR",
      validatedById: admin.id,
      lastValidatedAt: daysAgo(2)
    }
  });

  const expiringLicense = await prisma.license.upsert({
    where: {
      professionalId_licenseTypeId_number: {
        professionalId: expiringProfessional.id,
        licenseTypeId: licenseType.id,
        number: "DEMO-0002"
      }
    },
    update: {
      issuer: "CONSELHO",
      uf: "SP",
      issuedAt: daysAgo(330),
      expiresAt: addDays(30),
      status: "EXPIRING"
    },
    create: {
      professionalId: expiringProfessional.id,
      licenseTypeId: licenseType.id,
      number: "DEMO-0002",
      issuer: "CONSELHO",
      uf: "SP",
      issuedAt: daysAgo(330),
      expiresAt: addDays(30),
      status: "EXPIRING"
    }
  });

  const expiredLicense = await prisma.license.upsert({
    where: {
      professionalId_licenseTypeId_number: {
        professionalId: expiredProfessional.id,
        licenseTypeId: licenseType.id,
        number: "DEMO-0003"
      }
    },
    update: {
      issuer: "CONSELHO",
      uf: "SP",
      issuedAt: daysAgo(450),
      expiresAt: daysAgo(15),
      status: "EXPIRED"
    },
    create: {
      professionalId: expiredProfessional.id,
      licenseTypeId: licenseType.id,
      number: "DEMO-0003",
      issuer: "CONSELHO",
      uf: "SP",
      issuedAt: daysAgo(450),
      expiresAt: daysAgo(15),
      status: "EXPIRED"
    }
  });

  const officialTemplates = [
    {
      key: "license_expiration_notice",
      bodyPreview:
        "Este é um aviso automático do AlwaysTrack.\nOlá, {{professionalName}}. Identificamos que a licença {{licenseTypeName}}, número {{licenseNumber}}, está com vencimento programado para {{expiresAt}}. Faltam {{daysUntilExpiration}} dias para o vencimento. Em caso de dúvida, entre em contato com o responsável técnico {{responsibleRtName}} para receber orientações sobre a regularização."
    },
    {
      key: "responsible_license_expiration_notice",
      bodyPreview:
        "Este é um aviso automático do AlwaysTrack.\nOlá, {{responsibleRtName}}. Identificamos que a profissional {{professionalName}} possui a licença {{licenseTypeName}}, número {{licenseNumber}}, com vencimento programado para {{expiresAt}}. Faltam {{daysUntilExpiration}} dias para o vencimento. Verifique a pendência no sistema e acompanhe a regularização."
    },
    {
      key: "license_expired_notice",
      bodyPreview:
        "Este é um aviso automático do AlwaysTrack.\nOlá, {{professionalName}}. Identificamos que sua licença {{licenseTypeName}}, número {{licenseNumber}}, venceu em {{expiresAt}}. A licença está vencida há {{daysExpired}} dias. Em caso de dúvida, entre em contato com o responsável técnico {{responsibleRtName}} para receber orientações sobre a regularização."
    },
    {
      key: "responsible_license_expired_notice",
      bodyPreview:
        "Este é um aviso automático do AlwaysTrack.\nOlá, {{responsibleRtName}}. Identificamos que a profissional {{professionalName}} possui a licença {{licenseTypeName}}, número {{licenseNumber}}, vencida desde {{expiresAt}}. A licença está vencida há {{daysExpired}} dias. Verifique a pendência no sistema e acompanhe a regularização."
    }
  ];

  for (const template of officialTemplates) {
    await prisma.notificationTemplate.upsert({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: template.key
        }
      },
      update: {
        channel: "WHATSAPP",
        metaTemplateName: template.key,
        language: "pt_BR",
        bodyPreview: template.bodyPreview,
        active: true
      },
      create: {
        organizationId: organization.id,
        key: template.key,
        channel: "WHATSAPP",
        metaTemplateName: template.key,
        language: "pt_BR",
        bodyPreview: template.bodyPreview
      }
    });
  }

  async function ensureRule(input: {
    templateKey: string;
    daysBeforeExpiration?: number;
    repeatAfterExpiredDays?: number;
    notifyProfessional: boolean;
    notifyRt: boolean;
  }) {
    const existing = await prisma.notificationRule.findFirst({
      where: {
        organizationId: organization.id,
        licenseTypeId: licenseType.id,
        channel: "WHATSAPP",
        templateKey: input.templateKey,
        daysBeforeExpiration: input.daysBeforeExpiration ?? null,
        repeatAfterExpiredDays: input.repeatAfterExpiredDays ?? null,
        notifyProfessional: input.notifyProfessional,
        notifyRt: input.notifyRt
      }
    });

    if (existing) return existing;

    return prisma.notificationRule.create({
      data: {
        organizationId: organization.id,
        licenseTypeId: licenseType.id,
        daysBeforeExpiration: input.daysBeforeExpiration ?? null,
        repeatAfterExpiredDays: input.repeatAfterExpiredDays ?? null,
        channel: "WHATSAPP",
        templateKey: input.templateKey,
        notifyProfessional: input.notifyProfessional,
        notifyRt: input.notifyRt
      }
    });
  }

  await ensureRule({ templateKey: "license_expiration_notice", daysBeforeExpiration: 60, notifyProfessional: true, notifyRt: false });
  const notificationRule = await ensureRule({
    templateKey: "license_expiration_notice",
    daysBeforeExpiration: 30,
    notifyProfessional: true,
    notifyRt: false
  });
  await ensureRule({
    templateKey: "responsible_license_expiration_notice",
    daysBeforeExpiration: 30,
    notifyProfessional: false,
    notifyRt: true
  });
  const expiredNotificationRule = await ensureRule({
    templateKey: "license_expired_notice",
    repeatAfterExpiredDays: 15,
    notifyProfessional: true,
    notifyRt: false
  });
  await ensureRule({
    templateKey: "responsible_license_expired_notice",
    repeatAfterExpiredDays: 15,
    notifyProfessional: false,
    notifyRt: true
  });

  const approvedDocument = await ensureDocument({
    professionalId: regularProfessional.id,
    licenseId: regularLicense.id,
    fileKey: `${organization.id}/${regularProfessional.id}/${regularLicense.id}/sample-approved.pdf`,
    fileName: "registro-aprovado-exemplo.pdf",
    status: "APPROVED",
    validatedById: rt.id,
    validatedAt: daysAgo(2)
  });
  const pendingDocument = await ensureDocument({
    professionalId: expiringProfessional.id,
    licenseId: expiringLicense.id,
    fileKey: `${organization.id}/${expiringProfessional.id}/${expiringLicense.id}/sample-pending.pdf`,
    fileName: "registro-pendente-exemplo.pdf",
    status: "UPLOADED"
  });
  const rejectedDocument = await ensureDocument({
    professionalId: expiredProfessional.id,
    licenseId: expiredLicense.id,
    fileKey: `${organization.id}/${expiredProfessional.id}/${expiredLicense.id}/sample-rejected.pdf`,
    fileName: "registro-recusado-exemplo.pdf",
    status: "REJECTED",
    validatedById: rt.id,
    validatedAt: daysAgo(1),
    rejectionReason: "Documento ilegivel no exemplo local."
  });

  await prisma.uploadToken.upsert({
    where: { tokenHash: hashUploadToken(uploadToken) },
    update: {
      professionalId: expiringProfessional.id,
      licenseId: expiringLicense.id,
      expiresAt: addDays(7),
      active: true,
      usedAt: null
    },
    create: {
      professionalId: expiringProfessional.id,
      licenseId: expiringLicense.id,
      tokenHash: hashUploadToken(uploadToken),
      expiresAt: addDays(7),
      active: true
    }
  });

  await ensureNotificationJob({
    organizationId: organization.id,
    professionalId: expiringProfessional.id,
    licenseId: expiringLicense.id,
    notificationRuleId: notificationRule.id,
    periodKey: `before:30:${now.toISOString().slice(0, 10)}`,
    dedupeKey: `${expiringLicense.id}:${notificationRule.id}:seed-sent:professional`,
    recipientPhone: expiringProfessional.phone,
    recipientEmail: expiringProfessional.email,
    templateKey: "license_expiration_notice",
    payloadJson: JSON.stringify({
      professionalName: expiringProfessional.name,
      licenseTypeName: licenseType.name,
      licenseNumber: expiringLicense.number,
      issuer: expiringLicense.issuer,
      uf: expiringLicense.uf,
      issuedAt: expiringLicense.issuedAt?.toISOString(),
      expiresAt: expiringLicense.expiresAt?.toISOString(),
      daysUntilExpiration: 30,
      daysExpired: 0,
      responsibleRtName: rt.name,
      responsibleRtPhoneMasked: "********0001",
      willEscalateToRt: true,
      recipientKind: "professional"
    }),
    status: "SENT",
    scheduledFor: daysAgo(1),
    sentAt: daysAgo(1),
    providerMessageId: "fake_seed_sent"
  });
  await ensureNotificationJob({
    organizationId: organization.id,
    professionalId: expiredProfessional.id,
    licenseId: expiredLicense.id,
    notificationRuleId: expiredNotificationRule.id,
    periodKey: `expired:seed:${now.toISOString().slice(0, 10)}`,
    dedupeKey: `${expiredLicense.id}:${notificationRule.id}:seed-failed:professional`,
    recipientPhone: expiredProfessional.phone,
    recipientEmail: expiredProfessional.email,
    templateKey: "license_expired_notice",
    payloadJson: JSON.stringify({
      professionalName: expiredProfessional.name,
      licenseTypeName: licenseType.name,
      licenseNumber: expiredLicense.number,
      issuer: expiredLicense.issuer,
      uf: expiredLicense.uf,
      issuedAt: expiredLicense.issuedAt?.toISOString(),
      expiresAt: expiredLicense.expiresAt?.toISOString(),
      daysUntilExpiration: -15,
      daysExpired: 15,
      responsibleRtName: rt.name,
      responsibleRtPhoneMasked: "********0001",
      willEscalateToRt: true,
      recipientKind: "professional"
    }),
    status: "FAILED",
    scheduledFor: daysAgo(1),
    failedAt: now,
    errorMessage: "DEMO_PROVIDER_FAILURE"
  });

  await ensureAuditLog({
    organizationId: organization.id,
    actorId: admin.id,
    action: "seed.local",
    entityType: "Organization",
    entityId: organization.id,
    metadata: { source: "local-seed", profiles: 3, provider: "fake" }
  });
  await ensureAuditLog({
    organizationId: organization.id,
    actorId: rt.id,
    action: "document.approve",
    entityType: "Document",
    entityId: approvedDocument.id,
    metadata: { source: "local-seed", licenseId: regularLicense.id }
  });
  await ensureAuditLog({
    organizationId: organization.id,
    actorId: rt.id,
    action: "document.reject",
    entityType: "Document",
    entityId: rejectedDocument.id,
    metadata: { source: "local-seed", licenseId: expiredLicense.id }
  });
  await ensureAuditLog({
    organizationId: organization.id,
    actorId: null,
    action: "document.public_upload",
    entityType: "Document",
    entityId: pendingDocument.id,
    metadata: { source: "local-seed", licenseId: expiringLicense.id }
  });

    console.log(`- Legacy RT: rt@example.com / ${rtPassword}`);
    console.log(`- Public upload token: ${uploadToken}`);
  }

  console.log("Local seed ready:");
  console.log(`- Organization: ${organization.id} / ${organization.name}`);
  console.log(`- Admin: admin@example.com / ${adminPassword}`);
  console.log(`- SAC: sac@example.com / ${sacPassword}`);
  console.log(`- Financeiro: financeiro@example.com / ${financeiroPassword}`);
  console.log(`- Vendedor: vendedor@example.com / ${sellerPassword}`);
  console.log(`- Supervisor: supervisor@example.com / ${supervisorPassword}`);
  if (!enableLegacySylembra) {
    console.log("- Legacy SyLembra fixtures are disabled by default. Set ENABLE_LEGACY_SYLEMBRA=true to seed RT, licenses, documents, upload token and license notifications.");
  }
  console.log("- Set SEED_ORGANIZATION_ID, SEED_ORGANIZATION_NAME, SEED_ADMIN_PASSWORD, SEED_SAC_PASSWORD, SEED_FINANCEIRO_PASSWORD, SEED_SELLER_PASSWORD and SEED_SUPERVISOR_PASSWORD for stable local seed data.");
  console.log("- Notifications use NOTIFICATION_PROVIDER=fake until Meta envs are configured.");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
