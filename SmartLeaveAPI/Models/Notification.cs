using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartLeaveAPI.Models
{
    public class Notification
    {
        [Key]
        public int NotificationID { get; set; }

        [Required]
        public int EmployeeID { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } // NewLeave, NewLate, Approved, Rejected, etc.

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        [Required]
        [MaxLength(500)]
        public string Message { get; set; }

        public int? ReferenceID { get; set; } // LeaveID or LateID

        [MaxLength(20)]
        public string? ReferenceType { get; set; } // "Leave", "Late"

        public bool IsRead { get; set; } = false;
        public bool IsHeard { get; set; } = false;

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? ReadAt { get; set; }

        // Navigation property
        [ForeignKey("EmployeeID")]
        public Employee? Employee { get; set; }
    }
}