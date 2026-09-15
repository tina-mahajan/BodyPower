-- ============================================================================
-- BodyPower Gym Management System - Production SQL Server DDL Schema Script
-- Instance: ASUS-VIVOBOOK\TINASQLSERVER
-- Database: BodyPowerGymDb (EMPTY - STRUCTURE ONLY, NO SEED/APPLICATION DATA)
-- ============================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'BodyPowerGymDb')
BEGIN
    CREATE DATABASE [BodyPowerGymDb];
END
GO

USE [BodyPowerGymDb];
GO

-- 1. Roles Table
IF OBJECT_ID(N'dbo.Roles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        Id NVARCHAR(50) NOT NULL,
        Name NVARCHAR(50) NOT NULL,
        NormalizedName NVARCHAR(50) NOT NULL,
        Description NVARCHAR(250) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT UQ_Roles_Name UNIQUE NONCLUSTERED (Name ASC),
        CONSTRAINT UQ_Roles_NormalizedName UNIQUE NONCLUSTERED (NormalizedName ASC)
    );
END
GO

-- 2. Users Table
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id NVARCHAR(50) NOT NULL,
        RoleId NVARCHAR(50) NOT NULL,
        FullName NVARCHAR(150) NOT NULL,
        Email NVARCHAR(256) NOT NULL,
        NormalizedEmail NVARCHAR(256) NOT NULL,
        Mobile NVARCHAR(20) NOT NULL,
        PasswordHash NVARCHAR(500) NOT NULL,
        AvatarUrl NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT UQ_Users_Email UNIQUE NONCLUSTERED (Email ASC),
        CONSTRAINT UQ_Users_NormalizedEmail UNIQUE NONCLUSTERED (NormalizedEmail ASC),
        CONSTRAINT UQ_Users_Mobile UNIQUE NONCLUSTERED (Mobile ASC),
        CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id) ON DELETE NO ACTION
    );
    CREATE NONCLUSTERED INDEX IX_Users_RoleId ON dbo.Users(RoleId ASC);
    CREATE NONCLUSTERED INDEX IX_Users_IsActive ON dbo.Users(IsActive ASC);
END
GO

-- 3. MembershipPlans Table
IF OBJECT_ID(N'dbo.MembershipPlans', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.MembershipPlans (
        Id NVARCHAR(50) NOT NULL,
        Name NVARCHAR(100) NOT NULL,
        DurationMonths INT NOT NULL,
        Price DECIMAL(18, 2) NOT NULL,
        Description NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT PK_MembershipPlans PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT CK_MembershipPlans_DurationMonths CHECK (DurationMonths > 0),
        CONSTRAINT CK_MembershipPlans_Price CHECK (Price >= 0)
    );
    CREATE NONCLUSTERED INDEX IX_MembershipPlans_IsActive ON dbo.MembershipPlans(IsActive ASC);
END
GO

-- 4. Members Table
IF OBJECT_ID(N'dbo.Members', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Members (
        Id NVARCHAR(50) NOT NULL,
        MemberId NVARCHAR(30) NOT NULL,
        FullName NVARCHAR(150) NOT NULL,
        Mobile NVARCHAR(20) NOT NULL,
        Email NVARCHAR(256) NULL,
        DateOfBirth DATE NULL,
        Gender NVARCHAR(20) NULL,
        Address NVARCHAR(500) NULL,
        PhotoUrl NVARCHAR(500) NULL,
        MemberStatus NVARCHAR(30) NOT NULL DEFAULT N'active',
        JoinedOn DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        InactiveSince DATE NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedByUserId NVARCHAR(50) NULL,
        UpdatedAt DATETIME2 NULL,
        UpdatedByUserId NVARCHAR(50) NULL,
        CONSTRAINT PK_Members PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT UQ_Members_MemberId UNIQUE NONCLUSTERED (MemberId ASC),
        CONSTRAINT UQ_Members_Mobile UNIQUE NONCLUSTERED (Mobile ASC),
        CONSTRAINT FK_Members_CreatedByUser FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Members_UpdatedByUser FOREIGN KEY (UpdatedByUserId) REFERENCES dbo.Users(Id) ON DELETE NO ACTION
    );
    CREATE NONCLUSTERED INDEX IX_Members_MemberStatus ON dbo.Members(MemberStatus ASC);
    CREATE NONCLUSTERED INDEX IX_Members_FullName ON dbo.Members(FullName ASC);
    CREATE NONCLUSTERED INDEX IX_Members_Mobile ON dbo.Members(Mobile ASC);
END
GO

-- 5. Memberships Table
IF OBJECT_ID(N'dbo.Memberships', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Memberships (
        Id NVARCHAR(50) NOT NULL,
        MemberId NVARCHAR(50) NOT NULL,
        PlanId NVARCHAR(50) NOT NULL,
        StartDate DATE NOT NULL,
        EndDate DATE NOT NULL,
        PlanFee DECIMAL(18, 2) NOT NULL,
        Status NVARCHAR(30) NOT NULL DEFAULT N'active',
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedByUserId NVARCHAR(50) NULL,
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT PK_Memberships PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT CK_Memberships_PlanFee CHECK (PlanFee >= 0),
        CONSTRAINT FK_Memberships_Members FOREIGN KEY (MemberId) REFERENCES dbo.Members(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Memberships_Plans FOREIGN KEY (PlanId) REFERENCES dbo.MembershipPlans(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Memberships_CreatedByUser FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(Id) ON DELETE NO ACTION
    );
    CREATE NONCLUSTERED INDEX IX_Memberships_MemberId ON dbo.Memberships(MemberId ASC);
    CREATE NONCLUSTERED INDEX IX_Memberships_PlanId ON dbo.Memberships(PlanId ASC);
    CREATE NONCLUSTERED INDEX IX_Memberships_EndDate ON dbo.Memberships(EndDate ASC);
    CREATE NONCLUSTERED INDEX IX_Memberships_Status ON dbo.Memberships(Status ASC);
END
GO

-- 6. Payments Table (Authoritative Financial Source of Truth)
IF OBJECT_ID(N'dbo.Payments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Payments (
        Id NVARCHAR(50) NOT NULL,
        MemberId NVARCHAR(50) NOT NULL,
        MembershipId NVARCHAR(50) NULL,
        Amount DECIMAL(18, 2) NOT NULL,
        PaymentDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        PaymentMethod NVARCHAR(30) NOT NULL,
        Notes NVARCHAR(500) NULL,
        Status NVARCHAR(30) NOT NULL DEFAULT N'paid',
        RecordedByUserId NVARCHAR(50) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Payments PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT CK_Payments_Amount CHECK (Amount > 0),
        CONSTRAINT FK_Payments_Members FOREIGN KEY (MemberId) REFERENCES dbo.Members(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Payments_Memberships FOREIGN KEY (MembershipId) REFERENCES dbo.Memberships(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Payments_RecordedByUser FOREIGN KEY (RecordedByUserId) REFERENCES dbo.Users(Id) ON DELETE NO ACTION
    );
    CREATE NONCLUSTERED INDEX IX_Payments_MemberId ON dbo.Payments(MemberId ASC);
    CREATE NONCLUSTERED INDEX IX_Payments_MembershipId ON dbo.Payments(MembershipId ASC);
    CREATE NONCLUSTERED INDEX IX_Payments_PaymentDate ON dbo.Payments(PaymentDate ASC);
END
GO

-- 7. Notifications Table
IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        Id NVARCHAR(50) NOT NULL,
        UserId NVARCHAR(50) NULL,
        MemberId NVARCHAR(50) NULL,
        Type NVARCHAR(30) NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Message NVARCHAR(1000) NOT NULL,
        Priority NVARCHAR(20) NOT NULL DEFAULT N'medium',
        IsRead BIT NOT NULL DEFAULT 0,
        ReadAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Notifications PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Notifications_Members FOREIGN KEY (MemberId) REFERENCES dbo.Members(Id) ON DELETE NO ACTION
    );
    CREATE NONCLUSTERED INDEX IX_Notifications_UserId ON dbo.Notifications(UserId ASC);
    CREATE NONCLUSTERED INDEX IX_Notifications_IsRead ON dbo.Notifications(IsRead ASC);
    CREATE NONCLUSTERED INDEX IX_Notifications_CreatedAt ON dbo.Notifications(CreatedAt ASC);
END
GO

-- 8. ReminderEvents Table (Idempotency Engine for Reminders)
IF OBJECT_ID(N'dbo.ReminderEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ReminderEvents (
        Id NVARCHAR(50) NOT NULL,
        MemberId NVARCHAR(50) NOT NULL,
        MembershipId NVARCHAR(50) NULL,
        EventType NVARCHAR(50) NOT NULL,
        EventDate DATE NOT NULL,
        ProcessedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_ReminderEvents PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT FK_ReminderEvents_Members FOREIGN KEY (MemberId) REFERENCES dbo.Members(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_ReminderEvents_Memberships FOREIGN KEY (MembershipId) REFERENCES dbo.Memberships(Id) ON DELETE NO ACTION
    );
    CREATE UNIQUE NONCLUSTERED INDEX UX_ReminderEvents_Member_Membership_Type_Date 
    ON dbo.ReminderEvents(MemberId ASC, MembershipId ASC, EventType ASC, EventDate ASC);
END
GO

-- 9. GymSettings Table
IF OBJECT_ID(N'dbo.GymSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GymSettings (
        Id NVARCHAR(50) NOT NULL,
        GymName NVARCHAR(150) NOT NULL,
        Phone NVARCHAR(50) NOT NULL,
        Address NVARCHAR(500) NOT NULL,
        LogoUrl NVARCHAR(500) NULL,
        ReminderDaysJson NVARCHAR(100) NOT NULL DEFAULT N'[3,1]',
        InactiveAfterMonths INT NOT NULL DEFAULT 2,
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_GymSettings PRIMARY KEY CLUSTERED (Id ASC)
    );
END
GO
