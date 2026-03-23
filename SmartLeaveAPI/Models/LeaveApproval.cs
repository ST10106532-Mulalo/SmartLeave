using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartLeaveAPI.Models
{
    /// <summary>
    /// Represents approval of a leave request by a manager/HR
    /// Maps to LeaveApprovals table
    /// </summary>
    public class LeaveApproval
    {
        [Key]
        public int ApprovalID { get; set; }

        [Required]
        [ForeignKey("LeaveRequest")]
        public int LeaveRequestID { get; set; }

        [Required]
        [ForeignKey("Employee")]
        public int ApproverID { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        [MaxLength(255)]
        public string? Comment { get; set; }  // Made nullable with ?

        public DateTime ApprovedOn { get; set; } = DateTime.Now;

        // Navigation properties - made nullable
        public LeaveRequest? LeaveRequest { get; set; }
        public Employee? Employee { get; set; }
    }
}