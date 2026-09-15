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
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodyPowerGym.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MembersController : ControllerBase
    {
        private readonly BodyPowerGymDbContext _db;
        private readonly IPhotoStorageService _photoStorage;
        private readonly IReminderService _reminderService;

        public MembersController(
            BodyPowerGymDbContext db, 
            IPhotoStorageService photoStorage,
            IReminderService reminderService)
        {
            _db = db;
            _photoStorage = photoStorage;
            _reminderService = reminderService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MemberDto>>> GetMembers(
            [FromQuery] string? search, 
            [FromQuery] string? status)
        {
            var query = _db.Members
                .Include(m => m.Memberships)
                    .ThenInclude(ms => ms.Plan)
                .Include(m => m.Payments)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(m => 
                    m.FullName.ToLower().Contains(q) || 
                    m.Mobile.Contains(q) || 
                    m.MemberId.ToLower().Contains(q));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                query = query.Where(m => m.MemberStatus == status);
            }

            var members = await query
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var dtos = new List<MemberDto>();

            foreach (var m in members)
            {
                dtos.Add(await MapToMemberDtoAsync(m, today));
            }

            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MemberDto>> GetMember(string id)
        {
            var member = await _db.Members
                .Include(m => m.Memberships)
                    .ThenInclude(ms => ms.Plan)
                .Include(m => m.Payments)
                .FirstOrDefaultAsync(m => m.Id == id || m.MemberId == id);

            if (member == null)
                return NotFound(new { message = "Member not found." });

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return Ok(await MapToMemberDtoAsync(member, today));
        }

        [HttpPost]
        public async Task<ActionResult<MemberDto>> CreateMember([FromBody] CreateMemberRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var mobileExists = await _db.Members.AnyAsync(m => m.Mobile == request.Mobile.Trim());
            if (mobileExists)
                return Conflict(new { message = "A member with this mobile number is already registered." });

            var plan = await _db.MembershipPlans.FindAsync(request.PlanId);
            if (plan == null || !plan.IsActive)
                return BadRequest(new { message = "Selected membership plan is invalid or inactive." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("userId");
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            DateOnly startDate = DateOnly.TryParse(request.StartDate, out var parsedStart) ? parsedStart : today;
            DateOnly expiryDate = startDate.AddMonths(plan.DurationMonths);

            // Generate Member ID (e.g. BP-000160)
            int count = await _db.Members.CountAsync() + 1;
            string memberId = $"BP-{count.ToString().PadLeft(6, '0')}";
            while (await _db.Members.AnyAsync(m => m.MemberId == memberId))
            {
                count++;
                memberId = $"BP-{count.ToString().PadLeft(6, '0')}";
            }

            DateOnly? dob = DateOnly.TryParse(request.Dob, out var parsedDob) ? parsedDob : null;

            string? photoUrl = null;
            if (!string.IsNullOrWhiteSpace(request.PhotoUrl))
            {
                if (request.PhotoUrl.StartsWith("data:") || request.PhotoUrl.Length > 200)
                {
                    photoUrl = await _photoStorage.SaveBase64PhotoAsync(request.PhotoUrl);
                }
                else
                {
                    photoUrl = request.PhotoUrl;
                }
            }

            var member = new Member
            {
                Id = $"m-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                MemberId = memberId,
                FullName = request.Name.Trim(),
                Mobile = request.Mobile.Trim(),
                Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
                DateOfBirth = dob,
                Gender = request.Gender,
                Address = request.Address,
                PhotoUrl = photoUrl,
                MemberStatus = MemberStatuses.Active,
                JoinedOn = startDate,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            var membership = new Membership
            {
                Id = $"ms-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                MemberId = member.Id,
                PlanId = plan.Id,
                StartDate = startDate,
                EndDate = expiryDate,
                PlanFee = plan.Price,
                Status = MemberStatuses.Active,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Members.Add(member);
            _db.Memberships.Add(membership);

            // First payment if amount provided
            if (request.AmountPaid > 0)
            {
                var payment = new Payment
                {
                    Id = $"pay-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                    MemberId = member.Id,
                    MembershipId = membership.Id,
                    Amount = request.AmountPaid,
                    PaymentDate = today,
                    PaymentMethod = request.PaymentMethod ?? PaymentMethods.Cash,
                    Notes = request.Notes ?? "Admission payment",
                    Status = "paid",
                    RecordedByUserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Payments.Add(payment);
            }

            await _db.SaveChangesAsync();

            // Reload member with full navigation
            var reloaded = await _db.Members
                .Include(m => m.Memberships).ThenInclude(ms => ms.Plan)
                .Include(m => m.Payments)
                .FirstAsync(m => m.Id == member.Id);

            return CreatedAtAction(nameof(GetMember), new { id = member.Id }, await MapToMemberDtoAsync(reloaded, today));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<MemberDto>> UpdateMember(string id, [FromBody] UpdateMemberRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var member = await _db.Members
                .Include(m => m.Memberships).ThenInclude(ms => ms.Plan)
                .Include(m => m.Payments)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (member == null)
                return NotFound(new { message = "Member not found." });

            var mobileExists = await _db.Members.AnyAsync(m => m.Mobile == request.Mobile.Trim() && m.Id != id);
            if (mobileExists)
                return Conflict(new { message = "Mobile number is already registered to another member." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("userId");

            DateOnly? dob = DateOnly.TryParse(request.Dob, out var parsedDob) ? parsedDob : null;

            member.FullName = request.Name.Trim();
            member.Mobile = request.Mobile.Trim();
            member.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
            member.DateOfBirth = dob;
            member.Gender = request.Gender;
            member.Address = request.Address;
            member.UpdatedByUserId = userId;
            member.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return Ok(await MapToMemberDtoAsync(member, today));
        }

        [HttpPost("{id}/photo")]
        public async Task<IActionResult> UploadPhoto(string id, [FromBody] Base64PhotoRequest request)
        {
            var member = await _db.Members.FindAsync(id);
            if (member == null)
                return NotFound(new { message = "Member not found." });

            if (string.IsNullOrWhiteSpace(request?.Base64Image))
            {
                return BadRequest(new { message = "No photo file or image data was provided." });
            }

            var photoUrl = await _photoStorage.SaveBase64PhotoAsync(request.Base64Image);
            if (string.IsNullOrEmpty(photoUrl))
            {
                return BadRequest(new { message = "Failed to process photo." });
            }

            // Clean up previous photo
            if (!string.IsNullOrEmpty(member.PhotoUrl))
            {
                await _photoStorage.DeletePhotoAsync(member.PhotoUrl);
            }

            member.PhotoUrl = photoUrl;
            member.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { photoUrl });
        }

        [HttpDelete("{id}/photo")]
        public async Task<IActionResult> DeletePhoto(string id)
        {
            var member = await _db.Members.FindAsync(id);
            if (member == null)
                return NotFound(new { message = "Member not found." });

            if (!string.IsNullOrEmpty(member.PhotoUrl))
            {
                await _photoStorage.DeletePhotoAsync(member.PhotoUrl);
                member.PhotoUrl = null;
                member.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }

            return Ok(new { message = "Photo deleted successfully." });
        }

        [HttpPost("{id}/move-inactive")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> MoveToInactive(string id)
        {
            var member = await _db.Members.FindAsync(id);
            if (member == null)
                return NotFound(new { message = "Member not found." });

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            member.MemberStatus = MemberStatuses.Inactive;
            member.InactiveSince = today;
            member.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = $"{member.FullName} moved to inactive status." });
        }

        [HttpPost("{id}/reactivate")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Reactivate(string id)
        {
            var member = await _db.Members.FindAsync(id);
            if (member == null)
                return NotFound(new { message = "Member not found." });

            member.MemberStatus = MemberStatuses.Active;
            member.InactiveSince = null;
            member.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = $"{member.FullName} reactivated successfully." });
        }

        private async Task<MemberDto> MapToMemberDtoAsync(Member m, DateOnly today)
        {
            var latestMembership = m.Memberships
                .OrderByDescending(ms => ms.EndDate)
                .FirstOrDefault();

            decimal totalFee = latestMembership?.PlanFee ?? 0;
            
            // Derive AmountPaid from SUM(Payments.Amount) for current membership
            decimal amountPaid = latestMembership != null
                ? m.Payments.Where(p => p.MembershipId == latestMembership.Id).Sum(p => p.Amount)
                : 0;

            decimal pending = Math.Max(0, totalFee - amountPaid);

            // Derived PaymentStatus
            string paymentStatus = (amountPaid >= totalFee && totalFee > 0)
                ? PaymentStatuses.Paid
                : (amountPaid > 0)
                    ? PaymentStatuses.Partial
                    : PaymentStatuses.Unpaid;

            // Derived UnpaidMonths
            int unpaidMonths = await _reminderService.CalculateUnpaidMonthsAsync(m.Id, today);

            return new MemberDto
            {
                Id = m.Id,
                MemberId = m.MemberId,
                Name = m.FullName,
                Mobile = m.Mobile,
                Email = m.Email,
                Dob = m.DateOfBirth?.ToString("yyyy-MM-dd"),
                Gender = m.Gender,
                Address = m.Address,
                Avatar = m.PhotoUrl,
                PlanId = latestMembership?.PlanId ?? "p1",
                PlanName = latestMembership?.Plan?.Name ?? "Monthly",
                StartDate = latestMembership?.StartDate.ToString("yyyy-MM-dd") ?? m.JoinedOn.ToString("yyyy-MM-dd"),
                ExpiryDate = latestMembership?.EndDate.ToString("yyyy-MM-dd") ?? today.ToString("yyyy-MM-dd"),
                TotalFee = totalFee,
                AmountPaid = amountPaid,
                PendingFee = pending,
                MemberStatus = m.MemberStatus,
                PaymentStatus = paymentStatus,
                UnpaidMonths = unpaidMonths,
                InactiveSince = m.InactiveSince?.ToString("yyyy-MM-dd"),
                JoinedOn = m.JoinedOn.ToString("yyyy-MM-dd"),
                Payments = m.Payments
                    .OrderByDescending(p => p.PaymentDate)
                    .ThenByDescending(p => p.CreatedAt)
                    .Select(p => new PaymentDto
                    {
                        Id = p.Id,
                        MemberId = m.Id,
                        MemberName = m.FullName,
                        MemberRefId = m.MemberId,
                        MembershipId = p.MembershipId,
                        Amount = p.Amount,
                        Date = p.PaymentDate.ToString("yyyy-MM-dd"),
                        Method = p.PaymentMethod,
                        Notes = p.Notes,
                        Status = p.Status
                    })
                    .ToList()
            };
        }
    }

    public class Base64PhotoRequest
    {
        public string Base64Image { get; set; } = string.Empty;
    }
}
