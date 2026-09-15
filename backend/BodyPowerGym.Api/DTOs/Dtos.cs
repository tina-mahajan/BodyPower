using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BodyPowerGym.Api.DTOs
{
    // --- Auth DTOs ---
    public class LoginRequest
    {
        [Required]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public UserDto User { get; set; } = new();
    }

    public class SystemStatusDto
    {
        public bool NeedsSetup { get; set; }
        public int UserCount { get; set; }
        public string GymName { get; set; } = "BodyPower Gym";
    }

    public class InitialSetupRequest
    {
        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Mobile must be a valid 10-digit number")]
        public string Mobile { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; } = string.Empty;

        public string? GymName { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
    }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string RoleId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateUserRequest
    {
        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Mobile must be a valid 10-digit number")]
        public string Mobile { get; set; } = string.Empty;

        public string RoleId { get; set; } = "manager"; // "admin" or "manager"

        public string? Password { get; set; } // Optional; default is generated if null
    }

    public class UpdateUserRequest
    {
        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Mobile must be a valid 10-digit number")]
        public string Mobile { get; set; } = string.Empty;

        public string? RoleId { get; set; }
    }

    // --- Membership Plan DTOs ---
    public class PlanDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Duration { get; set; }
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public bool Active { get; set; }
    }

    public class CreatePlanRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Range(1, 60)]
        public int Duration { get; set; } = 1;

        [Range(0, 1000000)]
        public decimal Price { get; set; }

        public string? Description { get; set; }
    }

    public class UpdatePlanRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Range(1, 60)]
        public int Duration { get; set; } = 1;

        [Range(0, 1000000)]
        public decimal Price { get; set; }

        public string? Description { get; set; }
    }

    // --- Member & Membership DTOs ---
    public class MemberDto
    {
        public string Id { get; set; } = string.Empty;
        public string MemberId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Dob { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public string? Avatar { get; set; }
        public string PlanId { get; set; } = string.Empty;
        public string? PlanName { get; set; }
        public string StartDate { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public decimal TotalFee { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal PendingFee { get; set; }
        public string MemberStatus { get; set; } = "active"; // active, expiring, expired, inactive
        public string PaymentStatus { get; set; } = "paid";   // paid, partial, unpaid (derived)
        public int UnpaidMonths { get; set; }                 // derived from authoritative membership history
        public string? InactiveSince { get; set; }
        public string JoinedOn { get; set; } = string.Empty;
        public List<PaymentDto> Payments { get; set; } = new();
    }

    public class CreateMemberRequest
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Mobile must be a valid 10-digit number")]
        public string Mobile { get; set; } = string.Empty;

        [EmailAddress]
        public string? Email { get; set; }

        public string? Dob { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public string? PhotoUrl { get; set; }

        [Required]
        public string PlanId { get; set; } = string.Empty;

        [Required]
        public string StartDate { get; set; } = string.Empty;

        [Range(0, 1000000)]
        public decimal AmountPaid { get; set; } = 0;

        public string PaymentMethod { get; set; } = "cash";
        public string? Notes { get; set; }
    }

    public class UpdateMemberRequest
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Mobile must be a valid 10-digit number")]
        public string Mobile { get; set; } = string.Empty;

        [EmailAddress]
        public string? Email { get; set; }

        public string? Dob { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
    }

    public class MembershipDto
    {
        public string Id { get; set; } = string.Empty;
        public string MemberId { get; set; } = string.Empty;
        public string PlanId { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public decimal PlanFee { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal PendingAmount { get; set; }
        public string Status { get; set; } = "active";
    }

    public class RenewMembershipRequest
    {
        [Required]
        public string PlanId { get; set; } = string.Empty;

        public string? StartDate { get; set; }

        [Range(0, 1000000)]
        public decimal AmountPaid { get; set; }

        public string PaymentMethod { get; set; } = "upi";
        public string? Notes { get; set; }
    }

    // --- Payment DTOs ---
    public class PaymentDto
    {
        public string Id { get; set; } = string.Empty;
        public string MemberId { get; set; } = string.Empty;
        public string? MemberName { get; set; }
        public string? MemberRefId { get; set; }
        public string? MembershipId { get; set; }
        public decimal Amount { get; set; }
        public string Date { get; set; } = string.Empty;
        public string Method { get; set; } = "cash";
        public string? Notes { get; set; }
        public string Status { get; set; } = "paid";
        public string? RecordedBy { get; set; }
    }

    public class RecordPaymentRequest
    {
        [Required]
        public string MemberId { get; set; } = string.Empty;

        public string? MembershipId { get; set; }

        [Required]
        [Range(1, 1000000, ErrorMessage = "Payment amount must be greater than zero")]
        public decimal Amount { get; set; }

        public string? PaymentDate { get; set; }

        [Required]
        public string PaymentMethod { get; set; } = "cash";

        public string? Notes { get; set; }
    }

    public class PaymentSummaryDto
    {
        public decimal TodayTotal { get; set; }
        public decimal ThisMonthTotal { get; set; }
        public decimal TotalPending { get; set; }
        public int TotalTransactions { get; set; }
    }

    // --- Notification DTOs ---
    public class NotificationDto
    {
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = "system";
        public string? MemberId { get; set; }
        public string? MemberName { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Priority { get; set; } = "medium";
        public bool Read { get; set; }
        public string? ReadAt { get; set; }
        public string Date { get; set; } = string.Empty;
    }

    // --- Dashboard DTOs ---
    public class AdminDashboardDto
    {
        public int TotalMembers { get; set; }
        public int ActiveMembers { get; set; }
        public int ExpiringSoon { get; set; }
        public int PendingFees { get; set; }
        public int TwoMonthsUnpaid { get; set; }
        public List<MemberDto> ExpiringList { get; set; } = new();
        public List<MemberDto> PendingList { get; set; } = new();
        public List<MemberDto> TwoMonthsUnpaidList { get; set; } = new();
    }

    public class ManagerDashboardDto
    {
        public int TotalMembers { get; set; }
        public int ActiveMembers { get; set; }
        public int TodayAdmissions { get; set; }
        public decimal TodayCollection { get; set; }
        public List<MemberDto> RecentMembers { get; set; } = new();
    }

    // --- Settings DTOs ---
    public class GymSettingsDto
    {
        public string Name { get; set; } = "BodyPower Gym";
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public List<int> ReminderDays { get; set; } = new() { 3, 1 };
        public int InactiveAfterMonths { get; set; } = 2;
    }

    public class UpdateSettingsRequest
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public List<int>? ReminderDays { get; set; }
        public int InactiveAfterMonths { get; set; } = 2;
    }
}
