using Microsoft.AspNetCore.Mvc;

namespace SmartLeaveAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ConfigController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public ConfigController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // Test endpoint to verify controller is working
        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new
            {
                message = "Config controller is working",
                timestamp = DateTime.Now
            });
        }

        // Returns email validation rules configured in appsettings.json
        [HttpGet("email-rules")]
        public IActionResult GetEmailRules()
        {
            try
            {
                var config = _configuration.GetSection("EmailValidation").Get<EmailValidationConfig>();

                // If config is null, return default rules
                if (config == null || config.Rules == null || config.Rules.Length == 0)
                {
                    var defaultConfig = new EmailValidationConfig
                    {
                        Enabled = true,
                        StrictMode = true,
                        Rules = new[]
                        {
                            new EmailDomainRule
                            {
                                Name = "Employees",
                                AllowedDomains = new[] { "company.com", "company.co.za" },
                                UsernamePattern = "^[a-zA-Z]+\\.[a-zA-Z]+$",
                                Description = "firstname.lastname@company.com",
                                IsActive = true
                            },
                            new EmailDomainRule
                            {
                                Name = "External",
                                AllowedDomains = new[] { "gmail.com", "outlook.com", "yahoo.com", "hotmail.com" },
                                UsernamePattern = null,
                                Description = "Personal email providers",
                                IsActive = true
                            }
                        }
                    };
                    return Ok(defaultConfig);
                }

                return Ok(config);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Failed to load email configuration",
                    message = ex.Message
                });
            }
        }
    }

    // Email domain validation rule for different user types
    public class EmailDomainRule
    {
        public string Name { get; set; } = string.Empty;
        public string[] AllowedDomains { get; set; } = Array.Empty<string>();
        public string? UsernamePattern { get; set; }
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    // Root configuration for email validation
    public class EmailValidationConfig
    {
        public bool Enabled { get; set; }
        public bool StrictMode { get; set; }
        public EmailDomainRule[] Rules { get; set; } = Array.Empty<EmailDomainRule>();
    }
}