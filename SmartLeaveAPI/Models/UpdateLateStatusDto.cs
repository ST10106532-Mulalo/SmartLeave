using System.ComponentModel.DataAnnotations;

namespace SmartLeaveAPI.Models
{
    // DTO for updating the status of a late arrival
    public class UpdateLateStatusDto
    {
        [Required]
        [MaxLength(20)]
        public string Status { get; set; }
    }
}