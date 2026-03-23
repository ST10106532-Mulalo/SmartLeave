using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartLeaveAPI.Data;
using SmartLeaveAPI.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Data.SqlClient;

namespace SmartLeaveAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly SmartLeaveDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(SmartLeaveDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // POST: api/Auth/register
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register(RegisterModel model)
        {
            try
            {
                // Normalize email to lowercase for consistent comparison
                var normalizedEmail = model.Email.Trim().ToLower();

                // Check if email already exists (case-insensitive)
                var existingUser = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Email.ToLower() == normalizedEmail);

                if (existingUser != null)
                {
                    return BadRequest(new
                    {
                        message = "Email already registered. Please use a different email address.",
                        field = "email"
                    });
                }

                // Hash the password
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);

                // Find department by name (case-insensitive)
                Department? department = null;
                if (!string.IsNullOrEmpty(model.Department))
                {
                    department = await _context.Departments
                        .FirstOrDefaultAsync(d => d.Name.ToLower() == model.Department.ToLower());
                }

                // Check if this is the first user ever
                var userCount = await _context.Employees.CountAsync();
                bool isFirstUser = userCount == 0;

                // Determine role and approval status
                string role;
                bool isApproved;
                string? requestedRole = null;

                if (isFirstUser)
                {
                    // First user becomes Admin automatically
                    role = "Admin";
                    isApproved = true;
                }
                else
                {
                    // For subsequent users, check requested role
                    switch (model.RequestedRole)
                    {
                        case "Admin":
                        case "Manager":
                        case "Supervisor":
                            // Elevated roles need approval
                            requestedRole = model.RequestedRole;
                            role = "Employee";
                            isApproved = false;
                            break;

                        case "Employee":
                        default:
                            role = "Employee";
                            isApproved = true;
                            break;
                    }
                }

                // Create new employee
                var employee = new Employee
                {
                    Email = normalizedEmail,
                    PasswordHash = passwordHash,
                    Name = model.Name,
                    DepartmentID = department?.DepartmentID,
                    Gender = model.Gender,
                    DateOfBirth = model.DateOfBirth,
                    Role = role,
                    RequestedRole = requestedRole,
                    IsApproved = isApproved,
                    HireDate = DateTime.UtcNow
                };

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();

                // Get department name for response
                var departmentName = department?.Name ?? "";

                // Generate JWT token (only if approved)
                if (isApproved)
                {
                    var token = GenerateJwtToken(employee, departmentName);

                    return Ok(new AuthResponse
                    {
                        Token = token,
                        EmployeeID = employee.EmployeeID,
                        Email = employee.Email,
                        Name = employee.Name,
                        Role = employee.Role,
                        Department = departmentName,
                        IsApproved = true,
                        Expiration = DateTime.UtcNow.AddDays(7)
                    });
                }
                else
                {
                    return Ok(new AuthResponse
                    {
                        EmployeeID = employee.EmployeeID,
                        Email = employee.Email,
                        Name = employee.Name,
                        Role = "Pending",
                        Department = departmentName,
                        IsApproved = false,
                        Message = "Your registration is pending approval. You will be notified once approved."
                    });
                }
            }
            catch (DbUpdateException ex)
            {
                // Handle unique constraint violation (in case the check missed it due to race condition)
                if (ex.InnerException is SqlException sqlEx && sqlEx.Number == 2627)
                {
                    return BadRequest(new
                    {
                        message = "Email already registered. Please use a different email address.",
                        field = "email"
                    });
                }

                // Log the error for debugging
                Console.WriteLine($"Registration error: {ex.Message}");

                return StatusCode(500, new
                {
                    message = "Registration failed. Please try again.",
                    error = ex.Message
                });
            }
            catch (Exception ex)
            {
                // Log the error for debugging
                Console.WriteLine($"Registration error: {ex.Message}");

                return StatusCode(500, new
                {
                    message = "An unexpected error occurred. Please try again.",
                    error = ex.Message
                });
            }
        }

        // POST: api/Auth/login
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginModel model)
        {
            try
            {
                // Find employee by email with department included (case-insensitive)
                var employee = await _context.Employees
                    .Include(e => e.Department)
                    .FirstOrDefaultAsync(e => e.Email.ToLower() == model.Email.Trim().ToLower());

                if (employee == null)
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Verify password
                var validPassword = BCrypt.Net.BCrypt.Verify(model.Password, employee.PasswordHash);

                if (!validPassword)
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Check if user is approved
                if (!employee.IsApproved)
                {
                    return Unauthorized(new
                    {
                        message = "Your account is pending approval. Please wait for an administrator to approve your registration.",
                        isPending = true
                    });
                }

                // Get department name
                var departmentName = employee.Department?.Name ?? "Unknown";

                // Generate JWT token
                var token = GenerateJwtToken(employee, departmentName);

                return Ok(new AuthResponse
                {
                    Token = token,
                    EmployeeID = employee.EmployeeID,
                    Email = employee.Email,
                    Name = employee.Name,
                    Role = employee.Role,
                    Department = departmentName,
                    IsApproved = true,
                    Expiration = DateTime.UtcNow.AddDays(7)
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login error: {ex.Message}");
                return StatusCode(500, new { message = "Login failed. Please try again." });
            }
        }

        // ===== DEBUG ENDPOINT - Test password verification =====
        [HttpGet("debug-password")]
        public async Task<IActionResult> DebugPassword(string email, string password)
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email.ToLower() == email.ToLower());
            if (employee == null)
                return NotFound(new { message = "User not found" });

            var isValid = BCrypt.Net.BCrypt.Verify(password, employee.PasswordHash);

            return Ok(new
            {
                email = employee.Email,
                passwordProvided = password,
                isValid = isValid,
                hashPrefix = employee.PasswordHash?.Substring(0, 20) + "...",
                role = employee.Role,
                isApproved = employee.IsApproved
            });
        }

        // ===== HASH GENERATOR - Use this to get correct hash =====
        [HttpGet("generate-hash")]
        public IActionResult GenerateHash(string password)
        {
            var hash = BCrypt.Net.BCrypt.HashPassword(password);
            return Ok(new
            {
                password,
                hash,
                message = "Copy this hash and update your database"
            });
        }

        private string GenerateJwtToken(Employee employee, string departmentName)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
            var jwtAudience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, employee.EmployeeID.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, employee.Email),
                new Claim("name", employee.Name),
                new Claim("role", employee.Role),
                new Claim("department", departmentName),
                new Claim("departmentId", employee.DepartmentID?.ToString() ?? ""),
                new Claim("isApproved", employee.IsApproved.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}