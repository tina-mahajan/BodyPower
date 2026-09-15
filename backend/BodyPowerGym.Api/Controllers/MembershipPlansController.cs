using System;
using System.Collections.Generic;
using System.Linq;
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
    [Route("api/membership-plans")]
    [Authorize]
    public class MembershipPlansController : ControllerBase
    {
        private readonly BodyPowerGymDbContext _db;

        public MembershipPlansController(BodyPowerGymDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PlanDto>>> GetPlans()
        {
            var plans = await _db.MembershipPlans
                .OrderBy(p => p.DurationMonths)
                .Select(p => new PlanDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Duration = p.DurationMonths,
                    Price = p.Price,
                    Description = p.Description,
                    Active = p.IsActive
                })
                .ToListAsync();

            return Ok(plans);
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<PlanDto>> CreatePlan([FromBody] CreatePlanRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var plan = new MembershipPlan
            {
                Id = $"p-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                Name = request.Name.Trim(),
                DurationMonths = request.Duration,
                Price = request.Price,
                Description = request.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.MembershipPlans.Add(plan);
            await _db.SaveChangesAsync();

            return Ok(new PlanDto
            {
                Id = plan.Id,
                Name = plan.Name,
                Duration = plan.DurationMonths,
                Price = plan.Price,
                Description = plan.Description,
                Active = plan.IsActive
            });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<PlanDto>> UpdatePlan(string id, [FromBody] UpdatePlanRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var plan = await _db.MembershipPlans.FindAsync(id);
            if (plan == null)
                return NotFound(new { message = "Membership plan not found." });

            plan.Name = request.Name.Trim();
            plan.DurationMonths = request.Duration;
            plan.Price = request.Price;
            plan.Description = request.Description;
            plan.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new PlanDto
            {
                Id = plan.Id,
                Name = plan.Name,
                Duration = plan.DurationMonths,
                Price = plan.Price,
                Description = plan.Description,
                Active = plan.IsActive
            });
        }

        [HttpPost("{id}/toggle-status")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ToggleStatus(string id)
        {
            var plan = await _db.MembershipPlans.FindAsync(id);
            if (plan == null)
                return NotFound(new { message = "Membership plan not found." });

            plan.IsActive = !plan.IsActive;
            plan.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { active = plan.IsActive });
        }
    }
}
