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
            var autoMigrate = config.GetValue<bool>("Database:AutoMigrate", false);
            var autoSeed = config.GetValue<bool>("Database:AutoSeed", false);

            if (autoMigrate)
            {
                logger.LogInformation("Ensuring database tables exist...");
                await context.Database.EnsureCreatedAsync();
            }

            if (!autoSeed)
            {
                logger.LogInformation("Automatic database seeding is disabled. Database remains completely empty for real user data.");
                return;
            }

            // Note: Seeding is permanently disabled per empty-database requirement.
            logger.LogInformation("Database initialized with ZERO business records.");
        }
    }
}
