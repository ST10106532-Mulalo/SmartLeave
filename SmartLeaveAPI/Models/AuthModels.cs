using System.ComponentModel.DataAnnotations;

namespace SmartLeaveAPI.Models
{
    public class LoginModel
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        [MinLength(6)]
        public required string Password { get; set; }
    }

    public class RegisterModel
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        [MinLength(6)]
        public required string Password { get; set; }

        [Required]
        [MaxLength(100)]
        public required string Name { get; set; }

        public string? Department { get; set; }

        [Required]
        [MaxLength(10)]
        public required string Gender { get; set; }

        [Required]
        public DateTime DateOfBirth { get; set; }

        public string? RequestedRole { get; set; } // "Employee", "Supervisor", "Manager", "Admin"
    }

    public class AuthResponse
    {
        public string? Token { get; set; }
        public int EmployeeID { get; set; }
        public required string Email { get; set; }
        public required string Name { get; set; }
        public required string Role { get; set; }
        public string? Department { get; set; }
        public bool IsApproved { get; set; } = true;
        public string? Message { get; set; }
        public DateTime Expiration { get; set; }
    }
}