import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("saved sync cron controls Hangfire jobs", () => {
  const program = read("ScientificJournalTrendSystem/ScientificJournal.API/Program.cs");
  const controller = read("ScientificJournalTrendSystem/ScientificJournal.API/Controllers/AdminController.cs");
  assert.match(program, /StateKey == "sync-config"/);
  assert.match(program, /syncCron/);
  assert.match(controller, /ConfigureRecurringJob<SemanticScholarSyncJob>/);
  assert.match(controller, /ConfigureRecurringJob<OpenAlexSyncJob>/);
});

test("local credential users are not sent through external identity sync", () => {
  const server = read("server/server.js");
  const adminController = read(
    "ScientificJournalTrendSystem/ScientificJournal.API/Controllers/AdminController.cs",
  );

  assert.match(server, /user\.provider[\s\S]*toLowerCase\(\)[\s\S]*=== "local"/);
  assert.match(adminController, /string\.Equals\(request\.Provider\.Trim\(\), "Local"/);
});

test("administrator can reset an existing SQL user's password", () => {
  const controller = read(
    "ScientificJournalTrendSystem/ScientificJournal.API/Controllers/AdminController.cs",
  );

  assert.match(controller, /users\/\{id:int\}\/reset-password/);
  assert.match(controller, /PasswordHasher\.HashPassword\(request\.NewPassword\)/);
  assert.match(controller, /ADMIN-PASSWORD-RESET/);
});

test("administrator plan changes set the requested state instead of blindly toggling", () => {
  const controller = read(
    "ScientificJournalTrendSystem/ScientificJournal.API/Controllers/AdminController.cs",
  );
  const app = read("src/App.jsx");

  assert.match(controller, /request\?\.IsPro \?\? !user\.IsPro/);
  assert.match(app, /body: \{ isPro: Boolean\(patch\.isPro\) \}/);
});

test("notification pending and failed summary is not coerced into NaN", () => {
  const app = read("src/App.jsx");

  assert.match(app, /typeof value === "number" \? formatCount\(value\) : value/);
});

test("registration has no shared default password and account access stays consistent", () => {
  const app = read("src/App.jsx");
  const admin = read(
    "ScientificJournalTrendSystem/ScientificJournal.API/Controllers/AdminController.cs",
  );

  assert.doesNotMatch(app, /useState\("Scholar2024"\)/);
  assert.doesNotMatch(app, /ACADEMIC_PROVIDER_TEST_PASSWORD/);
  assert.match(admin, /newRole is UserRole\.Lecturer or UserRole\.Researcher/);
  assert.match(admin, /user\.Role = UserRole\.Student/);
});

test("publication review uses an optimistic concurrency token", () => {
  const entity = read("ScientificJournalTrendSystem/ScientificJournal.DataAccess/Entities/PublicationSubmission.cs");
  const controller = read("ScientificJournalTrendSystem/ScientificJournal.API/Controllers/PublicationsController.cs");
  assert.match(entity, /\[Timestamp\]/);
  assert.match(controller, /DbUpdateConcurrencyException/);
  assert.match(controller, /Status = "reviewing"/);
});

test("publication version history is persisted and exposed", () => {
  const context = read("ScientificJournalTrendSystem/ScientificJournal.DataAccess/Context/AppDbContext.cs");
  const controller = read("ScientificJournalTrendSystem/ScientificJournal.API/Controllers/PublicationsController.cs");
  assert.match(context, /DbSet<PublicationVersion>/);
  assert.match(controller, /HttpGet\("\{id:int\}\/versions"\)/);
  assert.match(controller, /PublicationVersions\.Add/);
});

test("notification broadcasts are bulk scheduled and tracked", () => {
  const controller = read("ScientificJournalTrendSystem/ScientificJournal.API/Controllers/AdminController.cs");
  const job = read("ScientificJournalTrendSystem/ScientificJournal.Business/Jobs/NotificationJob.cs");
  assert.match(controller, /INSERT INTO notifications/);
  assert.match(controller, /notifications\/analytics/);
  assert.match(job, /DeliveryStatus == "pending"/);
  assert.match(job, /DeliveryStatus = "dispatched"/);
  assert.match(job, /AttemptCount/);
  assert.match(job, /NextAttemptAt/);
  const notificationsController = read("ScientificJournalTrendSystem/ScientificJournal.API/Controllers/NotificationsController.cs");
  assert.match(notificationsController, /Acknowledge/);
});

test("system audit middleware records API and denied access events", () => {
  const middleware = read("ScientificJournalTrendSystem/ScientificJournal.API/Middleware/SystemAuditMiddleware.cs");
  assert.match(middleware, /ACCESS-DENIED/);
  assert.match(middleware, /SystemEventLogs\.Add/);
  assert.match(middleware, /\/api\/payments/);
});
