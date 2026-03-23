namespace SmartLeaveAPI.Models
{
    public class EmailDomainRule
    {
        public string Name { get; set; }              // e.g., "Employees", "Students", "Contractors"
        public string[] AllowedDomains { get; set; }   // e.g., ["company.com", "company.co.za"]
        public string? UsernamePattern { get; set; }   // Optional regex for username format
        public string Description { get; set; }        // Description for UI
        public bool IsActive { get; set; } = true;
    }

    public class EmailValidationConfig
    {
        public bool Enabled { get; set; } = true;
        public bool StrictMode { get; set; } = true;
        public EmailDomainRule[] Rules { get; set; }
    }
}