using System.Collections.Generic;  
using System.ComponentModel.DataAnnotations;

namespace SmartLeaveAPI.Models
{
    public class LeaveType
    {
        [Key]
        public int LeaveTypeID { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; }

        public int? MaxDays { get; set; }

        [MaxLength(255)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        // Gender-specific leave
        public string? ApplicableToGender { get; set; } // "Male", "Female", "All"

        // Navigation property
        public ICollection<LeaveRequest>? LeaveRequests { get; set; }
    }
}