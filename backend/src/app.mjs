import express from "express";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { createStore, verifyPassword } from "./store.mjs";

const roles = new Set(["ADMIN", "MANAGER"]);
const isNonEmptyText = (value) => typeof value === "string" && value.trim().length > 0;
const isNonEmptyArray = (value) => Array.isArray(value) && value.length > 0;
const publicUser = ({ password, passwordHash, ...user }) => user;

const withOrgInfo = (store) => (user) => {
  const organization = user.orgId ? store.organizations.find((org) => org.id === user.orgId) : null;
  return { ...publicUser(user), orgName: organization?.name ?? null, orgStatus: organization?.status ?? null };
};

const INVITATION_TTL_MS = 1000 * 60 * 60 * 72; // 72시간 후 만료되는 일회성 초대 링크

export const createApp = async ({ databasePath = resolve("data/database.json") } = {}) => {
  const store = await createStore(databasePath);
  const sessions = new Map(); // token -> userId
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (request.method === "OPTIONS") return response.sendStatus(204);
    return next();
  });

  // ---------------------------------------------------------------------
  // 인증/인가 미들웨어
  // ---------------------------------------------------------------------
  const authenticate = (request, response, next) => {
    const token = request.header("authorization")?.replace("Bearer ", "");
    const userId = token ? sessions.get(token) : undefined;
    const user = userId ? store.users.find((candidate) => candidate.id === userId) : undefined;
    if (!user) return response.status(401).json({ message: "로그인이 필요합니다." });
    request.user = user;
    return next();
  };

  const requireRole = (role) => (request, response, next) => {
    if (request.user.role !== role) return response.status(403).json({ message: "권한이 없습니다." });
    return next();
  };

  // 배정된 조직이 APPROVED 상태인 관리자만 조직 업무 API에 접근할 수 있다.
  const requireApprovedOrg = (request, response, next) => {
    if (request.user.role !== "MANAGER") return response.status(403).json({ message: "관리자 권한이 필요합니다." });
    if (!request.user.orgId) return response.status(403).json({ message: "아직 배정된 조직이 없습니다. ADMIN의 조직 승인 및 배정을 기다려주세요." });
    const organization = store.organizations.find((org) => org.id === request.user.orgId);
    if (!organization || organization.status !== "APPROVED") {
      return response.status(403).json({ message: "소속 조직이 승인된 상태가 아닙니다." });
    }
    request.organization = organization;
    return next();
  };

  // ---------------------------------------------------------------------
  // 공개 API
  // ---------------------------------------------------------------------
  app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
  app.get("/api/exams", (_request, response) => response.json(store.exams));
  app.get("/api/notices", (_request, response) => response.json(store.notices));

  // ---------------------------------------------------------------------
  // 1. 관리자(조직 담당자) 계정 가입 신청 + 조직 생성 요청
  // ---------------------------------------------------------------------
  app.post("/api/auth/signup", async (request, response, next) => {
    try {
      const { name, email, password, orgName } = request.body;
      if (![name, email, password, orgName].every(isNonEmptyText)) {
        return response.status(400).json({ message: "이름, 이메일, 비밀번호, 조직명을 모두 입력해주세요." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (store.users.some((user) => user.email === normalizedEmail)) {
        return response.status(409).json({ message: "이미 등록된 이메일입니다." });
      }

      // 응시자는 회원가입하지 않으며, ADMIN 계정은 ADMIN이 직접 발급한다.
      // 자가 가입은 관리자(조직 담당자) 계정만 허용되고, 가입과 동시에 조직 승인을 요청한다.
      const user = {
        id: randomUUID(),
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: "MANAGER",
        orgId: null
      };
      const organization = {
        id: randomUUID(),
        name: orgName.trim(),
        status: "PENDING",
        requestedBy: user.id,
        createdAt: new Date().toISOString(),
        decidedAt: null
      };

      const createdUser = await store.addUser(user);
      await store.addOrganization(organization);

      return response.status(201).json({ user: publicUser(createdUser), organization });
    } catch (error) {
      return next(error);
    }
  });

  // ---------------------------------------------------------------------
  // 2. 로그인 (ADMIN / MANAGER)
  // ---------------------------------------------------------------------
  app.post("/api/auth/login", async (request, response, next) => {
    try {
      const { email, password, role } = request.body;
      if (!roles.has(role)) return response.status(400).json({ message: "권한을 선택해주세요." });

      const user = store.users.find((candidate) => candidate.email === email?.trim().toLowerCase());
      if (!user || user.role !== role || !(await verifyPassword(password ?? "", user.passwordHash))) {
        return response.status(401).json({ message: "이메일, 비밀번호 또는 권한을 확인해주세요." });
      }

      const token = randomUUID();
      sessions.set(token, user.id);
      const organization = user.orgId ? store.organizations.find((org) => org.id === user.orgId) ?? null : null;
      return response.json({ token, user: publicUser(user), organization });
    } catch (error) {
      return next(error);
    }
  });

  // 새로고침 없이도 조직 승인/배정 결과를 반영할 수 있도록 현재 로그인 정보를 다시 조회한다.
  app.get("/api/auth/me", authenticate, (request, response) => {
    const organization = request.user.orgId ? store.organizations.find((org) => org.id === request.user.orgId) ?? null : null;
    return response.json({ user: publicUser(request.user), organization });
  });

  // =======================================================================
  // ADMIN: 조직 승인 및 배정
  // =======================================================================
  app.get("/api/admin/organizations", authenticate, requireRole("ADMIN"), (request, response) => {
    const { status } = request.query;
    const organizations = status ? store.organizations.filter((org) => org.status === status) : store.organizations;
    response.json(organizations);
  });

  const changeOrgStatus = (fromStatuses, toStatus) => async (request, response, next) => {
    try {
      const organization = store.organizations.find((org) => org.id === request.params.id);
      if (!organization) return response.status(404).json({ message: "조직을 찾을 수 없습니다." });
      if (!fromStatuses.includes(organization.status)) {
        return response.status(409).json({ message: `현재 상태(${organization.status})에서는 처리할 수 없습니다.` });
      }
      const updated = await store.updateOrganization(organization.id, { status: toStatus, decidedAt: new Date().toISOString() });
      return response.json({ message: "조직 상태가 변경되었습니다.", organization: updated });
    } catch (error) {
      return next(error);
    }
  };

  app.put("/api/admin/organizations/:id/approve", authenticate, requireRole("ADMIN"), changeOrgStatus(["PENDING", "REJECTED"], "APPROVED"));
  app.put("/api/admin/organizations/:id/reject", authenticate, requireRole("ADMIN"), changeOrgStatus(["PENDING"], "REJECTED"));
  app.put("/api/admin/organizations/:id/suspend", authenticate, requireRole("ADMIN"), changeOrgStatus(["APPROVED"], "SUSPENDED"));
  app.put("/api/admin/organizations/:id/reactivate", authenticate, requireRole("ADMIN"), changeOrgStatus(["SUSPENDED"], "APPROVED"));

  // =======================================================================
  // ADMIN: 관리자(조직 담당자) 계정 관리
  // =======================================================================
  app.get("/api/admin/managers", authenticate, requireRole("ADMIN"), (_request, response) => {
    response.json(store.users.filter((user) => user.role === "MANAGER").map(withOrgInfo(store)));
  });

  // ADMIN이 조직 배정 없이 관리자 계정을 직접 생성한다.
  app.post("/api/admin/managers", authenticate, requireRole("ADMIN"), async (request, response, next) => {
    try {
      const { name, email, password } = request.body;
      if (![name, email, password].every(isNonEmptyText)) {
        return response.status(400).json({ message: "이름, 이메일, 비밀번호를 입력해주세요." });
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (store.users.some((user) => user.email === normalizedEmail)) {
        return response.status(409).json({ message: "이미 등록된 이메일입니다." });
      }
      const createdUser = await store.addUser({
        id: randomUUID(), name: name.trim(), email: normalizedEmail, password, role: "MANAGER", orgId: null
      });
      return response.status(201).json({ user: withOrgInfo(store)(createdUser) });
    } catch (error) {
      return next(error);
    }
  });

  app.put("/api/admin/managers/:id/assign-org", authenticate, requireRole("ADMIN"), async (request, response, next) => {
    try {
      const manager = store.users.find((candidate) => candidate.id === request.params.id && candidate.role === "MANAGER");
      if (!manager) return response.status(404).json({ message: "관리자 계정을 찾을 수 없습니다." });

      const organization = store.organizations.find((org) => org.id === request.body.orgId);
      if (!organization) return response.status(404).json({ message: "조직을 찾을 수 없습니다." });
      if (organization.status !== "APPROVED") return response.status(409).json({ message: "승인된 조직만 배정할 수 있습니다." });

      const updated = await store.updateUser(manager.id, { orgId: organization.id });
      return response.json({ message: "조직이 배정되었습니다.", user: withOrgInfo(store)(updated) });
    } catch (error) {
      return next(error);
    }
  });

  app.put("/api/admin/managers/:id/unassign-org", authenticate, requireRole("ADMIN"), async (request, response, next) => {
    try {
      const manager = store.users.find((candidate) => candidate.id === request.params.id && candidate.role === "MANAGER");
      if (!manager) return response.status(404).json({ message: "관리자 계정을 찾을 수 없습니다." });
      const updated = await store.updateUser(manager.id, { orgId: null });
      return response.json({ message: "조직 배정이 해제되었습니다.", user: withOrgInfo(store)(updated) });
    } catch (error) {
      return next(error);
    }
  });

  // =======================================================================
  // ADMIN: 전체 조직/시험/응시자 통합 조회 및 통계
  // =======================================================================
  app.get("/api/admin/exams", authenticate, requireRole("ADMIN"), (_request, response) => {
    const withOrgName = store.exams.map((exam) => ({
      ...exam,
      orgName: store.organizations.find((org) => org.id === exam.orgId)?.name ?? "미상"
    }));
    response.json(withOrgName);
  });

  app.get("/api/admin/examinees", authenticate, requireRole("ADMIN"), (_request, response) => {
    const withOrgName = store.examinees.map((examinee) => ({
      ...examinee,
      orgName: store.organizations.find((org) => org.id === examinee.orgId)?.name ?? "미상"
    }));
    response.json(withOrgName);
  });

  app.get("/api/admin/overview", authenticate, requireRole("ADMIN"), (_request, response) => {
    const countBy = (list, key) => list.reduce((accumulator, item) => ({
      ...accumulator, [item[key]]: (accumulator[item[key]] ?? 0) + 1
    }), {});
    response.json({
      organizations: { total: store.organizations.length, ...countBy(store.organizations, "status") },
      managers: store.users.filter((user) => user.role === "MANAGER").length,
      exams: store.exams.length,
      examinees: store.examinees.length,
      warnings: store.warnings.length
    });
  });

  // =======================================================================
  // ADMIN: 전체 시스템 정책 및 LLM/AI 분석 설정
  // =======================================================================
  app.get("/api/admin/system-policy", authenticate, requireRole("ADMIN"), (_request, response) => {
    response.json(store.systemPolicy);
  });

  app.put("/api/admin/system-policy", authenticate, requireRole("ADMIN"), async (request, response, next) => {
    try {
      const { selfSignupEnabled, orgApprovalRequired, inviteLinkExpiryHours, dataRetentionDays } = request.body;
      const patch = {
        ...(typeof selfSignupEnabled === "boolean" ? { selfSignupEnabled } : {}),
        ...(typeof orgApprovalRequired === "boolean" ? { orgApprovalRequired } : {}),
        ...(Number.isFinite(Number(inviteLinkExpiryHours)) ? { inviteLinkExpiryHours: Number(inviteLinkExpiryHours) } : {}),
        ...(Number.isFinite(Number(dataRetentionDays)) ? { dataRetentionDays: Number(dataRetentionDays) } : {}),
        updatedAt: new Date().toISOString()
      };
      const systemPolicy = await store.updateSystemPolicy(patch);
      return response.json({ message: "시스템 정책이 저장되었습니다.", systemPolicy });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/admin/ai-config", authenticate, requireRole("ADMIN"), (_request, response) => {
    response.json(store.aiConfig);
  });

  app.put("/api/admin/ai-config", authenticate, requireRole("ADMIN"), async (request, response, next) => {
    try {
      const { model, webcamSensitivity } = request.body;
      if (!isNonEmptyText(model)) return response.status(400).json({ message: "LLM 모델을 선택해주세요." });
      const sensitivity = Number(webcamSensitivity);
      if (!Number.isFinite(sensitivity) || sensitivity < 1 || sensitivity > 100) {
        return response.status(400).json({ message: "웹캠 감독 민감도는 1~100 사이여야 합니다." });
      }
      const aiConfig = await store.updateAiConfig({ model: model.trim(), webcamSensitivity: sensitivity, updatedAt: new Date().toISOString() });
      return response.json({ message: "AI 분석 설정이 저장되었습니다.", aiConfig });
    } catch (error) {
      return next(error);
    }
  });

  // =======================================================================
  // MANAGER: 조직 신청 (아직 승인된 조직이 없는 관리자)
  // =======================================================================
  app.get("/api/manager/organization", authenticate, requireRole("MANAGER"), (request, response) => {
    if (request.user.orgId) {
      const organization = store.organizations.find((org) => org.id === request.user.orgId) ?? null;
      return response.json({ organization, assigned: true });
    }
    const latestRequest = store.organizations
      .filter((org) => org.requestedBy === request.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ?? null;
    // 조직 status가 APPROVED여도 ADMIN이 아직 이 계정에 배정(assign-org)하지 않았다면 업무 화면 접근은 불가하다.
    return response.json({ organization: latestRequest, assigned: false });
  });

  app.post("/api/manager/organization-requests", authenticate, requireRole("MANAGER"), async (request, response, next) => {
    try {
      if (request.user.orgId) return response.status(409).json({ message: "이미 배정된 조직이 있습니다." });
      const { orgName } = request.body;
      if (!isNonEmptyText(orgName)) return response.status(400).json({ message: "조직명을 입력해주세요." });

      const hasPendingRequest = store.organizations.some((org) => org.requestedBy === request.user.id && org.status === "PENDING");
      if (hasPendingRequest) return response.status(409).json({ message: "이미 승인 대기 중인 조직 신청이 있습니다." });

      const organization = {
        id: randomUUID(), name: orgName.trim(), status: "PENDING",
        requestedBy: request.user.id, createdAt: new Date().toISOString(), decidedAt: null
      };
      await store.addOrganization(organization);
      return response.status(201).json({ organization });
    } catch (error) {
      return next(error);
    }
  });

  // =======================================================================
  // MANAGER: 관리자 인원 추가 (동일 조직에 관리자 계정 추가)
  // =======================================================================
  app.get("/api/manager/teammates", authenticate, requireApprovedOrg, (request, response) => {
    const teammates = store.users
      .filter((user) => user.role === "MANAGER" && user.orgId === request.organization.id)
      .map(publicUser);
    response.json(teammates);
  });

  app.post("/api/manager/teammates", authenticate, requireApprovedOrg, async (request, response, next) => {
    try {
      const { name, email, password } = request.body;
      if (![name, email, password].every(isNonEmptyText)) {
        return response.status(400).json({ message: "이름, 이메일, 비밀번호를 입력해주세요." });
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (store.users.some((user) => user.email === normalizedEmail)) {
        return response.status(409).json({ message: "이미 등록된 이메일입니다." });
      }
      const createdUser = await store.addUser({
        id: randomUUID(), name: name.trim(), email: normalizedEmail, password, role: "MANAGER", orgId: request.organization.id
      });
      return response.status(201).json({ user: publicUser(createdUser) });
    } catch (error) {
      return next(error);
    }
  });

  // =======================================================================
  // MANAGER: 조직별 응시자 이메일 등록 (직접 입력 및 일괄 등록)
  // =======================================================================
  app.get("/api/manager/examinees", authenticate, requireApprovedOrg, (request, response) => {
    response.json(store.examinees.filter((examinee) => examinee.orgId === request.organization.id));
  });

  app.post("/api/manager/examinees", authenticate, requireApprovedOrg, async (request, response, next) => {
    try {
      const { entries } = request.body;
      if (!isNonEmptyArray(entries)) return response.status(400).json({ message: "등록할 응시자 정보를 입력해주세요." });

      const cleaned = entries
        .map((entry) => ({ name: entry?.name?.trim() ?? "", email: entry?.email?.trim().toLowerCase() ?? "" }))
        .filter((entry) => isNonEmptyText(entry.email));

      if (cleaned.length === 0) return response.status(400).json({ message: "유효한 이메일이 없습니다." });

      const existingEmails = new Set(store.examinees.filter((ex) => ex.orgId === request.organization.id).map((ex) => ex.email));
      const duplicates = cleaned.filter((entry) => existingEmails.has(entry.email));
      const toCreate = cleaned.filter((entry) => !existingEmails.has(entry.email));

      const created = toCreate.map((entry) => ({
        id: randomUUID(),
        orgId: request.organization.id,
        examId: null,
        name: entry.name || entry.email.split("@")[0],
        email: entry.email,
        examNumber: String(Math.floor(10000000 + Math.random() * 90000000)),
        status: "REGISTERED",
        statusText: "시험 대상자 배정 대기",
        currentProb: "-",
        invitedAt: null
      }));

      if (created.length > 0) await store.addExaminees(created);
      return response.status(201).json({ created, duplicates: duplicates.map((entry) => entry.email) });
    } catch (error) {
      return next(error);
    }
  });

  // =======================================================================
  // MANAGER: 시험 생성 및 일정 관리 + 시험 대상자 배정
  // =======================================================================
  app.get("/api/manager/exams", authenticate, requireApprovedOrg, (request, response) => {
    response.json(store.exams.filter((exam) => exam.orgId === request.organization.id));
  });

  app.post("/api/manager/exams", authenticate, requireApprovedOrg, async (request, response, next) => {
    try {
      const { title, duration, questions, date } = request.body;
      if (![title, duration, questions].every(isNonEmptyText)) {
        return response.status(400).json({ message: "시험명, 제한 시간, 문항 수를 입력해주세요." });
      }
      const exam = {
        id: randomUUID(),
        orgId: request.organization.id,
        title: title.trim(),
        duration: duration.trim(),
        questions: questions.trim(),
        category: "정규 평가",
        status: "AVAILABLE",
        date: isNonEmptyText(date) ? date.trim() : "일정 미정"
      };
      await store.addExam(exam);
      return response.status(201).json(exam);
    } catch (error) {
      return next(error);
    }
  });

  app.put("/api/manager/exams/:examId/assignees", authenticate, requireApprovedOrg, async (request, response, next) => {
    try {
      const exam = store.exams.find((candidate) => candidate.id === request.params.examId && candidate.orgId === request.organization.id);
      if (!exam) return response.status(404).json({ message: "시험을 찾을 수 없습니다." });

      const { examineeIds } = request.body;
      if (!isNonEmptyArray(examineeIds)) return response.status(400).json({ message: "배정할 응시자를 선택해주세요." });

      const assigned = [];
      for (const examineeId of examineeIds) {
        const examinee = store.examinees.find((candidate) => candidate.id === examineeId && candidate.orgId === request.organization.id);
        if (!examinee) continue;
        await store.updateExaminee(examinee.id, { examId: exam.id, statusText: "초대 메일 발송 대기" });
        assigned.push(examinee.id);
      }
      return response.json({ message: `${assigned.length}명의 응시자를 시험 대상자로 배정했습니다.`, assigned });
    } catch (error) {
      return next(error);
    }
  });

  // =======================================================================
  // MANAGER: 시험 초대 메일 일괄 발송
  // =======================================================================
  app.post("/api/manager/exams/:examId/invitations", authenticate, requireApprovedOrg, async (request, response, next) => {
    try {
      const exam = store.exams.find((candidate) => candidate.id === request.params.examId && candidate.orgId === request.organization.id);
      if (!exam) return response.status(404).json({ message: "시험을 찾을 수 없습니다." });

      const targets = store.examinees.filter((examinee) => examinee.orgId === request.organization.id && examinee.examId === exam.id);
      if (targets.length === 0) return response.status(400).json({ message: "이 시험에 배정된 응시자가 없습니다." });

      const now = new Date();
      const ttlMs = (store.systemPolicy.inviteLinkExpiryHours ?? 72) * 60 * 60 * 1000;
      const expiresAt = new Date(now.getTime() + (Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : INVITATION_TTL_MS)).toISOString();
      const invitations = targets.map((examinee) => ({
        id: randomUUID(),
        examId: exam.id,
        examineeId: examinee.id,
        token: randomUUID(),
        sentAt: now.toISOString(),
        expiresAt
      }));

      await store.addInvitations(invitations);
      for (const examinee of targets) {
        await store.updateExaminee(examinee.id, { invitedAt: now.toISOString(), statusText: "초대 메일 발송 완료" });
      }

      return response.status(201).json({ message: `${invitations.length}건의 초대 메일을 발송했습니다.`, invitations });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/manager/exams/:examId/invitations", authenticate, requireApprovedOrg, (request, response) => {
    const invitations = store.invitations.filter((invitation) => invitation.examId === request.params.examId);
    response.json(invitations);
  });

  // =======================================================================
  // MANAGER: 실시간 응시 현황, 이상 행동 확인, 경고 발송
  // =======================================================================
  app.post("/api/manager/examinees/:id/warnings", authenticate, requireApprovedOrg, async (request, response, next) => {
    try {
      const examinee = store.examinees.find((candidate) => candidate.id === request.params.id && candidate.orgId === request.organization.id);
      if (!examinee || !isNonEmptyText(request.body.message)) return response.status(400).json({ message: "경고 대상을 확인해주세요." });
      await store.addWarning({ id: randomUUID(), examineeId: examinee.id, message: request.body.message.trim(), createdAt: new Date().toISOString() });
      return response.status(201).json({ message: "경고를 전송했습니다." });
    } catch (error) {
      return next(error);
    }
  });

  // =======================================================================
  // MANAGER: 시험·문제·부정행위 정책 관리 (조직 범위)
  // =======================================================================
  app.get("/api/manager/policy", authenticate, requireApprovedOrg, async (request, response, next) => {
    try {
      const policy = await store.getOrgPolicy(request.organization.id);
      return response.json(policy);
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/manager/policy/problems", authenticate, requireApprovedOrg, async (request, response, next) => {
    try {
      const { title, points, languages } = request.body;
      if (!isNonEmptyText(title)) return response.status(400).json({ message: "문제 제목을 입력해주세요." });
      const problem = {
        id: randomUUID(),
        title: title.trim(),
        points: Number.isFinite(Number(points)) ? Number(points) : 25,
        languages: isNonEmptyText(languages) ? languages.trim() : "Python3"
      };
      const policy = await store.addPolicyProblem(request.organization.id, problem);
      return response.status(201).json(policy);
    } catch (error) {
      return next(error);
    }
  });

  app.put("/api/manager/policy/cheat-rules", authenticate, requireApprovedOrg, async (request, response, next) => {
    try {
      const { rules } = request.body;
      if (!isNonEmptyArray(rules)) return response.status(400).json({ message: "저장할 부정행위 정책을 선택해주세요." });
      const policy = await store.updatePolicyCheatRules(request.organization.id, rules);
      return response.json(policy);
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ message: "서버 오류가 발생했습니다." });
  });
  return app;
};
