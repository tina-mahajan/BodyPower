-- ============================================================================
-- BodyPower Gym Management System - Production PostgreSQL Schema (Native EF Core)
-- Target: Supabase Free PostgreSQL / Cloud PostgreSQL
-- ============================================================================

-- 1. GymSettings
CREATE TABLE IF NOT EXISTS "GymSettings" (
    "Id" VARCHAR(50) NOT NULL,
    "GymName" VARCHAR(150) NOT NULL,
    "Phone" VARCHAR(50) NOT NULL,
    "Address" VARCHAR(500) NOT NULL,
    "LogoUrl" VARCHAR(500) NULL,
    "ReminderDaysJson" VARCHAR(100) NOT NULL,
    "InactiveAfterMonths" INTEGER NOT NULL,
    "UpdatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "PK_GymSettings" PRIMARY KEY ("Id")
);

-- 2. MembershipPlans
CREATE TABLE IF NOT EXISTS "MembershipPlans" (
    "Id" VARCHAR(50) NOT NULL,
    "Name" VARCHAR(100) NOT NULL,
    "DurationMonths" INTEGER NOT NULL,
    "Price" NUMERIC(18,2) NOT NULL,
    "Description" VARCHAR(500) NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMPTZ NOT NULL,
    "UpdatedAt" TIMESTAMPTZ NULL,
    CONSTRAINT "PK_MembershipPlans" PRIMARY KEY ("Id"),
    CONSTRAINT "CK_MembershipPlans_DurationMonths" CHECK ("DurationMonths" > 0),
    CONSTRAINT "CK_MembershipPlans_Price" CHECK ("Price" >= 0)
);
CREATE INDEX IF NOT EXISTS "IX_MembershipPlans_IsActive" ON "MembershipPlans" ("IsActive");

-- 3. Roles
CREATE TABLE IF NOT EXISTS "Roles" (
    "Id" VARCHAR(50) NOT NULL,
    "Name" VARCHAR(50) NOT NULL,
    "NormalizedName" VARCHAR(50) NOT NULL,
    "Description" VARCHAR(250) NULL,
    "CreatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "PK_Roles" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_Roles_Name" UNIQUE ("Name"),
    CONSTRAINT "UQ_Roles_NormalizedName" UNIQUE ("NormalizedName")
);

-- 4. Users
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" VARCHAR(50) NOT NULL,
    "RoleId" VARCHAR(50) NOT NULL,
    "FullName" VARCHAR(150) NOT NULL,
    "Email" VARCHAR(256) NOT NULL,
    "NormalizedEmail" VARCHAR(256) NOT NULL,
    "Mobile" VARCHAR(20) NOT NULL,
    "PasswordHash" VARCHAR(500) NOT NULL,
    "AvatarUrl" VARCHAR(500) NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMPTZ NOT NULL,
    "UpdatedAt" TIMESTAMPTZ NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_Users_Email" UNIQUE ("Email"),
    CONSTRAINT "UQ_Users_NormalizedEmail" UNIQUE ("NormalizedEmail"),
    CONSTRAINT "UQ_Users_Mobile" UNIQUE ("Mobile"),
    CONSTRAINT "FK_Users_Roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "Roles" ("Id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "IX_Users_RoleId" ON "Users" ("RoleId");
CREATE INDEX IF NOT EXISTS "IX_Users_IsActive" ON "Users" ("IsActive");

-- 5. Members
CREATE TABLE IF NOT EXISTS "Members" (
    "Id" VARCHAR(50) NOT NULL,
    "MemberId" VARCHAR(30) NOT NULL,
    "FullName" VARCHAR(150) NOT NULL,
    "Mobile" VARCHAR(20) NOT NULL,
    "Email" VARCHAR(256) NULL,
    "DateOfBirth" DATE NULL,
    "Gender" VARCHAR(20) NULL,
    "Address" VARCHAR(500) NULL,
    "PhotoUrl" VARCHAR(500) NULL,
    "MemberStatus" VARCHAR(30) NOT NULL DEFAULT 'active',
    "JoinedOn" DATE NOT NULL,
    "InactiveSince" DATE NULL,
    "CreatedAt" TIMESTAMPTZ NOT NULL,
    "CreatedByUserId" VARCHAR(50) NULL,
    "UpdatedAt" TIMESTAMPTZ NULL,
    "UpdatedByUserId" VARCHAR(50) NULL,
    CONSTRAINT "PK_Members" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_Members_MemberId" UNIQUE ("MemberId"),
    CONSTRAINT "UQ_Members_Mobile" UNIQUE ("Mobile"),
    CONSTRAINT "FK_Members_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE NO ACTION,
    CONSTRAINT "FK_Members_Users_UpdatedByUserId" FOREIGN KEY ("UpdatedByUserId") REFERENCES "Users" ("Id") ON DELETE NO ACTION
);
CREATE INDEX IF NOT EXISTS "IX_Members_FullName" ON "Members" ("FullName");
CREATE INDEX IF NOT EXISTS "IX_Members_MemberStatus" ON "Members" ("MemberStatus");
CREATE INDEX IF NOT EXISTS "IX_Members_CreatedByUserId" ON "Members" ("CreatedByUserId");
CREATE INDEX IF NOT EXISTS "IX_Members_UpdatedByUserId" ON "Members" ("UpdatedByUserId");

-- 6. Memberships
CREATE TABLE IF NOT EXISTS "Memberships" (
    "Id" VARCHAR(50) NOT NULL,
    "MemberId" VARCHAR(50) NOT NULL,
    "PlanId" VARCHAR(50) NOT NULL,
    "StartDate" DATE NOT NULL,
    "EndDate" DATE NOT NULL,
    "PlanFee" NUMERIC(18,2) NOT NULL,
    "Status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "CreatedAt" TIMESTAMPTZ NOT NULL,
    "CreatedByUserId" VARCHAR(50) NULL,
    "UpdatedAt" TIMESTAMPTZ NULL,
    CONSTRAINT "PK_Memberships" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Memberships_Members_MemberId" FOREIGN KEY ("MemberId") REFERENCES "Members" ("Id") ON DELETE NO ACTION,
    CONSTRAINT "FK_Memberships_MembershipPlans_PlanId" FOREIGN KEY ("PlanId") REFERENCES "MembershipPlans" ("Id") ON DELETE NO ACTION,
    CONSTRAINT "FK_Memberships_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE NO ACTION
);
CREATE INDEX IF NOT EXISTS "IX_Memberships_MemberId" ON "Memberships" ("MemberId");
CREATE INDEX IF NOT EXISTS "IX_Memberships_PlanId" ON "Memberships" ("PlanId");
CREATE INDEX IF NOT EXISTS "IX_Memberships_EndDate" ON "Memberships" ("EndDate");
CREATE INDEX IF NOT EXISTS "IX_Memberships_Status" ON "Memberships" ("Status");

-- 7. Notifications
CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id" VARCHAR(50) NOT NULL,
    "UserId" VARCHAR(50) NULL,
    "MemberId" VARCHAR(50) NULL,
    "Type" VARCHAR(30) NOT NULL,
    "Title" VARCHAR(200) NOT NULL,
    "Message" VARCHAR(1000) NOT NULL,
    "Priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "IsRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "ReadAt" TIMESTAMPTZ NULL,
    "CreatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Notifications_Members_MemberId" FOREIGN KEY ("MemberId") REFERENCES "Members" ("Id") ON DELETE NO ACTION,
    CONSTRAINT "FK_Notifications_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE NO ACTION
);
CREATE INDEX IF NOT EXISTS "IX_Notifications_Type" ON "Notifications" ("Type");
CREATE INDEX IF NOT EXISTS "IX_Notifications_IsRead" ON "Notifications" ("IsRead");
CREATE INDEX IF NOT EXISTS "IX_Notifications_CreatedAt" ON "Notifications" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Notifications_MemberId" ON "Notifications" ("MemberId");

-- 8. Payments
CREATE TABLE IF NOT EXISTS "Payments" (
    "Id" VARCHAR(50) NOT NULL,
    "MemberId" VARCHAR(50) NOT NULL,
    "MembershipId" VARCHAR(50) NULL,
    "Amount" NUMERIC(18,2) NOT NULL,
    "PaymentDate" DATE NOT NULL,
    "PaymentMethod" VARCHAR(30) NOT NULL DEFAULT 'cash',
    "Notes" VARCHAR(500) NULL,
    "Status" VARCHAR(30) NOT NULL DEFAULT 'paid',
    "RecordedByUserId" VARCHAR(50) NULL,
    "CreatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "PK_Payments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Payments_Members_MemberId" FOREIGN KEY ("MemberId") REFERENCES "Members" ("Id") ON DELETE NO ACTION,
    CONSTRAINT "FK_Payments_Memberships_MembershipId" FOREIGN KEY ("MembershipId") REFERENCES "Memberships" ("Id") ON DELETE NO ACTION,
    CONSTRAINT "FK_Payments_Users_RecordedByUserId" FOREIGN KEY ("RecordedByUserId") REFERENCES "Users" ("Id") ON DELETE NO ACTION
);
CREATE INDEX IF NOT EXISTS "IX_Payments_MemberId" ON "Payments" ("MemberId");
CREATE INDEX IF NOT EXISTS "IX_Payments_MembershipId" ON "Payments" ("MembershipId");
CREATE INDEX IF NOT EXISTS "IX_Payments_PaymentDate" ON "Payments" ("PaymentDate");

-- 9. ReminderEvents
CREATE TABLE IF NOT EXISTS "ReminderEvents" (
    "Id" VARCHAR(50) NOT NULL,
    "MemberId" VARCHAR(50) NOT NULL,
    "MembershipId" VARCHAR(50) NULL,
    "EventType" VARCHAR(50) NOT NULL,
    "EventDate" DATE NOT NULL,
    "ProcessedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "PK_ReminderEvents" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_ReminderEvents_Dedup" UNIQUE ("MemberId", "MembershipId", "EventType", "EventDate"),
    CONSTRAINT "FK_ReminderEvents_Members_MemberId" FOREIGN KEY ("MemberId") REFERENCES "Members" ("Id") ON DELETE NO ACTION,
    CONSTRAINT "FK_ReminderEvents_Memberships_MembershipId" FOREIGN KEY ("MembershipId") REFERENCES "Memberships" ("Id") ON DELETE NO ACTION
);
CREATE INDEX IF NOT EXISTS "IX_ReminderEvents_MemberId" ON "ReminderEvents" ("MemberId");
CREATE INDEX IF NOT EXISTS "IX_ReminderEvents_MembershipId" ON "ReminderEvents" ("MembershipId");

-- ============================================================================
-- Insert ONLY the 8 verified real records (Zero demo/sample data)
-- ============================================================================

-- Roles
INSERT INTO "Roles" ("Id", "Name", "NormalizedName", "Description", "CreatedAt")
VALUES 
('admin', 'Admin', 'ADMIN', 'Full administrative system access', NOW()),
('manager', 'Manager', 'MANAGER', 'Operational front-desk access', NOW())
ON CONFLICT ("Id") DO NOTHING;

-- Users (Exact real accounts with hashed passwords)
INSERT INTO "Users" ("Id", "RoleId", "FullName", "Email", "NormalizedEmail", "Mobile", "PasswordHash", "AvatarUrl", "IsActive", "CreatedAt", "UpdatedAt")
VALUES 
('u-admin-1', 'admin', 'Yogesh Gopal Mahajan', 'yogeshmahajan@gmail.com', 'YOGESHMAHAJAN@GMAIL.COM', '7410584858', 'AQAAAAIAAYagAAAAEG4xcW9wClQyCwGNHVIRFjrn1KSv0EVHrru7wNX3gpRxQDHkxkSR586HvtB9piBZeA==', NULL, TRUE, NOW(), NULL),
('u-1789466564806', 'admin', 'Rahul Mali', 'rahulmali@gmail.com', 'RAHULMALI@GMAIL.COM', '8600276867', 'AQAAAAIAAYagAAAAEKINGkYYLvpj9LxXjRbr1G7u/ymbaAlAxS+nddbEFdYOkuH2WBQHKn8AL1X3s7nDOw==', NULL, TRUE, NOW(), NULL),
('u-1789469393891', 'manager', 'Juber sir', 'juber@gmail.com', 'JUBER@GMAIL.COM', '9993090118', 'AQAAAAIAAYagAAAAEDj1SweV3tgtCv80d5DIX73FZiOuBlxhEO+vfEfrQAwu0M+Rwge4rp6jdP5cPAICAw==', NULL, TRUE, NOW(), NULL)
ON CONFLICT ("Id") DO NOTHING;

-- Membership Plans
INSERT INTO "MembershipPlans" ("Id", "Name", "DurationMonths", "Price", "Description", "IsActive", "CreatedAt", "UpdatedAt")
VALUES 
('p-1789465083729', 'Monthly Plan', 1, 600.00, NULL, TRUE, NOW(), NULL),
('p-1789465216281', 'Quarterly Plan', 3, 1600.00, NULL, TRUE, NOW(), NULL)
ON CONFLICT ("Id") DO NOTHING;

-- Gym Settings
INSERT INTO "GymSettings" ("Id", "GymName", "Phone", "Address", "LogoUrl", "ReminderDaysJson", "InactiveAfterMonths", "UpdatedAt")
VALUES 
('gym-default', 'BodyPower Gym', '7410584858', 'Main Branch', NULL, '[3,1]', 2, NOW())
ON CONFLICT ("Id") DO NOTHING;
