using System;
using System.Collections.Generic;
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
    public class PaymentsController : ControllerBase
    {
        private readonly BodyPowerGymDbContext _db;

        public PaymentsController(BodyPowerGymDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymentDto>>> GetPayments(
            [FromQuery] string? period, 
            [FromQuery] string? search)
        {
            var query = _db.Payments
                .Include(p => p.Member)
                .Include(p => p.RecordedByUser)
                .AsQueryable();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            if (!string.IsNullOrWhiteSpace(period))
            {
                if (period == "today")
                {
                    query = query.Where(p => p.PaymentDate == today);
                }
                else if (period == "week")
                {
                    var weekAgo = today.AddDays(-7);
                    query = query.Where(p => p.PaymentDate >= weekAgo);
                }
                else if (period == "month")
                {
                    var startOfMonth = new DateOnly(today.Year, today.Month, 1);
                    query = query.Where(p => p.PaymentDate >= startOfMonth);
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(p => 
                    (p.Member != null && p.Member.FullName.ToLower().Contains(q)) || 
                    (p.Member != null && p.Member.MemberId.ToLower().Contains(q)) || 
                    (p.Member != null && p.Member.Mobile.Contains(q)));
            }

            var payments = await query
                .OrderByDescending(p => p.PaymentDate)
                .ThenByDescending(p => p.CreatedAt)
                .Select(p => new PaymentDto
                {
                    Id = p.Id,
                    MemberId = p.MemberId,
                    MemberName = p.Member != null ? p.Member.FullName : null,
                    MemberRefId = p.Member != null ? p.Member.MemberId : null,
                    MembershipId = p.MembershipId,
                    Amount = p.Amount,
                    Date = p.PaymentDate.ToString("yyyy-MM-dd"),
                    Method = p.PaymentMethod,
                    Notes = p.Notes,
                    Status = p.Status,
                    RecordedBy = p.RecordedByUser != null ? p.RecordedByUser.FullName : null
                })
                .ToListAsync();

            return Ok(payments);
        }

        [HttpPost]
        public async Task<ActionResult<PaymentDto>> RecordPayment([FromBody] RecordPaymentRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.Amount <= 0)
                return BadRequest(new { message = "Payment amount must be greater than zero." });

            var member = await _db.Members
                .Include(m => m.Memberships)
                .FirstOrDefaultAsync(m => m.Id == request.MemberId || m.MemberId == request.MemberId);

            if (member == null)
                return NotFound(new { message = "Member not found." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("userId");
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            DateOnly paymentDate = today;
            if (!string.IsNullOrWhiteSpace(request.PaymentDate) && DateOnly.TryParse(request.PaymentDate, out var parsedDate))
            {
                paymentDate = parsedDate;
            }

            // Find current membership if not explicitly passed
            var membershipId = request.MembershipId;
            if (string.IsNullOrEmpty(membershipId))
            {
                var currentMs = member.Memberships.OrderByDescending(ms => ms.EndDate).FirstOrDefault();
                membershipId = currentMs?.Id;
            }

            var payment = new Payment
            {
                Id = $"pay-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                MemberId = member.Id,
                MembershipId = membershipId,
                Amount = request.Amount,
                PaymentDate = paymentDate,
                PaymentMethod = request.PaymentMethod ?? PaymentMethods.Cash,
                Notes = request.Notes,
                Status = "paid",
                RecordedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();

            return Ok(new PaymentDto
            {
                Id = payment.Id,
                MemberId = member.Id,
                MemberName = member.FullName,
                MemberRefId = member.MemberId,
                MembershipId = payment.MembershipId,
                Amount = payment.Amount,
                Date = payment.PaymentDate.ToString("yyyy-MM-dd"),
                Method = payment.PaymentMethod,
                Notes = payment.Notes,
                Status = payment.Status
            });
        }

        [HttpGet("summary")]
        public async Task<ActionResult<PaymentSummaryDto>> GetPaymentSummary()
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var startOfMonth = new DateOnly(today.Year, today.Month, 1);

            var todayPayments = await _db.Payments
                .Where(p => p.PaymentDate == today)
                .SumAsync(p => p.Amount);

            var monthPayments = await _db.Payments
                .Where(p => p.PaymentDate >= startOfMonth)
                .SumAsync(p => p.Amount);

            var totalCount = await _db.Payments.CountAsync();

            // Calculate pending across all active/non-inactive members
            var activeMembers = await _db.Members
                .Where(m => m.MemberStatus != MemberStatuses.Inactive)
                .Include(m => m.Memberships)
                .Include(m => m.Payments)
                .ToListAsync();

            decimal totalPending = 0;
            foreach (var m in activeMembers)
            {
                var latestMs = m.Memberships.OrderByDescending(ms => ms.EndDate).FirstOrDefault();
                if (latestMs != null)
                {
                    var paid = m.Payments.Where(p => p.MembershipId == latestMs.Id).Sum(p => p.Amount);
                    var pend = Math.Max(0, latestMs.PlanFee - paid);
                    totalPending += pend;
                }
            }

            return Ok(new PaymentSummaryDto
            {
                TodayTotal = todayPayments,
                ThisMonthTotal = monthPayments,
                TotalPending = totalPending,
                TotalTransactions = totalCount
            });
        }
    }
}
