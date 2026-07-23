import express from "express";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { createStore, verifyPassword } from "./store.mjs";

const roles = new Set(["SUPERVISOR", "ADMIN"]);
const isNonEmptyText = (value) => typeof value === "string" && value.trim().length > 0;
const publicUser = ({ password, passwordHash, ...user }) => user;

const requestUser = (sessions) => (request, response, next) => {
  const token = request.header("authorization")?.replace("Bearer ", "");
  const user = token ? sessions.get(token) : undefined;
  if (!user) return response.status(401).json({ message: "로그인이 필요합니다." });
  request.user = user;
  return next();
};

const requireRole = (role) => (request, response, next) => {
  if (request.user.role !== role) return response.status(403).json({ message: "권한이 없습니다." });
  return next();
};

export const createApp = async ({ databasePath = resolve("data/database.json") } = {}) => {
  const store = await createStore(databasePath);
  const sessions = new Map();
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (request.method === "OPTIONS") return response.sendStatus(204);
    return next();
  });

  app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
  app.get("/api/exams", (_request, response) => response.json(store.exams));
  app.get("/api/notices", (_request, response) => response.json(store.notices));

  // 1. 감독관 회원가입 및 승인 대기(PENDING) 처리
  app.post("/api/auth/signup", async (request, response, next) => {
    try {
      const { name, email, password, role } = request.body;
      if (!isNonEmptyText(name) || !isNonEmptyText(email) || !isNonEmptyText(password) || !roles.has(role)) {
        return response.status(400).json({ message: "회원가입 정보를 다시 확인해주세요." });
      }
      if (role !== "SUPERVISOR") {
        return response.status(403).json({ message: "현재 감독관 계정만 회원가입할 수 있습니다." });
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (store.users.some((user) => user.email === normalizedEmail)) {
        return response.status(409).json({ message: "이미 등록된 이메일입니다." });
      }

      const user = {
        id: randomUUID(),
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: "SUPERVISOR",
        approvalStatus: "PENDING" // 가입 시 승인 대기 상태 부여
      };

      await store.addUser(user);
      return response.status(201).json({ user: publicUser(user) });
    } catch (error) {
      return next(error);
    }
  });

  // 2. 로그인 시 감독관 승인 여부 검증
  app.post("/api/auth/login", async (request, response, next) => {
    try {
      const { email, password, role } = request.body;
      const user = store.users.find((candidate) => candidate.email === email?.trim().toLowerCase());

      if (!user || user.role !== role || !(await verifyPassword(password ?? "", user.passwordHash))) {
        return response.status(401).json({ message: "이메일, 비밀번호 또는 권한을 확인해주세요." });
      }

      // 감독관 계정인데 아직 관리자 승인이 안 된 경우 차단
      if (user.role === "SUPERVISOR" && user.approvalStatus !== "APPROVED") {
        return response.status(403).json({ message: "관리자의 승인 대기 중인 계정입니다. 승인 후 로그인할 수 있습니다." });
      }

      const token = randomUUID();
      const safeUser = publicUser(user);
      sessions.set(token, safeUser);
      return response.json({ token, user: safeUser });
    } catch (error) {
      return next(error);
    }
  });

  const authenticate = requestUser(sessions);

  // 3. 관리자용 감독관 목록 조회 API
  app.get("/api/admin/users", authenticate, requireRole("ADMIN"), (_request, response) => {
    response.json(store.users.filter((user) => user.role === "SUPERVISOR").map(publicUser));
  });

  // 4. 관리자의 감독관 승인 처리 API
  app.put("/api/admin/users/:id/approve", authenticate, requireRole("ADMIN"), async (request, response, next) => {
    try {
      const user = store.users.find((candidate) => candidate.id === request.params.id);
      if (!user) {
        return response.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }

      user.approvalStatus = "APPROVED"; // 승인 상태로 업데이트
      return response.json({ message: "성공적으로 승인되었습니다.", user: publicUser(user) });
    } catch (error) {
      return next(error);
    }
  });

  // 5. 관리자의 감독관 권한 취소 처리 API
  app.put("/api/admin/users/:id/revoke", authenticate, requireRole("ADMIN"), async (request, response, next) => {
    try {
      const user = store.users.find((candidate) => candidate.id === request.params.id);
      if (!user) {
        return response.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }

      user.approvalStatus = "PENDING"; // 권한 취소 시 다시 대기(PENDING) 상태로 변경
      return response.json({ message: "감독관 권한이 취소되었습니다.", user: publicUser(user) });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/admin/exams", authenticate, requireRole("ADMIN"), async (request, response, next) => {
    try {
      const { title, duration, questions } = request.body;
      if (![title, duration, questions].every(isNonEmptyText)) {
        return response.status(400).json({ message: "시험명, 제한 시간, 문항 수를 입력해주세요." });
      }
      const exam = {
        id: randomUUID(), title: title.trim(), duration: duration.trim(), questions: questions.trim(),
        category: "정규 평가", status: "AVAILABLE", date: "일정 미정"
      };
      await store.addExam(exam);
      return response.status(201).json(exam);
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/supervisor/examinees", authenticate, requireRole("SUPERVISOR"), (_request, response) => response.json(store.examinees));
  app.post("/api/supervisor/examinees/:id/warnings", authenticate, requireRole("SUPERVISOR"), async (request, response, next) => {
    try {
      const examinee = store.examinees.find((candidate) => candidate.id === request.params.id);
      if (!examinee || !isNonEmptyText(request.body.message)) return response.status(400).json({ message: "경고 대상을 확인해주세요." });
      await store.addWarning({ id: randomUUID(), examineeId: examinee.id, message: request.body.message.trim(), createdAt: new Date().toISOString() });
      return response.status(201).json({ message: "경고를 전송했습니다." });
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