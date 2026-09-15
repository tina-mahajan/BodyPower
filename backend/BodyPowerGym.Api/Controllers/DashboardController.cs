using System;
using System.Collections.Generic;
using System.Linq;
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
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly BodyPowerGymDbContext _db;
        private readonly IReminderService _reminderService;

        public DashboardController(BodyPowerGymDbContext db, IReminderService reminderService)
        {
            _db = db;
            _reminderService = reminderService;
        }

        [HttpGet("admin")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<AdminDashboardDto>> GetAdminDashboard()
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var members = await _db.Members
                .Include(m => m.Memberships).ThenInclude(ms => ms.Plan)
                .Include(m => m.Payments)
                .ToListAsync();

            var nonInactive = members.Where(m => m.MemberStatus != MemberStatuses.Inactive).ToList();
            var active = nonInactive.Where(m => m.MemberStatus == MemberStatuses.Active || m.MemberStatus == MemberStatuses.Expiring).ToList();
            var expiring = nonInactive.Where(m => m.MemberStatus == MemberStatuses.Expiring).ToList();

            var expiringList = new List<MemberDto>();
            var pendingList = new List<MemberDto>();
            var twoMonthUnpaidList = new List<MemberDto>();

            foreach (var m in members)
            {
                var latestMs = m.Memberships.OrderByDescending(ms => ms.EndDate).FirstOrDefault();
                decimal totalFee = latestMs?.PlanFee ?? 0;
                decimal paid = latestMs != null ? m.Payments.Where(p => p.MembershipId == latestMs.Id).Sum(p => p.Amount) : 0;
                decimal pending = Math.Max(0, totalFee - paid);
                int unpaidMonths = await _reminderService.CalculateUnpaidMonthsAsync(m.Id, today);

                var dto = new MemberDto
                {
                    Id = m.Id,
                    MemberId = m.MemberId,
                    Name = m.FullName,
                    Mobile = m.Mobile,
                    Email = m.Email,
                    PlanId = latestMs?.PlanId ?? "p1",
                    PlanName = latestMs?.Plan?.Name ?? "Monthly",
                    StartDate = latestMs?.StartDate.ToString("yyyy-MM-dd") ?? m.JoinedOn.ToString("yyyy-MM-dd"),
                    ExpiryDate = latestMs?.EndDate.ToString("yyyy-MM-dd") ?? today.ToString("yyyy-MM-dd"),
                    TotalFee = totalFee,
                    AmountPaid = paid,
                    PendingFee = pending,
                    MemberStatus = m.MemberStatus,
                    PaymentStatus = (paid >= totalFee && totalFee > 0) ? "paid" : (paid > 0) ? "partial" : "unpaid",
                    UnpaidMonths = unpaidMonths,
                    JoinedOn = m.JoinedOn.ToString("yyyy-MM-dd")
                };

                if (m.MemberStatus == MemberStatuses.Expiring)
                {
                    expiringList.Add(dto);
                }

                if (pending > 0 && m.MemberStatus != MemberStatuses.Inactive)
                {
                    pendingList.Add(dto);
                }

                if (unpaidMonths >= 2 && m.MemberStatus != MemberStatuses.Inactive)
                {
                    twoMonthUnpaidList.Add(dto);
                }
            }

            return Ok(new AdminDashboardDto
            {
                TotalMembers = nonInactive.Count,
                ActiveMembers = active.Count,
                ExpiringSoon = expiringList.Count,
                PendingFees = pendingList.Count,
                TwoMonthsUnpaid = twoMonthUnpaidList.Count,
                ExpiringList = expiringList,
                PendingList = pendingList,
                TwoMonthsUnpaidList = twoMonthUnpaidList
            });
        }

        [HttpGet("manager")]
        public async Task<ActionResult<ManagerDashboardDto>> GetManagerDashboard()
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var members = await _db.Members
                .Include(m => m.Memberships).ThenInclude(ms => ms.Plan)
                .Include(m => m.Payments)
                .ToListAsync();

            var nonInactive = members.Where(m => m.MemberStatus != MemberStatuses.Inactive).ToList();
            var active = nonInactive.Where(m => m.MemberStatus == MemberStatuses.Active || m.MemberStatus == MemberStatuses.Expiring).ToList();

            var todayAdmissions = members.Count(m => m.JoinedOn == today);
            var todayPayments = await _db.Payments.Where(p => p.PaymentDate == today).SumAsync(p => p.Amount);

            var recentMembers = nonInactive
                .OrderByDescending(m => m.JoinedOn)
                .Take(5)
                .Select(m => new MemberDto
                {
                    Id = m.Id,
                    MemberId = m.MemberId,
                    Name = m.FullName,
                    Mobile = m.Mobile,
                    JoinedOn = m.JoinedOn.ToString("yyyy-MM-dd")
                })
                .ToList();

            return Ok(new ManagerDashboardDto
            {
                TotalMembers = nonInactive.Count,
                ActiveMembers = active.Count,
                TodayAdmissions = todayAdmissions,
                TodayCollection = todayPayments,
                RecentMembers = recentMembers
            });
        }
    }
}
