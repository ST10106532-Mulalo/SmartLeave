using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLeaveAPI.Data;
using SmartLeaveAPI.Models;

namespace SmartLeaveAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ManagerController : ControllerBase
    {
        private readonly SmartLeaveDbContext _context;

        public ManagerController(SmartLeaveDbContext context)
        {
            _context = context;
        }

        // GET: api/Manager/team/5
        [HttpGet("team/{managerId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetTeamMembers(int managerId)
        {
            var manager = await _context.Employees.FindAsync(managerId);
            if (manager == null) return NotFound();

            var team = await _context.Employees
                .Where(e => e.Department == manager.Department && e.EmployeeID != managerId)
                .Select(e => new
                {
                    e.EmployeeID,
                    e.Name,
                    e.Email,
                    e.Department,
                    e.Role,
                    e.Gender,
                    e.HireDate,
                    LeaveCount = _context.LeaveRequests.Count(l => l.EmployeeID == e.EmployeeID),
                    LateCount = _context.LateArrivals.Count(l => l.EmployeeID == e.EmployeeID),
                    PendingLeaveCount = _context.LeaveRequests.Count(l => l.EmployeeID == e.EmployeeID && l.Status == "Pending"),
                    PendingLateCount = _context.LateArrivals.Count(l => l.EmployeeID == e.EmployeeID && l.Status == "Pending")
                })
                .ToListAsync();

            return Ok(team);
        }

        // GET: api/Manager/pending-leaves/5
        [HttpGet("pending-leaves/{managerId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetPendingLeaves(int managerId)
        {
            var manager = await _context.Employees.FindAsync(managerId);
            if (manager == null) return NotFound();

            var pendingLeaves = await _context.LeaveRequests
                .Include(l => l.Employee)
                .Where(l => l.Employee.Department == manager.Department && l.Status == "Pending")
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
                    EmployeeEmail = l.Employee.Email
                })
                .ToListAsync();

            return Ok(pendingLeaves);
        }

        // GET: api/Manager/pending-late/5
        [HttpGet("pending-late/{managerId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetPendingLateArrivals(int managerId)
        {
            var manager = await _context.Employees.FindAsync(managerId);
            if (manager == null) return NotFound();

            var pendingLate = await _context.LateArrivals
                .Include(l => l.Employee)
                .Where(l => l.Employee.Department == manager.Department && l.Status == "Pending")
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
                    EmployeeEmail = l.Employee.Email
                })
                .ToListAsync();

            return Ok(pendingLate);
        }

        // GET: api/Manager/employee-leaves/5
        [HttpGet("employee-leaves/{employeeId}")]
        public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetEmployeeLeaveHistory(int employeeId)
        {
            var leaves = await _context.LeaveRequests
                .Where(l => l.EmployeeID == employeeId)
                .OrderByDescending(l => l.AppliedOn)
                .ToListAsync();

            return Ok(leaves);
        }

        // GET: api/Manager/employee-late/5
        [HttpGet("employee-late/{employeeId}")]
        public async Task<ActionResult<IEnumerable<LateArrival>>> GetEmployeeLateHistory(int employeeId)
        {
            var late = await _context.LateArrivals
                .Where(l => l.EmployeeID == employeeId)
                .OrderByDescending(l => l.ReportedOn)
                .ToListAsync();

            return Ok(late);
        }

        // PUT: api/Manager/approve-leave/5
        [HttpPut("approve-leave/{leaveId}")]
        public async Task<IActionResult> ApproveLeave(int leaveId)
        {
            var leave = await _context.LeaveRequests.FindAsync(leaveId);
            if (leave == null) return NotFound();

            leave.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Leave request approved successfully" });
        }

        // PUT: api/Manager/reject-leave/5
        [HttpPut("reject-leave/{leaveId}")]
        public async Task<IActionResult> RejectLeave(int leaveId, [FromBody] string? reason)
        {
            var leave = await _context.LeaveRequests.FindAsync(leaveId);
            if (leave == null) return NotFound();

            leave.Status = "Rejected";
            // You might want to add a rejection reason field to your model
            await _context.SaveChangesAsync();

            return Ok(new { message = "Leave request rejected" });
        }

        // PUT: api/Manager/review-late/5
        [HttpPut("review-late/{lateId}")]
        public async Task<IActionResult> ReviewLateArrival(int lateId)
        {
            var late = await _context.LateArrivals.FindAsync(lateId);
            if (late == null) return NotFound();

            late.Status = "Reviewed";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Late arrival marked as reviewed" });
        }

        // GET: api/Manager/department-stats/5
        [HttpGet("department-stats/{managerId}")]
        public async Task<ActionResult<object>> GetDepartmentStats(int managerId)
        {
            var manager = await _context.Employees.FindAsync(managerId);
            if (manager == null) return NotFound();

            var stats = new
            {
                TotalEmployees = await _context.Employees.CountAsync(e => e.Department == manager.Department),
                PendingLeaves = await _context.LeaveRequests
                    .CountAsync(l => l.Employee.Department == manager.Department && l.Status == "Pending"),
                PendingLate = await _context.LateArrivals
                    .CountAsync(l => l.Employee.Department == manager.Department && l.Status == "Pending"),
                ApprovedThisMonth = await _context.LeaveRequests
                    .CountAsync(l => l.Employee.Department == manager.Department
                        && l.Status == "Approved"
                        && l.AppliedOn.Month == DateTime.Now.Month),
                EmployeesOnLeave = await _context.LeaveRequests
                    .CountAsync(l => l.Employee.Department == manager.Department
                        && l.Status == "Approved"
                        && l.StartDate <= DateTime.Today
                        && l.EndDate >= DateTime.Today)
            };

            return Ok(stats);
        }
    }
}