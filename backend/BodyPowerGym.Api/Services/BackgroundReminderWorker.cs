using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BodyPowerGym.Api.Services
{
    public class BackgroundReminderWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BackgroundReminderWorker> _logger;
        private readonly IConfiguration _config;

        public BackgroundReminderWorker(
            IServiceProvider serviceProvider,
            ILogger<BackgroundReminderWorker> logger,
            IConfiguration config)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _config = config;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Background Reminder Worker started.");

            var enabled = _config.GetValue<bool>("ReminderService:Enabled", true);
            if (!enabled)
            {
                _logger.LogInformation("Background Reminder Worker is disabled in configuration.");
                return;
            }

            // Initial run after 10 seconds to process any pending reminders on startup
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var reminderService = scope.ServiceProvider.GetRequiredService<IReminderService>();
                        await reminderService.ProcessDailyRemindersAsync();
                    }
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    _logger.LogError(ex, "An error occurred during scheduled reminder processing.");
                }

                // Check once every 24 hours (or configured interval in minutes)
                var intervalHours = _config.GetValue<int>("ReminderService:IntervalHours", 24);
                await Task.Delay(TimeSpan.FromHours(intervalHours), stoppingToken);
            }
        }
    }
}
