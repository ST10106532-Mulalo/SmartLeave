using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartLeaveAPI.Models
{
    public class UserSetting
    {
        [Key]
        public int SettingID { get; set; }

        [Required]
        public int EmployeeID { get; set; }

        [Required]
        public bool MasterSound { get; set; } = true;

        [Required]
        public int Volume { get; set; } = 80;

        [Required]
        public bool Vibration { get; set; } = true;

        [Required]
        public int NotificationDuration { get; set; } = 60; // seconds

        [Required]
        [MaxLength(20)]
        public string Theme { get; set; } = "Light";

        [Required]
        [MaxLength(20)]
        public string DateFormat { get; set; } = "MM/DD/YYYY";

        [Required]
        public bool DailyDigest { get; set; } = false;

        [Required]
        public TimeSpan DigestTime { get; set; } = new TimeSpan(8, 0, 0);

        // Navigation property
        [ForeignKey("EmployeeID")]
        public Employee? Employee { get; set; }
    }
}