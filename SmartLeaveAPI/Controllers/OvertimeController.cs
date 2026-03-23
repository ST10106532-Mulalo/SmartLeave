using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLeaveAPI.Data;
using SmartLeaveAPI.Models;

namespace SmartLeaveAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OvertimeController : ControllerBase
    {
        private readonly SmartLeaveDbContext _context;

        public OvertimeController(SmartLeaveDbContext context)
        {
            _context = context;
        }

        // GET: api/Overtime?departmentId={departmentId}
        [HttpGet]
        public async Task<IActionResult> GetOpenOvertime([FromQuery] int? departmentId)
        {
            var query = _context.Overtimes
                .Where(o => o.Status == "Open" && o.Date >= DateTime.Today)
                .Include(o => o.Manager);

            var overtime = await query
                .Where(o => !departmentId.HasValue || (o.Manager.Department != null && o.Manager.Department.DepartmentID == departmentId.Value))
                .OrderBy(o => o.Date)
                .Select(o => new
                {
                    o.OvertimeID,
                    o.Title,
                    o.Description,
                    o.Date,
                    o.StartTime,
                    o.EndTime,
                    o.MaxSlots,
                    o.CurrentSlots,
                    ManagerName = o.Manager.Name,
                    ManagerDepartment = o.Manager.Department != null ? o.Manager.Department.Name : "Unknown"
                })
                .ToListAsync();

            return Ok(overtime);
        }

        // GET: api/Overtime/manager/{managerId}
        [HttpGet("manager/{managerId}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetManagerOvertime(int managerId)
        {
            var overtime = await _context.Overtimes
                .Where(o => o.ManagerID == managerId)
                .Include(o => o.Applications)
                .ThenInclude(a => a.Employee)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    o.OvertimeID,
                    o.Title,
                    o.Description,
                    o.Date,
                    o.StartTime,
                    o.EndTime,
                    o.MaxSlots,
                    o.CurrentSlots,
                    o.Status,
                    o.CreatedAt,
                    Applications = o.Applications.Select(a => new
                    {
                        a.ApplicationID,
                        a.Employee.Name,
                        a.Status,
                        a.AppliedAt,
                        a.Reason
                    })
                })
                .ToListAsync();

            return Ok(overtime);
        }

        // GET: api/Overtime/employee/{employeeId}/applications
        [HttpGet("employee/{employeeId}/applications")]
        public async Task<IActionResult> GetEmployeeApplications(int employeeId)
        {
            var applications = await _context.OvertimeApplications
                .Where(a => a.EmployeeID == employeeId)
                .Include(a => a.Overtime)
                .ThenInclude(o => o.Manager)
                .OrderByDescending(a => a.AppliedAt)
                .Select(a => new
                {
                    a.ApplicationID,
                    a.OvertimeID,
                    a.Status,
                    a.AppliedAt,
                    a.Reason,
                    Overtime = new
                    {
                        a.Overtime.Title,
                        a.Overtime.Description,
                        a.Overtime.Date,
                        a.Overtime.StartTime,
                        a.Overtime.EndTime,
                        ManagerName = a.Overtime.Manager.Name
                    }
                })
                .ToListAsync();

            return Ok(applications);
        }

        // GET: api/Overtime/employee/department/{employeeId}
        [HttpGet("employee/department/{employeeId}")]
        public async Task<IActionResult> GetEmployeeDepartment(int employeeId)
        {
            var employee = await _context.Employees
                .Where(e => e.EmployeeID == employeeId)
                .Select(e => new
                {
                    e.EmployeeID,
                    e.DepartmentID,
                    DepartmentName = e.Department != null ? e.Department.Name : ""
                })
                .FirstOrDefaultAsync();

            if (employee == null)
                return NotFound(new { message = "Employee not found" });

            return Ok(employee);
        }

        // POST: api/Overtime
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateOvertime([FromBody] CreateOvertimeDto dto)
        {
            var overtime = new Overtime
            {
                ManagerID = dto.ManagerID,
                Title = dto.Title,
                Description = dto.Description ?? "",
                Date = dto.Date,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                MaxSlots = dto.MaxSlots,
                CurrentSlots = 0,
                Status = "Open"
            };

            _context.Overtimes.Add(overtime);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Overtime created successfully", overtime });
        }

        // POST: api/Overtime/apply
        [HttpPost("apply")]
        public async Task<IActionResult> ApplyForOvertime([FromBody] ApplyOvertimeDto dto)
        {
            var overtime = await _context.Overtimes.FindAsync(dto.OvertimeID);
            if (overtime == null)
                return NotFound(new { message = "Overtime not found" });

            if (overtime.Status != "Open")
                return BadRequest(new { message = "This overtime opportunity is no longer available" });

            if (overtime.CurrentSlots >= overtime.MaxSlots)
                return BadRequest(new { message = "No slots available" });

            var existing = await _context.OvertimeApplications
                .FirstOrDefaultAsync(a => a.OvertimeID == dto.OvertimeID && a.EmployeeID == dto.EmployeeID);

            if (existing != null)
                return BadRequest(new { message = "You have already applied for this overtime" });

            var application = new OvertimeApplication
            {
                OvertimeID = dto.OvertimeID,
                EmployeeID = dto.EmployeeID,
                Reason = dto.Reason
            };

            _context.OvertimeApplications.Add(application);
            overtime.CurrentSlots++;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Application submitted successfully", application });
        }

        // PUT: api/Overtime/application/{applicationId}/approve
        [HttpPut("application/{applicationId}/approve")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> ApproveApplication(int applicationId)
        {
            var application = await _context.OvertimeApplications
                .Include(a => a.Overtime)
                .FirstOrDefaultAsync(a => a.ApplicationID == applicationId);

            if (application == null)
                return NotFound(new { message = "Application not found" });

            application.Status = "Approved";
            application.ApprovedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Application approved" });
        }

        // PUT: api/Overtime/application/{applicationId}/reject
        [HttpPut("application/{applicationId}/reject")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> RejectApplication(int applicationId)
        {
            var application = await _context.OvertimeApplications
                .Include(a => a.Overtime)
                .FirstOrDefaultAsync(a => a.ApplicationID == applicationId);

            if (application == null)
                return NotFound(new { message = "Application not found" });

            application.Status = "Rejected";

            await _context.SaveChangesAsync();

            return Ok(new { message = "Application rejected" });
        }

        // PUT: api/Overtime/{overtimeId}/close
        [HttpPut("{overtimeId}/close")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CloseOvertime(int overtimeId)
        {
            var overtime = await _context.Overtimes.FindAsync(overtimeId);
            if (overtime == null)
                return NotFound(new { message = "Overtime not found" });

            overtime.Status = "Closed";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Overtime closed" });
        }
    }

    public class CreateOvertimeDto
    {
        public int ManagerID { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public int MaxSlots { get; set; }
    }

    public class ApplyOvertimeDto
    {
        public int OvertimeID { get; set; }
        public int EmployeeID { get; set; }
        public string? Reason { get; set; }
    }
}