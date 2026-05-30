import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { hashPassword } from "../src/core/auth/password.js";
import { hashUploadToken } from "../src/core/documents/upload-tokens.service.js";

process.env.DATABASE_URL ??= "file:./dev.db";

const prisma = new PrismaClient();
const now = new Date();

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
  if (existing) return existing;

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

async function main() {
  const organizationId = seedText("SEED_ORGANIZATION_ID", "alwaystrack-local");
  const organizationName = seedText("SEED_ORGANIZATION_NAME", "AlwaysTrack Local");
  const licenseTypeName = "Registro profissional padrão";
  const licenseTypeDescription = "Registro profissional usado no seed local do AlwaysTrack.";
  const adminPassword = seedSecret("SEED_ADMIN_PASSWORD");
  const sacPassword = seedSecret("SEED_SAC_PASSWORD");
  const financeiroPassword = seedSecret("SEED_FINANCEIRO_PASSWORD");
  const sellerPassword = seedSecret("SEED_SELLER_PASSWORD");
  const rtPassword = seedSecret("SEED_RT_PASSWORD");
  const supervisorPassword = seedSecret("SEED_SUPERVISOR_PASSWORD");
  const uploadToken = seedSecret("SEED_UPLOAD_TOKEN");
  const adminPasswordHash = await hashPassword(adminPassword);
  const sacPasswordHash = await hashPassword(sacPassword);
  const financeiroPasswordHash = await hashPassword(financeiroPassword);
  const sellerPasswordHash = await hashPassword(sellerPassword);
  const rtPasswordHash = await hashPassword(rtPassword);
  const supervisorPasswordHash = await hashPassword(supervisorPassword);

  const organization = await prisma.organization.upsert({
    where: { id: organizationId },
    update: { name: organizationName, document: "00.000.000/0001-00", active: true },
    create: {
      id: organizationId,
      name: organizationName,
      document: "00.000.000/0001-00"
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

  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@example.com" },
    update: {
      name: "Supervisor Demo",
      passwordHash: supervisorPasswordHash,
      role: "SUPERVISOR",
      phone: "+5511999990002",
      active: true,
      organizationId: organization.id,
      unitScopeJson: JSON.stringify([unit.id]),
      sectorScopeJson: JSON.stringify([sector.id])
    },
    create: {
      name: "Supervisor Demo",
      email: "supervisor@example.com",
      passwordHash: supervisorPasswordHash,
      role: "SUPERVISOR",
      phone: "+5511999990002",
      organizationId: organization.id,
      unitScopeJson: JSON.stringify([unit.id]),
      sectorScopeJson: JSON.stringify([sector.id])
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

  const sellerProfile = await prisma.sellerProfile.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: "VD-001"
      }
    },
    update: {
      userId: sellerUser.id,
      salesGroupId: salesGroup.id,
      displayName: "Vendedor Demo",
      email: sellerUser.email,
      phone: sellerUser.phone,
      active: true,
      monthlyGoalCents: 2500000
    },
    create: {
      organizationId: organization.id,
      userId: sellerUser.id,
      salesGroupId: salesGroup.id,
      code: "VD-001",
      displayName: "Vendedor Demo",
      email: sellerUser.email,
      phone: sellerUser.phone,
      monthlyGoalCents: 2500000
    }
  });

  const approvedSalesDocument = await prisma.salesDocument.upsert({
    where: {
      organizationId_accessKey: {
        organizationId: organization.id,
        accessKey: "35260500000000000100550010000000011000000010"
      }
    },
    update: {
      sellerProfileId: sellerProfile.id,
      uploadedById: sellerUser.id,
      reviewedById: financeiro.id,
      status: "APPROVED",
      invoiceNumber: "000000001",
      series: "1",
      issuedAt: daysAgo(3),
      issuerName: "Distribuidora Suplementos Demo",
      buyerName: "Cliente Farma Norte",
      totalAmountCents: 189970,
      reviewedAt: daysAgo(2)
    },
    create: {
      organizationId: organization.id,
      sellerProfileId: sellerProfile.id,
      uploadedById: sellerUser.id,
      reviewedById: financeiro.id,
      fileKey: `${organization.id}/sales-documents/${sellerProfile.id}/seed-danfe.pdf`,
      fileName: "danfe-demo-aprovada.pdf",
      mimeType: "application/pdf",
      size: 128000,
      status: "APPROVED",
      accessKey: "35260500000000000100550010000000011000000010",
      invoiceNumber: "000000001",
      series: "1",
      issuedAt: daysAgo(3),
      issuerName: "Distribuidora Suplementos Demo",
      buyerName: "Cliente Farma Norte",
      totalAmountCents: 189970,
      extractionConfidence: 0.96,
      reviewedAt: daysAgo(2)
    }
  });

  const existingSalesItem = await prisma.salesItem.findFirst({
    where: { salesDocumentId: approvedSalesDocument.id, sku: "WHEY-900-BAU" }
  });
  if (!existingSalesItem) {
    await prisma.salesItem.createMany({
      data: [
        {
          salesDocumentId: approvedSalesDocument.id,
          sellerProfileId: sellerProfile.id,
          sku: "WHEY-900-BAU",
          description: "Whey Protein 900g Baunilha",
          category: "Proteinas",
          quantity: 4,
          unitAmountCents: 18990,
          totalAmountCents: 75960
        },
        {
          salesDocumentId: approvedSalesDocument.id,
          sellerProfileId: sellerProfile.id,
          sku: "CREA-300",
          description: "Creatina 300g",
          category: "Performance",
          quantity: 6,
          unitAmountCents: 8990,
          totalAmountCents: 53940
        },
        {
          salesDocumentId: approvedSalesDocument.id,
          sellerProfileId: sellerProfile.id,
          sku: "PRE-300-LIM",
          description: "Pre treino 300g Limao",
          category: "Performance",
          quantity: 5,
          unitAmountCents: 12014,
          totalAmountCents: 60070
        }
      ]
    });
  }

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

  console.log("Local seed ready:");
  console.log(`- Organization: ${organization.id} / ${organization.name}`);
  console.log(`- Admin: admin@example.com / ${adminPassword}`);
  console.log(`- SAC: sac@example.com / ${sacPassword}`);
  console.log(`- Financeiro: financeiro@example.com / ${financeiroPassword}`);
  console.log(`- Vendedor: vendedor@example.com / ${sellerPassword}`);
  console.log(`- Supervisor: supervisor@example.com / ${supervisorPassword}`);
  console.log(`- Legacy RT: rt@example.com / ${rtPassword}`);
  console.log(`- Public upload token: ${uploadToken}`);
  console.log("- Set SEED_ORGANIZATION_ID, SEED_ORGANIZATION_NAME, SEED_ADMIN_PASSWORD, SEED_SAC_PASSWORD, SEED_FINANCEIRO_PASSWORD, SEED_SELLER_PASSWORD, SEED_SUPERVISOR_PASSWORD and SEED_UPLOAD_TOKEN for stable local seed data.");
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
