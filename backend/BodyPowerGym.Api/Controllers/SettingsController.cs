using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using BodyPowerGym.Api.Data;
using BodyPowerGym.Api.DTOs;
using BodyPowerGym.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodyPowerGym.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly BodyPowerGymDbContext _db;

        public SettingsController(BodyPowerGymDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<GymSettingsDto>> GetSettings()
        {
            var setting = await _db.GymSettings.FirstOrDefaultAsync();
            if (setting == null)
            {
                setting = new GymSetting();
                _db.GymSettings.Add(setting);
                await _db.SaveChangesAsync();
            }

            var days = new List<int> { 3, 1 };
            try
            {
                days = JsonSerializer.Deserialize<List<int>>(setting.ReminderDaysJson) ?? new List<int> { 3, 1 };
            }
            catch
            {
                // fallback
            }

            return Ok(new GymSettingsDto
            {
                Name = setting.GymName,
                Phone = setting.Phone,
                Address = setting.Address,
                LogoUrl = setting.LogoUrl,
                ReminderDays = days,
                InactiveAfterMonths = setting.InactiveAfterMonths
            });
        }

        [HttpPut]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<GymSettingsDto>> UpdateSettings([FromBody] UpdateSettingsRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var setting = await _db.GymSettings.FirstOrDefaultAsync();
            if (setting == null)
            {
                setting = new GymSetting();
                _db.GymSettings.Add(setting);
            }

            setting.GymName = request.Name.Trim();
            setting.Phone = request.Phone?.Trim() ?? string.Empty;
            setting.Address = request.Address?.Trim() ?? string.Empty;
            setting.InactiveAfterMonths = request.InactiveAfterMonths > 0 ? request.InactiveAfterMonths : 2;

            if (request.ReminderDays != null)
            {
                setting.ReminderDaysJson = JsonSerializer.Serialize(request.ReminderDays);
            }

            setting.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var days = new List<int> { 3, 1 };
            try
            {
                days = JsonSerializer.Deserialize<List<int>>(setting.ReminderDaysJson) ?? new List<int> { 3, 1 };
            }
            catch { }

            return Ok(new GymSettingsDto
            {
                Name = setting.GymName,
                Phone = setting.Phone,
                Address = setting.Address,
                LogoUrl = setting.LogoUrl,
                ReminderDays = days,
                InactiveAfterMonths = setting.InactiveAfterMonths
            });
        }
    }
}
