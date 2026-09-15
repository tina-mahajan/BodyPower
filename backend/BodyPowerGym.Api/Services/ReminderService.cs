using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BodyPowerGym.Api.Data;
using BodyPowerGym.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BodyPowerGym.Api.Services
{
    public interface IReminderService
    {
        Task<int> ProcessDailyRemindersAsync(DateOnly? targetDate = null);
        Task<int> CalculateUnpaidMonthsAsync(string memberId, DateOnly referenceDate);
    }

    public class ReminderService : IReminderService
    {
        private readonly BodyPowerGymDbContext _db;
        private readonly ILogger<ReminderService> _logger;

        public ReminderService(BodyPowerGymDbContext db, ILogger<ReminderService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<int> ProcessDailyRemindersAsync(DateOnly? targetDate = null)
        {
            var today = targetDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            _logger.LogInformation("Executing reminder processing for date: {Date}", today);

            int notificationsCreated = 0;

            // Load gym settings
            var settings = await _db.GymSettings.FirstOrDefaultAsync() ?? new GymSetting();
            var inactiveThresholdMonths = settings.InactiveAfterMonths > 0 ? settings.InactiveAfterMonths : 2;

            // Get all non-inactive members with their active/latest memberships and payments
            var members = await _db.Members
                .Include(m => m.Memberships)
                    .ThenInclude(ms => ms.Plan)
                .Include(m => m.Memberships)
                    .ThenInclude(ms => ms.Payments)
                .Include(m => m.Payments)
                .ToListAsync();

            foreach (var member in members)
            {
                // If member is already inactive, skip expiry alerts
                if (member.MemberStatus == MemberStatuses.Inactive)
                    continue;

                // Find latest active or expiring membership
                var currentMembership = member.Memberships
                    .OrderByDescending(ms => ms.EndDate)
                    .FirstOrDefault();

                if (currentMembership == null)
                    continue;

                var daysUntilExpiry = currentMembership.EndDate.DayNumber - today.DayNumber;

                // 1. 3 Days Before Expiry Reminder
                if (daysUntilExpiry == 3)
                {
                    bool exists = await _db.ReminderEvents.AnyAsync(r => 
                        r.MemberId == member.Id && 
                        r.MembershipId == currentMembership.Id && 
                        r.EventType == ReminderEventTypes.Expiry3Day && 
                        r.EventDate == today);

                    if (!exists)
                    {
                        _db.ReminderEvents.Add(new ReminderEvent
                        {
                            MemberId = member.Id,
                            MembershipId = currentMembership.Id,
                            EventType = ReminderEventTypes.Expiry3Day,
                            EventDate = today
                        });

                        _db.Notifications.Add(new Notification
                        {
                            MemberId = member.Id,
                            Type = NotificationTypes.Expiry,
                            Title = "Membership Expiry",
                            Message = $"{member.FullName}'s membership expires in 3 days.",
                            Priority = "medium",
                            IsRead = false
                        });

                        member.MemberStatus = MemberStatuses.Expiring;
                        currentMembership.Status = MemberStatuses.Expiring;
                        notificationsCreated++;
                    }
                }
                // 2. 1 Day Before Expiry Reminder
                else if (daysUntilExpiry == 1)
                {
                    bool exists = await _db.ReminderEvents.AnyAsync(r => 
                        r.MemberId == member.Id && 
                        r.MembershipId == currentMembership.Id && 
                        r.EventType == ReminderEventTypes.Expiry1Day && 
                        r.EventDate == today);

                    if (!exists)
                    {
                        _db.ReminderEvents.Add(new ReminderEvent
                        {
                            MemberId = member.Id,
                            MembershipId = currentMembership.Id,
                            EventType = ReminderEventTypes.Expiry1Day,
                            EventDate = today
                        });

                        _db.Notifications.Add(new Notification
                        {
                            MemberId = member.Id,
                            Type = NotificationTypes.Expiry,
                            Title = "Membership Expiry",
                            Message = $"{member.FullName}'s membership expires tomorrow.",
                            Priority = "high",
                            IsRead = false
                        });

                        member.MemberStatus = MemberStatuses.Expiring;
                        currentMembership.Status = MemberStatuses.Expiring;
                        notificationsCreated++;
                    }
                }
                // 3. Expiry Day Reminder & Status Update
                else if (daysUntilExpiry <= 0)
                {
                    bool exists = await _db.ReminderEvents.AnyAsync(r => 
                        r.MemberId == member.Id && 
                        r.MembershipId == currentMembership.Id && 
                        r.EventType == ReminderEventTypes.ExpiryDay && 
                        r.EventDate == today);

                    if (!exists)
                    {
                        _db.ReminderEvents.Add(new ReminderEvent
                        {
                            MemberId = member.Id,
                            MembershipId = currentMembership.Id,
                            EventType = ReminderEventTypes.ExpiryDay,
                            EventDate = today
                        });

                        _db.Notifications.Add(new Notification
                        {
                            MemberId = member.Id,
                            Type = NotificationTypes.Expiry,
                            Title = "Membership Expired",
                            Message = $"{member.FullName}'s membership has expired.",
                            Priority = "high",
                            IsRead = false
                        });

                        member.MemberStatus = MemberStatuses.Expired;
                        currentMembership.Status = MemberStatuses.Expired;
                        notificationsCreated++;
                    }
                }

                // 4. Consecutive Unpaid Rule (Authoritative evaluation)
                int unpaidMonths = await CalculateUnpaidMonthsAsync(member.Id, today);
                if (unpaidMonths >= inactiveThresholdMonths && member.MemberStatus != MemberStatuses.Inactive)
                {
                    bool exists = await _db.ReminderEvents.AnyAsync(r => 
                        r.MemberId == member.Id && 
                        r.MembershipId == currentMembership.Id && 
                        r.EventType == ReminderEventTypes.TwoMonthsUnpaid && 
                        r.EventDate == today);

                    if (!exists)
                    {
                        _db.ReminderEvents.Add(new ReminderEvent
                        {
                            MemberId = member.Id,
                            MembershipId = currentMembership.Id,
                            EventType = ReminderEventTypes.TwoMonthsUnpaid,
                            EventDate = today
                        });

                        // Automatically move to Inactive without deleting record
                        member.MemberStatus = MemberStatuses.Inactive;
                        member.InactiveSince = today;

                        _db.Notifications.Add(new Notification
                        {
                            MemberId = member.Id,
                            Type = NotificationTypes.Unpaid,
                            Title = "2 Months Unpaid Alert",
                            Message = $"{member.FullName} has not paid membership fees for {unpaidMonths} consecutive months. The member has been moved to Inactive.",
                            Priority = "high",
                            IsRead = false
                        });

                        notificationsCreated++;
                    }
                }
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("Reminder processing complete. New notifications created: {Count}", notificationsCreated);
            return notificationsCreated;
        }

        public async Task<int> CalculateUnpaidMonthsAsync(string memberId, DateOnly referenceDate)
        {
            var memberships = await _db.Memberships
                .Where(ms => ms.MemberId == memberId)
                .OrderByDescending(ms => ms.EndDate)
                .ToListAsync();

            if (!memberships.Any())
                return 0;

            var latestMembership = memberships.First();
            if (latestMembership.EndDate >= referenceDate)
                return 0; // Currently within an active membership period

            // Compute elapsed days since latest expired membership
            var daysSinceExpiry = referenceDate.DayNumber - latestMembership.EndDate.DayNumber;
            if (daysSinceExpiry <= 0) return 0;

            // Approximate monthly intervals (30 days per month)
            int months = (int)Math.Floor((double)daysSinceExpiry / 30.0);
            return Math.Max(0, months);
        }
    }
}
