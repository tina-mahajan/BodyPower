IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [GymSettings] (
    [Id] nvarchar(50) NOT NULL,
    [GymName] nvarchar(150) NOT NULL,
    [Phone] nvarchar(50) NOT NULL,
    [Address] nvarchar(500) NOT NULL,
    [LogoUrl] nvarchar(500) NULL,
    [ReminderDaysJson] nvarchar(100) NOT NULL,
    [InactiveAfterMonths] int NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_GymSettings] PRIMARY KEY ([Id])
);

CREATE TABLE [MembershipPlans] (
    [Id] nvarchar(50) NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [DurationMonths] int NOT NULL,
    [Price] decimal(18,2) NOT NULL,
    [Description] nvarchar(500) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_MembershipPlans] PRIMARY KEY ([Id])
);

CREATE TABLE [Roles] (
    [Id] nvarchar(50) NOT NULL,
    [Name] nvarchar(50) NOT NULL,
    [NormalizedName] nvarchar(50) NOT NULL,
    [Description] nvarchar(250) NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
);

CREATE TABLE [Users] (
    [Id] nvarchar(50) NOT NULL,
    [RoleId] nvarchar(50) NOT NULL,
    [FullName] nvarchar(150) NOT NULL,
    [Email] nvarchar(256) NOT NULL,
    [NormalizedEmail] nvarchar(256) NOT NULL,
    [Mobile] nvarchar(20) NOT NULL,
    [PasswordHash] nvarchar(500) NOT NULL,
    [AvatarUrl] nvarchar(500) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Users_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Members] (
    [Id] nvarchar(50) NOT NULL,
    [MemberId] nvarchar(30) NOT NULL,
    [FullName] nvarchar(150) NOT NULL,
    [Mobile] nvarchar(20) NOT NULL,
    [Email] nvarchar(256) NULL,
    [DateOfBirth] date NULL,
    [Gender] nvarchar(20) NULL,
    [Address] nvarchar(500) NULL,
    [PhotoUrl] nvarchar(500) NULL,
    [MemberStatus] nvarchar(30) NOT NULL,
    [InactiveSince] date NULL,
    [JoinedOn] date NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedByUserId] nvarchar(50) NULL,
    [UpdatedAt] datetime2 NULL,
    [UpdatedByUserId] nvarchar(50) NULL,
    CONSTRAINT [PK_Members] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Members_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]),
    CONSTRAINT [FK_Members_Users_UpdatedByUserId] FOREIGN KEY ([UpdatedByUserId]) REFERENCES [Users] ([Id])
);

CREATE TABLE [Memberships] (
    [Id] nvarchar(50) NOT NULL,
    [MemberId] nvarchar(50) NOT NULL,
    [PlanId] nvarchar(50) NOT NULL,
    [StartDate] date NOT NULL,
    [EndDate] date NOT NULL,
    [PlanFee] decimal(18,2) NOT NULL,
    [Status] nvarchar(30) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedByUserId] nvarchar(50) NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Memberships] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Memberships_Members_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [Members] ([Id]),
    CONSTRAINT [FK_Memberships_MembershipPlans_PlanId] FOREIGN KEY ([PlanId]) REFERENCES [MembershipPlans] ([Id]),
    CONSTRAINT [FK_Memberships_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id])
);

CREATE TABLE [Notifications] (
    [Id] nvarchar(50) NOT NULL,
    [UserId] nvarchar(50) NULL,
    [MemberId] nvarchar(50) NULL,
    [Type] nvarchar(30) NOT NULL,
    [Title] nvarchar(200) NOT NULL,
    [Message] nvarchar(1000) NOT NULL,
    [Priority] nvarchar(20) NOT NULL,
    [IsRead] bit NOT NULL,
    [ReadAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Notifications_Members_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [Members] ([Id]),
    CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
);

CREATE TABLE [Payments] (
    [Id] nvarchar(50) NOT NULL,
    [MemberId] nvarchar(50) NOT NULL,
    [MembershipId] nvarchar(50) NULL,
    [Amount] decimal(18,2) NOT NULL,
    [PaymentDate] date NOT NULL,
    [PaymentMethod] nvarchar(30) NOT NULL,
    [Notes] nvarchar(500) NULL,
    [Status] nvarchar(30) NOT NULL,
    [RecordedByUserId] nvarchar(50) NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Payments_Members_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [Members] ([Id]),
    CONSTRAINT [FK_Payments_Memberships_MembershipId] FOREIGN KEY ([MembershipId]) REFERENCES [Memberships] ([Id]),
    CONSTRAINT [FK_Payments_Users_RecordedByUserId] FOREIGN KEY ([RecordedByUserId]) REFERENCES [Users] ([Id])
);

CREATE TABLE [ReminderEvents] (
    [Id] nvarchar(50) NOT NULL,
    [MemberId] nvarchar(50) NOT NULL,
    [MembershipId] nvarchar(50) NULL,
    [EventType] nvarchar(50) NOT NULL,
    [EventDate] date NOT NULL,
    [ProcessedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ReminderEvents] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ReminderEvents_Members_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [Members] ([Id]),
    CONSTRAINT [FK_ReminderEvents_Memberships_MembershipId] FOREIGN KEY ([MembershipId]) REFERENCES [Memberships] ([Id])
);

CREATE INDEX [IX_Members_CreatedByUserId] ON [Members] ([CreatedByUserId]);

CREATE INDEX [IX_Members_FullName] ON [Members] ([FullName]);

CREATE UNIQUE INDEX [IX_Members_MemberId] ON [Members] ([MemberId]);

CREATE INDEX [IX_Members_MemberStatus] ON [Members] ([MemberStatus]);

CREATE UNIQUE INDEX [IX_Members_Mobile] ON [Members] ([Mobile]);

CREATE INDEX [IX_Members_UpdatedByUserId] ON [Members] ([UpdatedByUserId]);

CREATE INDEX [IX_MembershipPlans_IsActive] ON [MembershipPlans] ([IsActive]);

CREATE INDEX [IX_Memberships_CreatedByUserId] ON [Memberships] ([CreatedByUserId]);

CREATE INDEX [IX_Memberships_EndDate] ON [Memberships] ([EndDate]);

CREATE INDEX [IX_Memberships_MemberId] ON [Memberships] ([MemberId]);

CREATE INDEX [IX_Memberships_PlanId] ON [Memberships] ([PlanId]);

CREATE INDEX [IX_Memberships_Status] ON [Memberships] ([Status]);

CREATE INDEX [IX_Notifications_CreatedAt] ON [Notifications] ([CreatedAt]);

CREATE INDEX [IX_Notifications_IsRead] ON [Notifications] ([IsRead]);

CREATE INDEX [IX_Notifications_MemberId] ON [Notifications] ([MemberId]);

CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);

CREATE INDEX [IX_Payments_MemberId] ON [Payments] ([MemberId]);

CREATE INDEX [IX_Payments_MembershipId] ON [Payments] ([MembershipId]);

CREATE INDEX [IX_Payments_PaymentDate] ON [Payments] ([PaymentDate]);

CREATE INDEX [IX_Payments_RecordedByUserId] ON [Payments] ([RecordedByUserId]);

CREATE UNIQUE INDEX [IX_ReminderEvents_MemberId_MembershipId_EventType_EventDate] ON [ReminderEvents] ([MemberId], [MembershipId], [EventType], [EventDate]) WHERE [MembershipId] IS NOT NULL;

CREATE INDEX [IX_ReminderEvents_MembershipId] ON [ReminderEvents] ([MembershipId]);

CREATE UNIQUE INDEX [IX_Roles_Name] ON [Roles] ([Name]);

CREATE UNIQUE INDEX [IX_Roles_NormalizedName] ON [Roles] ([NormalizedName]);

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);

CREATE UNIQUE INDEX [IX_Users_Mobile] ON [Users] ([Mobile]);

CREATE UNIQUE INDEX [IX_Users_NormalizedEmail] ON [Users] ([NormalizedEmail]);

CREATE INDEX [IX_Users_RoleId] ON [Users] ([RoleId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260915120123_InitialPostgreSql', N'9.0.2');

COMMIT;
GO

