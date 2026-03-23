using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartLeaveAPI.Models
{
    public class Employee
    {
        [Key]
        public int EmployeeID { get; set; }

        [Required]
        [MaxLength(100)]
        public required string Name { get; set; }

        [Required]
        [MaxLength(100)]
        [EmailAddress]
        public required string Email { get; set; }

        // 🔗 Foreign key to Department
        public int? DepartmentID { get; set; }

        [ForeignKey("DepartmentID")]
        public Department? Department { get; set; }

        // 🔐 Authentication fields
        [Required]
        public required string PasswordHash { get; set; }

        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = "Employee";

        // 👤 Personal information
        [Required]
        [MaxLength(10)]
        public required string Gender { get; set; }

        [Required]
        public DateTime DateOfBirth { get; set; }

        public DateTime HireDate { get; set; } = DateTime.UtcNow;

        // 👥 Reporting structure
        public int? ReportsToID { get; set; }

        [ForeignKey("ReportsToID")]
        public Employee? ReportsTo { get; set; }

        public ICollection<Employee>? Subordinates { get; set; }

        // ✅ Approval flow fields (ADD THESE)
        public string? RequestedRole { get; set; }
        public bool IsApproved { get; set; } = true;
        public int? ApprovedBy { get; set; }
        public DateTime? ApprovedOn { get; set; }

        [ForeignKey("ApprovedBy")]
        public Employee? Approver { get; set; }

        // Keep existing navigation properties
        public ICollection<LeaveRequest>? LeaveRequests { get; set; }
        public ICollection<LateArrival>? LateArrivals { get; set; }
        public ICollection<LeaveApproval>? LeaveApprovals { get; set; }
    }
}