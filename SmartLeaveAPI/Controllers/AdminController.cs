using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLeaveAPI.Data;
using SmartLeaveAPI.Models;

namespace SmartLeaveAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly SmartLeaveDbContext _context;

        public AdminController(SmartLeaveDbContext context)
        {
            _context = context;
        }

        // GET: api/Admin/employees
        [HttpGet("employees")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllEmployees()
        {
            var employees = await _context.Employees
                .Include(e => e.Department)
                .Select(e => new
                {
                    e.EmployeeID,
                    e.Name,
                    e.Email,
                    Department = e.Department != null ? e.Department.Name : "Unassigned",
                    DepartmentID = e.DepartmentID,
                    e.Role,
                    e.Gender,
                    e.DateOfBirth,
                    e.HireDate,
                    e.ReportsToID,
                    e.IsApproved,
                    e.RequestedRole,
                    LeaveCount = _context.LeaveRequests.Count(l => l.EmployeeID == e.EmployeeID),
                    LateCount = _context.LateArrivals.Count(l => l.EmployeeID == e.EmployeeID)
                })
                .ToListAsync();

            return Ok(employees);
        }

        // GET: api/Admin/pending-approvals
        [HttpGet("pending-approvals")]
        public async Task<ActionResult<IEnumerable<object>>> GetPendingApprovals()
        {
            var pendingUsers = await _context.Employees
                .Where(e => !e.IsApproved && e.RequestedRole != null)
                .Select(e => new
                {
                    e.EmployeeID,
                    e.Name,
                    e.Email,
                    RequestedRole = e.RequestedRole,
                    e.DepartmentID,
                    Department = e.Department != null ? e.Department.Name : "Unassigned",
                    Date = e.HireDate
                })
                .ToListAsync();

            return Ok(pendingUsers);
        }

        // GET: api/Admin/leave-requests
        [HttpGet("leave-requests")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllLeaveRequests()
        {
            var leaves = await _context.LeaveRequests
                .Include(l => l.Employee)
                    .ThenInclude(e => e.Department)
                .OrderByDescending(l => l.AppliedOn)
                .Select(l => new
                {
                    l.LeaveID,
                    l.LeaveType,
                    l.StartDate,
                    l.EndDate,
                    l.Reason,
                    l.Status,
                    l.AppliedOn,
                    l.SupportingDocumentName,
                    l.SupportingDocumentPath,
                    EmployeeName = l.Employee.Name,
                    EmployeeID = l.Employee.EmployeeID,
                    EmployeeEmail = l.Employee.Email,
                    EmployeeDepartment = l.Employee.Department != null ? l.Employee.Department.Name : "Unassigned"
                })
                .ToListAsync();

            return Ok(leaves);
        }

        // GET: api/Admin/late-arrivals
        [HttpGet("late-arrivals")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllLateArrivals()
        {
            var late = await _context.LateArrivals
                .Include(l => l.Employee)
                    .ThenInclude(e => e.Department)
                .OrderByDescending(l => l.ReportedOn)
                .Select(l => new
                {
                    l.LateID,
                    l.Date,
                    l.ExpectedArrival,
                    l.Reason,
                    l.Status,
                    l.PhotoName,
                    l.PhotoPath,
                    l.ReportedOn,
                    EmployeeName = l.Employee.Name,
                    EmployeeID = l.Employee.EmployeeID,
                    EmployeeEmail = l.Employee.Email,
                    EmployeeDepartment = l.Employee.Department != null ? l.Employee.Department.Name : "Unassigned"
                })
                .ToListAsync();

            return Ok(late);
        }

        // GET: api/Admin/departments
        [HttpGet("departments")]
        public async Task<ActionResult<IEnumerable<object>>> GetDepartments()
        {
            var departments = await _context.Departments
                .Select(d => new
                {
                    d.DepartmentID,
                    d.Name,
                    EmployeeCount = _context.Employees.Count(e => e.DepartmentID == d.DepartmentID)
                })
                .ToListAsync();

            return Ok(departments);
        }

        // GET: api/Admin/stats
        [HttpGet("stats")]
        public async Task<ActionResult<object>> GetSystemStats()
        {
            var stats = new
            {
                TotalEmployees = await _context.Employees.CountAsync(),
                TotalDepartments = await _context.Departments.CountAsync(),
                PendingLeaves = await _context.LeaveRequests.CountAsync(l => l.Status == "Pending"),
                PendingLate = await _context.LateArrivals.CountAsync(l => l.Status == "Pending"),
                ApprovedLeaves = await _context.LeaveRequests.CountAsync(l => l.Status == "Approved"),
                ReviewedLate = await _context.LateArrivals.CountAsync(l => l.Status == "Reviewed"),
                PendingApprovals = await _context.Employees.CountAsync(e => !e.IsApproved && e.RequestedRole != null),
                LeavesThisMonth = await _context.LeaveRequests
                    .CountAsync(l => l.AppliedOn.Month == DateTime.Now.Month),
                LateThisMonth = await _context.LateArrivals
                    .CountAsync(l => l.ReportedOn.Month == DateTime.Now.Month)
            };

            return Ok(stats);
        }

        // POST: api/Admin/approve-user/5
        [HttpPost("approve-user/{userId}")]
        public async Task<IActionResult> ApproveUser(int userId)
        {
            var user = await _context.Employees.FindAsync(userId);
            if (user == null) return NotFound();

            user.IsApproved = true;
            user.ApprovedOn = DateTime.Now;
            user.Role = user.RequestedRole; // Set to requested role
            user.RequestedRole = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = "User approved successfully" });
        }

        // POST: api/Admin/reject-user/{userId}
        [HttpPost("reject-user/{userId}")]
        public async Task<IActionResult> RejectUser(int userId)
        {
            var user = await _context.Employees.FindAsync(userId);
            if (user == null) return NotFound();

            _context.Employees.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User rejected" });
        }

        // PUT: api/Admin/update-role/5
        [HttpPut("update-role/{employeeId}")]
        public async Task<IActionResult> UpdateEmployeeRole(int employeeId, [FromBody] string newRole)
        {
            var employee = await _context.Employees.FindAsync(employeeId);
            if (employee == null) return NotFound();

            employee.Role = newRole;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Employee role updated to {newRole}" });
        }

        // PUT: api/Admin/approve-leave/5
        [HttpPut("approve-leave/{leaveId}")]
        public async Task<IActionResult> AdminApproveLeave(int leaveId)
        {
            var leave = await _context.LeaveRequests.FindAsync(leaveId);
            if (leave == null) return NotFound();

            leave.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Leave request approved" });
        }

        // PUT: api/Admin/reject-leave/5
        [HttpPut("reject-leave/{leaveId}")]
        public async Task<IActionResult> AdminRejectLeave(int leaveId)
        {
            var leave = await _context.LeaveRequests.FindAsync(leaveId);
            if (leave == null) return NotFound();

            leave.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Leave request rejected" });
        }

        // PUT: api/Admin/review-late/5
        [HttpPut("review-late/{lateId}")]
        public async Task<IActionResult> AdminReviewLate(int lateId)
        {
            var late = await _context.LateArrivals.FindAsync(lateId);
            if (late == null) return NotFound();

            late.Status = "Reviewed";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Late arrival reviewed" });
        }
    }
}