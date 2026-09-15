using System;
using BodyPowerGym.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BodyPowerGym.Api.Data
{
    public class BodyPowerGymDbContext : DbContext
    {
        public BodyPowerGymDbContext(DbContextOptions<BodyPowerGymDbContext> options) : base(options)
        {
        }

        public DbSet<Role> Roles => Set<Role>();
        public DbSet<User> Users => Set<User>();
        public DbSet<MembershipPlan> MembershipPlans => Set<MembershipPlan>();
        public DbSet<Member> Members => Set<Member>();
        public DbSet<Membership> Memberships => Set<Membership>();
        public DbSet<Payment> Payments => Set<Payment>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<ReminderEvent> ReminderEvents => Set<ReminderEvent>();
        public DbSet<GymSetting> GymSettings => Set<GymSetting>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Roles
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("Roles");
                entity.HasIndex(e => e.Name).IsUnique();
                entity.HasIndex(e => e.NormalizedName).IsUnique();
            });

            // 2. Users
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.NormalizedEmail).IsUnique();
                entity.HasIndex(e => e.Mobile).IsUnique();
                entity.HasIndex(e => e.RoleId);

                entity.HasOne(e => e.Role)
                    .WithMany(r => r.Users)
                    .HasForeignKey(e => e.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 3. MembershipPlans
            modelBuilder.Entity<MembershipPlan>(entity =>
            {
                entity.ToTable("MembershipPlans");
                entity.HasIndex(e => e.IsActive);
            });

            // 4. Members
            modelBuilder.Entity<Member>(entity =>
            {
                entity.ToTable("Members");
                entity.HasIndex(e => e.MemberId).IsUnique();
                entity.HasIndex(e => e.Mobile).IsUnique();
                entity.HasIndex(e => e.FullName);
                entity.HasIndex(e => e.MemberStatus);

                entity.HasOne(e => e.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(e => e.UpdatedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.UpdatedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // 5. Memberships
            modelBuilder.Entity<Membership>(entity =>
            {
                entity.ToTable("Memberships");
                entity.HasIndex(e => e.MemberId);
                entity.HasIndex(e => e.PlanId);
                entity.HasIndex(e => e.EndDate);
                entity.HasIndex(e => e.Status);

                entity.HasOne(e => e.Member)
                    .WithMany(m => m.Memberships)
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(e => e.Plan)
                    .WithMany(p => p.Memberships)
                    .HasForeignKey(e => e.PlanId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(e => e.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // 6. Payments
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.ToTable("Payments");
                entity.HasIndex(e => e.MemberId);
                entity.HasIndex(e => e.MembershipId);
                entity.HasIndex(e => e.PaymentDate);

                entity.HasOne(e => e.Member)
                    .WithMany(m => m.Payments)
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(e => e.Membership)
                    .WithMany(m => m.Payments)
                    .HasForeignKey(e => e.MembershipId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(e => e.RecordedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.RecordedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // 7. Notifications
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.ToTable("Notifications");
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.IsRead);
                entity.HasIndex(e => e.CreatedAt);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(e => e.Member)
                    .WithMany()
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // 8. ReminderEvents (Deduplication)
            modelBuilder.Entity<ReminderEvent>(entity =>
            {
                entity.ToTable("ReminderEvents");
                entity.HasIndex(e => new { e.MemberId, e.MembershipId, e.EventType, e.EventDate })
                    .IsUnique();

                entity.HasOne(e => e.Member)
                    .WithMany()
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(e => e.Membership)
                    .WithMany()
                    .HasForeignKey(e => e.MembershipId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // 9. GymSettings
            modelBuilder.Entity<GymSetting>(entity =>
            {
                entity.ToTable("GymSettings");
            });
        }
    }
}
