using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLeaveAPI.Data;
using SmartLeaveAPI.Models;
using System.IO;

namespace SmartLeaveAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaveRequestsController : ControllerBase
    {
        private readonly SmartLeaveDbContext _context;

        public LeaveRequestsController(SmartLeaveDbContext context)
        {
            _context = context;
        }

        // GET: api/LeaveRequests
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetLeaveRequests()
        {
            return await _context.LeaveRequests
                                 .Include(lr => lr.Employee)
                                 .Include(lr => lr.LeaveType)  // Add this include
                                 .ToListAsync();
        }

        // GET: api/LeaveRequests/employee/5
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetLeaveRequestsByEmployee(int employeeId)
        {
            var leaves = await _context.LeaveRequests
                .Where(l => l.EmployeeID == employeeId)
                .Include(l => l.LeaveType)  // Add this include
                .OrderByDescending(l => l.AppliedOn)
                .ToListAsync();

            return Ok(leaves);
        }

        // GET: api/LeaveRequests/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LeaveRequest>> GetLeaveRequest(int id)
        {
            var leaveRequest = await _context.LeaveRequests
                .Include(l => l.LeaveType)  // Add this include
                .FirstOrDefaultAsync(l => l.LeaveID == id);

            if (leaveRequest == null) return NotFound();
            return leaveRequest;
        }

        // POST: api/LeaveRequests/test-json (for testing in Scalar)
        [HttpPost("test-json")]
        public async Task<ActionResult<LeaveRequest>> PostLeaveRequestJson([FromBody] TestLeaveRequestDto dto)
        {
            // Check if user already has a pending request of the same type
            var existingPending = await _context.LeaveRequests
                .AnyAsync(l => l.EmployeeID == dto.EmployeeID
                    && l.LeaveTypeID == dto.LeaveTypeID  // Changed from LeaveType to LeaveTypeID
                    && l.Status == "Pending");

            if (existingPending)
            {
                return BadRequest(new
                {
                    message = $"You already have a pending leave request of this type."
                });
            }

            var newLeaveRequest = new LeaveRequest
            {
                EmployeeID = dto.EmployeeID,
                LeaveTypeID = dto.LeaveTypeID,  // Changed from LeaveType to LeaveTypeID
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Reason = dto.Reason,
                Status = "Pending",
                AppliedOn = DateTime.Now
            };

            _context.LeaveRequests.Add(newLeaveRequest);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLeaveRequest), new { id = newLeaveRequest.LeaveID }, newLeaveRequest);
        }

        // POST: api/LeaveRequests (with file upload - for frontend)
        [HttpPost]
        public async Task<ActionResult<LeaveRequest>> PostLeaveRequest([FromForm] LeaveRequest leaveRequest, IFormFile? document)
        {
            // Check if user already has a pending request of the same type
            var existingPending = await _context.LeaveRequests
                .AnyAsync(l => l.EmployeeID == leaveRequest.EmployeeID
                    && l.LeaveTypeID == leaveRequest.LeaveTypeID  // Changed from LeaveType to LeaveTypeID
                    && l.Status == "Pending");

            if (existingPending)
            {
                return BadRequest(new
                {
                    message = $"You already have a pending leave request of this type. Please wait for approval or rejection before submitting another."
                });
            }

            // Handle document upload if provided
            if (document != null && document.Length > 0)
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = Guid.NewGuid().ToString() + "_" + document.FileName;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await document.CopyToAsync(stream);
                }

                leaveRequest.SupportingDocumentName = document.FileName;
                leaveRequest.SupportingDocumentPath = $"/uploads/{uniqueFileName}";
            }

            var newLeaveRequest = new LeaveRequest
            {
                EmployeeID = leaveRequest.EmployeeID,
                LeaveTypeID = leaveRequest.LeaveTypeID,  // Changed from LeaveType to LeaveTypeID
                StartDate = leaveRequest.StartDate,
                EndDate = leaveRequest.EndDate,
                Reason = leaveRequest.Reason,
                Status = "Pending",
                AppliedOn = DateTime.Now,
                SupportingDocumentName = leaveRequest.SupportingDocumentName,
                SupportingDocumentPath = leaveRequest.SupportingDocumentPath
            };

            _context.LeaveRequests.Add(newLeaveRequest);
            await _context.SaveChangesAsync();

            // Get the employee who submitted the request
            var employee = await _context.Employees.FindAsync(leaveRequest.EmployeeID);

            // Find all managers and admins in the same department
            if (employee != null && employee.DepartmentID != null)
            {
                var managerIds = await _context.Employees
                    .Where(e => e.DepartmentID == employee.DepartmentID
                        && (e.Role == "Manager" || e.Role == "Admin"))
                    .Select(e => e.EmployeeID)
                    .ToListAsync();

                // Get the leave type name for the notification
                var leaveType = await _context.LeaveTypes.FindAsync(newLeaveRequest.LeaveTypeID);

                // Create notification for each manager/admin
                foreach (var managerId in managerIds)
                {
                    var notification = new Notification
                    {
                        EmployeeID = managerId,
                        Type = "NewLeave",
                        Title = "New Leave Request",
                        Message = $"{employee.Name} submitted a {leaveType?.Name ?? "leave"} request from {newLeaveRequest.StartDate:MMM dd} to {newLeaveRequest.EndDate:MMM dd}",
                        ReferenceID = newLeaveRequest.LeaveID,
                        ReferenceType = "Leave",
                        CreatedAt = DateTime.Now
                    };
                    _context.Notifications.Add(notification);
                }

                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetLeaveRequest), new { id = newLeaveRequest.LeaveID }, newLeaveRequest);
        }

        // PUT: api/LeaveRequests/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLeaveRequestStatus(int id, [FromBody] string status)
        {
            var leaveRequest = await _context.LeaveRequests
                .Include(l => l.Employee)
                .Include(l => l.LeaveType)  // Add this include
                .FirstOrDefaultAsync(l => l.LeaveID == id);

            if (leaveRequest == null) return NotFound();

            var oldStatus = leaveRequest.Status;
            leaveRequest.Status = status;
            await _context.SaveChangesAsync();

            // Create notification for the employee
            if (oldStatus != status && (status == "Approved" || status == "Rejected") && leaveRequest.Employee != null)
            {
                var notification = new Notification
                {
                    EmployeeID = leaveRequest.EmployeeID,
                    Type = status == "Approved" ? "LeaveApproved" : "LeaveRejected",
                    Title = $"Leave Request {status}",
                    Message = $"Your {leaveRequest.LeaveType?.Name ?? "leave"} request ({leaveRequest.StartDate:MMM dd} to {leaveRequest.EndDate:MMM dd}) has been {status}",
                    ReferenceID = leaveRequest.LeaveID,
                    ReferenceType = "Leave",
                    CreatedAt = DateTime.Now
                };
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }
    }

    // Updated DTO for testing
    public class TestLeaveRequestDto
    {
        public int EmployeeID { get; set; }
        public int LeaveTypeID { get; set; }  // Changed from string to int
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; }
    }
}