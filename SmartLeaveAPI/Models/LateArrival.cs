using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartLeaveAPI.Models
{
    public class LateArrival
    {
        [Key]
        public int LateID { get; set; }

        [Required]
        public int EmployeeID { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public TimeSpan ExpectedArrival { get; set; }

        [Required]
        public string Reason { get; set; } = string.Empty;

        public string Status { get; set; } = "Pending";

        // Photo evidence fields
        public string? PhotoName { get; set; }
        public string? PhotoPath { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime ReportedOn { get; set; } = DateTime.Now;

        // Navigation property
        [ForeignKey("EmployeeID")]
        public Employee? Employee { get; set; }
    }
}