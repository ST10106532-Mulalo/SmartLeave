using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace SmartLeaveAPI.Models
{
    public class Department
    {
        [Key]
        public int DepartmentID { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; }

        // All employees in this department
        public ICollection<Employee>? Employees { get; set; }

        // Convenience properties - these don't need EF configuration
        // They filter Employees collection by Role
        [NotMapped]
        public IEnumerable<Employee>? Managers =>
            Employees?.Where(e => e.Role == "Manager");

        [NotMapped]
        public IEnumerable<Employee>? Supervisors =>
            Employees?.Where(e => e.Role == "Supervisor");

        [NotMapped]
        public int EmployeeCount => Employees?.Count ?? 0;

        [NotMapped]
        public int ManagerCount => Managers?.Count() ?? 0;

        [NotMapped]
        public int SupervisorCount => Supervisors?.Count() ?? 0;
    }
}