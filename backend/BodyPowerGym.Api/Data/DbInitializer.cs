using System;
using System.Linq;
using System.Threading.Tasks;
using BodyPowerGym.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BodyPowerGym.Api.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(
            BodyPowerGymDbContext context, 
            IConfiguration config, 
            IPasswordHasher<User> passwordHasher,
            ILogger logger)
        {
            var autoMigrate = config.GetValue<bool>("Database:AutoMigrate", true);

            if (autoMigrate)
            {
                logger.LogInformation("Ensuring database schema exists...");
                try
                {
                    await context.Database.MigrateAsync();
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "MigrateAsync encountered an issue. Falling back to EnsureCreatedAsync...");
                    await context.Database.EnsureCreatedAsync();
                }
            }

            // If roles or users do not exist yet in this database instance (e.g. fresh Supabase PostgreSQL),
            // restore the verified real database records from the backup without any demo data.
            if (!await context.Roles.AnyAsync())
            {
                logger.LogInformation("Restoring verified real records to new production database instance...");

                // 1. Roles
                var adminRole = new Role
                {
                    Id = "admin",
                    Name = "Admin",
                    NormalizedName = "ADMIN",
                    Description = "Full administrative system access",
                    CreatedAt = DateTime.UtcNow
                };
                var managerRole = new Role
                {
                    Id = "manager",
                    Name = "Manager",
                    NormalizedName = "MANAGER",
                    Description = "Operational front-desk access",
                    CreatedAt = DateTime.UtcNow
                };
                context.Roles.AddRange(adminRole, managerRole);
                await context.SaveChangesAsync();

                // 2. Users (Preserved exact password hashes from BodyPowerGymDb)
                var user1 = new User
                {
                    Id = "u-admin-1",
                    RoleId = "admin",
                    FullName = "Yogesh Gopal Mahajan",
                    Email = "yogeshmahajan@gmail.com",
                    NormalizedEmail = "YOGESHMAHAJAN@GMAIL.COM",
                    Mobile = "7410584858",
                    PasswordHash = "AQAAAAIAAYagAAAAEG4xcW9wClQyCwGNHVIRFjrn1KSv0EVHrru7wNX3gpRxQDHkxkSR586HvtB9piBZeA==",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                var user2 = new User
                {
                    Id = "u-1789466564806",
                    RoleId = "admin",
                    FullName = "Rahul Mali",
                    Email = "rahulmali@gmail.com",
                    NormalizedEmail = "RAHULMALI@GMAIL.COM",
                    Mobile = "8600276867",
                    PasswordHash = "AQAAAAIAAYagAAAAEKINGkYYLvpj9LxXjRbr1G7u/ymbaAlAxS+nddbEFdYOkuH2WBQHKn8AL1X3s7nDOw==",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                var user3 = new User
                {
                    Id = "u-1789469393891",
                    RoleId = "manager",
                    FullName = "Juber sir",
                    Email = "juber@gmail.com",
                    NormalizedEmail = "JUBER@GMAIL.COM",
                    Mobile = "9993090118",
                    PasswordHash = "AQAAAAIAAYagAAAAEDj1SweV3tgtCv80d5DIX73FZiOuBlxhEO+vfEfrQAwu0M+Rwge4rp6jdP5cPAICAw==",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.AddRange(user1, user2, user3);

                // 3. Membership Plans
                var plan1 = new MembershipPlan
                {
                    Id = "p-1789465083729",
                    Name = "Monthly Plan",
                    DurationMonths = 1,
                    Price = 600.00m,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                var plan2 = new MembershipPlan
                {
                    Id = "p-1789465216281",
                    Name = "Quarterly Plan",
                    DurationMonths = 3,
                    Price = 1600.00m,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.MembershipPlans.AddRange(plan1, plan2);

                // 4. Gym Settings
                var gymSettings = new GymSetting
                {
                    Id = "gym-default",
                    GymName = "BodyPower Gym",
                    Phone = "7410584858",
                    Address = "Main Branch",
                    ReminderDaysJson = "[3,1]",
                    InactiveAfterMonths = 2,
                    UpdatedAt = DateTime.UtcNow
                };
                context.GymSettings.Add(gymSettings);

                await context.SaveChangesAsync();
                logger.LogInformation("Real records successfully restored to production database.");
            }
        }
    }
}
