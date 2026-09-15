using System;
using System.Linq;
using System.Security.Claims;
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
    public class MembershipsController : ControllerBase
    {
        private readonly BodyPowerGymDbContext _db;

        public MembershipsController(BodyPowerGymDbContext db)
        {
            _db = db;
        }

        [HttpPost("member/{memberId}/renew")]
        public async Task<IActionResult> RenewMembership(string memberId, [FromBody] RenewMembershipRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var member = await _db.Members
                .Include(m => m.Memberships)
                .Include(m => m.Payments)
                .FirstOrDefaultAsync(m => m.Id == memberId || m.MemberId == memberId);

            if (member == null)
                return NotFound(new { message = "Member not found." });

            var plan = await _db.MembershipPlans.FindAsync(request.PlanId);
            if (plan == null || !plan.IsActive)
                return BadRequest(new { message = "Selected membership plan is invalid or inactive." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("userId");
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var latestMembership = member.Memberships
                .OrderByDescending(ms => ms.EndDate)
                .FirstOrDefault();

            // Calculate start date: if existing expiry is in the future, extend from current expiry; else start today
            DateOnly startDate = today;
            if (latestMembership != null && latestMembership.EndDate > today)
            {
                startDate = latestMembership.EndDate;
            }
            if (!string.IsNullOrWhiteSpace(request.StartDate) && DateOnly.TryParse(request.StartDate, out var customStart))
            {
                startDate = customStart;
            }

            DateOnly newExpiryDate = startDate.AddMonths(plan.DurationMonths);

            var newMembership = new Membership
            {
                Id = $"ms-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                MemberId = member.Id,
                PlanId = plan.Id,
                StartDate = startDate,
                EndDate = newExpiryDate,
                PlanFee = plan.Price,
                Status = MemberStatuses.Active,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Memberships.Add(newMembership);

            decimal paidAmount = request.AmountPaid > 0 ? request.AmountPaid : plan.Price;

            if (paidAmount > 0)
            {
                var payment = new Payment
                {
                    Id = $"pay-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                    MemberId = member.Id,
                    MembershipId = newMembership.Id,
                    Amount = paidAmount,
                    PaymentDate = today,
                    PaymentMethod = request.PaymentMethod ?? PaymentMethods.Upi,
                    Notes = request.Notes ?? "Membership renewal payment",
                    Status = "paid",
                    RecordedByUserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Payments.Add(payment);
            }

            // Restore active state
            member.MemberStatus = MemberStatuses.Active;
            member.InactiveSince = null;
            member.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = $"{member.FullName}'s membership renewed successfully.",
                membershipId = newMembership.Id,
                startDate = startDate.ToString("yyyy-MM-dd"),
                expiryDate = newExpiryDate.ToString("yyyy-MM-dd"),
                planName = plan.Name,
                amountPaid = paidAmount,
                totalFee = plan.Price
            });
        }
    }
}
