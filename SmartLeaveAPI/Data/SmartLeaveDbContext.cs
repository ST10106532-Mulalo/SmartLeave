using Microsoft.EntityFrameworkCore;
using SmartLeaveAPI.Models;

namespace SmartLeaveAPI.Data
{
    public class SmartLeaveDbContext : DbContext
    {
        public SmartLeaveDbContext(DbContextOptions<SmartLeaveDbContext> options)
            : base(options)
        {
        }

        // DbSets for all your tables
        public DbSet<Employee> Employees { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<LateArrival> LateArrivals { get; set; }
        public DbSet<LeaveApproval> LeaveApprovals { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<LeaveType> LeaveTypes { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<UserSetting> UserSettings { get; set; }
        public DbSet<Overtime> Overtimes { get; set; }
        public DbSet<OvertimeApplication> OvertimeApplications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ============================================
            // Employee Self-Referencing (ReportsTo)
            // ============================================

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.ReportsTo)
                .WithMany(e => e.Subordinates)
                .HasForeignKey(e => e.ReportsToID)
                .OnDelete(DeleteBehavior.Restrict);

            // ============================================
            // Approval Flow Relationships
            // ============================================

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Approver)
                .WithMany()
                .HasForeignKey(e => e.ApprovedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // ============================================
            // Department Relationship
            // ============================================

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentID)
                .OnDelete(DeleteBehavior.SetNull);

            // ============================================
            // LeaveRequest Relationships
            // ============================================

            modelBuilder.Entity<LeaveRequest>()
                .HasOne(l => l.Employee)
                .WithMany(e => e.LeaveRequests)
                .HasForeignKey(l => l.EmployeeID)
                .OnDelete(DeleteBehavior.Cascade);

            // ============================================
            // LateArrival Relationships
            // ============================================

            modelBuilder.Entity<LateArrival>()
                .HasOne(l => l.Employee)
                .WithMany(e => e.LateArrivals)
                .HasForeignKey(l => l.EmployeeID)
                .OnDelete(DeleteBehavior.Cascade);

            // ============================================
            // LeaveApproval Relationships
            // ============================================

            modelBuilder.Entity<LeaveApproval>()
                .HasOne(a => a.LeaveRequest)
                .WithMany(l => l.LeaveApprovals)
                .HasForeignKey(a => a.LeaveRequestID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LeaveApproval>()
                .HasOne(a => a.Employee)
                .WithMany(e => e.LeaveApprovals)
                .HasForeignKey(a => a.ApproverID)
                .OnDelete(DeleteBehavior.Restrict);

            // ============================================
            // Overtime Relationships
            // ============================================

            modelBuilder.Entity<Overtime>()
                .HasOne(o => o.Manager)
                .WithMany()
                .HasForeignKey(o => o.ManagerID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<OvertimeApplication>()
                .HasOne(a => a.Overtime)
                .WithMany(o => o.Applications)
                .HasForeignKey(a => a.OvertimeID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OvertimeApplication>()
                .HasOne(a => a.Employee)
                .WithMany()
                .HasForeignKey(a => a.EmployeeID)
                .OnDelete(DeleteBehavior.Restrict);

            // ============================================
            // Indexes for performance
            // ============================================

            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.Email)
                .IsUnique();

            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.DepartmentID);

            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.ReportsToID);

            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.IsApproved);

            modelBuilder.Entity<LeaveRequest>()
                .HasIndex(l => l.EmployeeID);

            modelBuilder.Entity<LeaveRequest>()
                .HasIndex(l => l.Status);

            modelBuilder.Entity<LeaveRequest>()
                .HasIndex(l => l.AppliedOn);

            modelBuilder.Entity<LateArrival>()
                .HasIndex(l => l.EmployeeID);

            modelBuilder.Entity<LateArrival>()
                .HasIndex(l => l.Status);

            modelBuilder.Entity<LateArrival>()
                .HasIndex(l => l.ReportedOn);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.EmployeeID);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.IsRead);

            modelBuilder.Entity<UserSetting>()
                .HasIndex(u => u.EmployeeID)
                .IsUnique();

            modelBuilder.Entity<Overtime>()
                .HasIndex(o => o.Status);

            modelBuilder.Entity<Overtime>()
                .HasIndex(o => o.Date);

            modelBuilder.Entity<OvertimeApplication>()
                .HasIndex(a => a.Status);

            // ============================================
            // Default Values
            // ============================================

            modelBuilder.Entity<LeaveRequest>()
                .Property(l => l.Status)
                .HasDefaultValue("Pending");

            modelBuilder.Entity<LeaveRequest>()
                .Property(l => l.AppliedOn)
                .HasDefaultValueSql("GETDATE()");

            modelBuilder.Entity<LateArrival>()
                .Property(l => l.Status)
                .HasDefaultValue("Pending");

            modelBuilder.Entity<LateArrival>()
                .Property(l => l.ReportedOn)
                .HasDefaultValueSql("GETDATE()");

            modelBuilder.Entity<LeaveApproval>()
                .Property(a => a.Status)
                .HasDefaultValue("Pending");

            modelBuilder.Entity<LeaveApproval>()
                .Property(a => a.ApprovedOn)
                .HasDefaultValueSql("GETDATE()");

            modelBuilder.Entity<Notification>()
                .Property(n => n.CreatedAt)
                .HasDefaultValueSql("GETDATE()");

            modelBuilder.Entity<UserSetting>()
                .Property(u => u.MasterSound)
                .HasDefaultValue(true);

            modelBuilder.Entity<UserSetting>()
                .Property(u => u.Volume)
                .HasDefaultValue(80);

            modelBuilder.Entity<UserSetting>()
                .Property(u => u.Vibration)
                .HasDefaultValue(true);

            modelBuilder.Entity<UserSetting>()
                .Property(u => u.NotificationDuration)
                .HasDefaultValue(60);

            modelBuilder.Entity<UserSetting>()
                .Property(u => u.Theme)
                .HasDefaultValue("Light");

            modelBuilder.Entity<UserSetting>()
                .Property(u => u.DateFormat)
                .HasDefaultValue("MM/DD/YYYY");

            modelBuilder.Entity<UserSetting>()
                .Property(u => u.DailyDigest)
                .HasDefaultValue(false);

            modelBuilder.Entity<UserSetting>()
                .Property(u => u.DigestTime)
                .HasDefaultValue(new TimeSpan(8, 0, 0));
        }
    }
}