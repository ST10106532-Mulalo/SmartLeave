using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartLeaveAPI.Models
{
    public class Overtime
    {
        [Key]
        public int OvertimeID { get; set; }

        [Required]
        public int ManagerID { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        [Required]
        public int MaxSlots { get; set; }

        public int CurrentSlots { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "Open"; // Open, Closed, Cancelled

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ManagerID")]
        public virtual Employee Manager { get; set; }

        public virtual ICollection<OvertimeApplication> Applications { get; set; } = new List<OvertimeApplication>();
    }

    public class OvertimeApplication
    {
        [Key]
        public int ApplicationID { get; set; }

        [Required]
        public int OvertimeID { get; set; }

        [Required]
        public int EmployeeID { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ApprovedAt { get; set; }

        [MaxLength(200)]
        public string? Reason { get; set; }

        // Navigation properties
        [ForeignKey("OvertimeID")]
        public virtual Overtime Overtime { get; set; }

        [ForeignKey("EmployeeID")]
        public virtual Employee Employee { get; set; }
    }
}