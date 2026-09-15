using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BodyPowerGym.Api.Models
{
    public static class Roles
    {
        public const string Admin = "admin";
        public const string Manager = "manager";
    }

    public static class MemberStatuses
    {
        public const string Active = "active";
        public const string Expiring = "expiring";
        public const string Expired = "expired";
        public const string Inactive = "inactive";
    }

    public static class PaymentStatuses
    {
        public const string Paid = "paid";
        public const string Partial = "partial";
        public const string Unpaid = "unpaid";
    }

    public static class PaymentMethods
    {
        public const string Cash = "cash";
        public const string Upi = "upi";
        public const string Card = "card";
        public const string Other = "other";
    }

    public static class NotificationTypes
    {
        public const string Expiry = "expiry";
        public const string Payment = "payment";
        public const string Unpaid = "unpaid";
        public const string Inactive = "inactive";
        public const string System = "system";
    }

    public static class ReminderEventTypes
    {
        public const string Expiry3Day = "Expiry3Day";
        public const string Expiry1Day = "Expiry1Day";
        public const string ExpiryDay = "ExpiryDay";
        public const string TwoMonthsUnpaid = "TwoMonthsUnpaid";
    }

    public class Role
    {
        [Key]
        [MaxLength(50)]
        public string Id { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string NormalizedName { get; set; } = string.Empty;

        [MaxLength(250)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<User> Users { get; set; } = new List<User>();
    }

    public class User
    {
        [Key]
        [MaxLength(50)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(50)]
        public string RoleId { get; set; } = Roles.Manager;

        public Role? Role { get; set; }

        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(256)]
        public string NormalizedEmail { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Mobile { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string PasswordHash { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? AvatarUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public class MembershipPlan
    {
        [Key]
        [MaxLength(50)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public int DurationMonths { get; set; } = 1;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
    }

    public class Member
    {
        [Key]
        [MaxLength(50)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(30)]
        public string MemberId { get; set; } = string.Empty; // e.g. BP-000001

        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Mobile { get; set; } = string.Empty;

        [MaxLength(256)]
        public string? Email { get; set; }

        public DateOnly? DateOfBirth { get; set; }

        [MaxLength(20)]
        public string? Gender { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }

        [MaxLength(500)]
        public string? PhotoUrl { get; set; }

        [Required]
        [MaxLength(30)]
        public string MemberStatus { get; set; } = MemberStatuses.Active;

        public DateOnly? InactiveSince { get; set; }

        public DateOnly JoinedOn { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [MaxLength(50)]
        public string? CreatedByUserId { get; set; }
        public User? CreatedByUser { get; set; }

        public DateTime? UpdatedAt { get; set; }

        [MaxLength(50)]
        public string? UpdatedByUserId { get; set; }
        public User? UpdatedByUser { get; set; }

        public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }

    public class Membership
    {
        [Key]
        [MaxLength(50)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(50)]
        public string MemberId { get; set; } = string.Empty;
        public Member? Member { get; set; }

        [Required]
        [MaxLength(50)]
        public string PlanId { get; set; } = string.Empty;
        public MembershipPlan? Plan { get; set; }

        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PlanFee { get; set; }

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = MemberStatuses.Active;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(50)]
        public string? CreatedByUserId { get; set; }
        public User? CreatedByUser { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }

    public class Payment
    {
        [Key]
        [MaxLength(50)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(50)]
        public string MemberId { get; set; } = string.Empty;
        public Member? Member { get; set; }

        [MaxLength(50)]
        public string? MembershipId { get; set; }
        public Membership? Membership { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateOnly PaymentDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

        [Required]
        [MaxLength(30)]
        public string PaymentMethod { get; set; } = PaymentMethods.Cash;

        [MaxLength(500)]
        public string? Notes { get; set; }

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "paid"; // 'paid', 'refunded'

        [MaxLength(50)]
        public string? RecordedByUserId { get; set; }
        public User? RecordedByUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Notification
    {
        [Key]
        [MaxLength(50)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [MaxLength(50)]
        public string? UserId { get; set; }
        public User? User { get; set; }

        [MaxLength(50)]
        public string? MemberId { get; set; }
        public Member? Member { get; set; }

        [Required]
        [MaxLength(30)]
        public string Type { get; set; } = NotificationTypes.System;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Message { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Priority { get; set; } = "medium"; // 'high', 'medium', 'low'

        public bool IsRead { get; set; } = false;

        public DateTime? ReadAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ReminderEvent
    {
        [Key]
        [MaxLength(50)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(50)]
        public string MemberId { get; set; } = string.Empty;
        public Member? Member { get; set; }

        [MaxLength(50)]
        public string? MembershipId { get; set; }
        public Membership? Membership { get; set; }

        [Required]
        [MaxLength(50)]
        public string EventType { get; set; } = string.Empty; // 'Expiry3Day', 'Expiry1Day', 'ExpiryDay', 'TwoMonthsUnpaid'

        public DateOnly EventDate { get; set; }

        public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
    }

    public class GymSetting
    {
        [Key]
        [MaxLength(50)]
        public string Id { get; set; } = "gym-default";

        [Required]
        [MaxLength(150)]
        public string GymName { get; set; } = "BodyPower Gym";

        [MaxLength(50)]
        public string Phone { get; set; } = "020-26543210";

        [MaxLength(500)]
        public string Address { get; set; } = "First Floor, Fitness Hub, FC Road, Shivajinagar, Pune - 411005";

        [MaxLength(500)]
        public string? LogoUrl { get; set; }

        [Required]
        [MaxLength(100)]
        public string ReminderDaysJson { get; set; } = "[3,1]";

        public int InactiveAfterMonths { get; set; } = 2;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
