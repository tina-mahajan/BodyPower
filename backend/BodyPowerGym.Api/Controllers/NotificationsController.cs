using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using BodyPowerGym.Api.Data;
using BodyPowerGym.Api.DTOs;
using BodyPowerGym.Api.Models;
using BodyPowerGym.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodyPowerGym.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin,manager")]
    public class NotificationsController : ControllerBase
    {
        private readonly BodyPowerGymDbContext _db;
        private readonly IReminderService _reminderService;

        public NotificationsController(BodyPowerGymDbContext db, IReminderService reminderService)
        {
            _db = db;
            _reminderService = reminderService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications([FromQuery] string? type)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("userId");

            var query = _db.Notifications
                .Include(n => n.Member)
                .Where(n => n.UserId == null || n.UserId == userId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(type) && type != "all")
            {
                query = query.Where(n => n.Type == type);
            }

            var list = await query
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Type = n.Type,
                    MemberId = n.MemberId,
                    MemberName = n.Member != null ? n.Member.FullName : null,
                    Title = n.Title,
                    Message = n.Message,
                    Priority = n.Priority,
                    Read = n.IsRead,
                    ReadAt = n.ReadAt.HasValue ? n.ReadAt.Value.ToString("yyyy-MM-ddTHH:mm:ssZ") : null,
                    Date = n.CreatedAt.ToString("yyyy-MM-dd")
                })
                .ToListAsync();

            return Ok(list);
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            var notif = await _db.Notifications.FindAsync(id);
            if (notif == null)
                return NotFound(new { message = "Notification not found." });

            notif.IsRead = true;
            notif.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { success = true });
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("userId");

            var unread = await _db.Notifications
                .Where(n => !n.IsRead && (n.UserId == null || n.UserId == userId))
                .ToListAsync();

            var now = DateTime.UtcNow;
            foreach (var n in unread)
            {
                n.IsRead = true;
                n.ReadAt = now;
            }

            await _db.SaveChangesAsync();
            return Ok(new { markedCount = unread.Count });
        }

        [HttpPost("trigger-reminders")]
        public async Task<IActionResult> TriggerReminders()
        {
            int created = await _reminderService.ProcessDailyRemindersAsync();
            return Ok(new { message = "Reminder processing completed.", notificationsCreated = created });
        }
    }
}
