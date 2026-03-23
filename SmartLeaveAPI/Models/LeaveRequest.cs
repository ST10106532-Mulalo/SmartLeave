using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartLeaveAPI.Models
{
    public class LeaveRequest
    {
        [Key]
        public int LeaveID { get; set; }

        [Required]
        public int EmployeeID { get; set; }

        [Required]
        public int LeaveTypeID { get; set; }  // Changed from string to int FK

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public string? Reason { get; set; }

        public string Status { get; set; } = "Pending";

        [Column(TypeName = "datetime")]
        public DateTime AppliedOn { get; set; } = DateTime.Now;

        // Supporting document fields (optional)
        public string? SupportingDocumentName { get; set; }
        public string? SupportingDocumentPath { get; set; }

        [NotMapped]
        public bool HasSupportingDocument => !string.IsNullOrEmpty(SupportingDocumentPath);

        // Navigation properties
        [ForeignKey("LeaveTypeID")]
        public LeaveType? LeaveType { get; set; }

        [ForeignKey("EmployeeID")]
        public Employee? Employee { get; set; }

        public ICollection<LeaveApproval>? LeaveApprovals { get; set; }
    }
}