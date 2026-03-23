using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLeaveAPI.Data;
using SmartLeaveAPI.Models;
using System.IO;

namespace SmartLeaveAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LateArrivalsController : ControllerBase
    {
        private readonly SmartLeaveDbContext _context;

        public LateArrivalsController(SmartLeaveDbContext context)
        {
            _context = context;
        }

        // GET: api/LateArrivals
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LateArrival>>> GetLateArrivals()
        {
            return await _context.LateArrivals
                .Include(l => l.Employee)
                .ToListAsync();
        }

        // GET: api/LateArrivals/employee/5
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<LateArrival>>> GetLateArrivalsByEmployee(int employeeId)
        {
            var lateArrivals = await _context.LateArrivals
                .Where(l => l.EmployeeID == employeeId)
                .OrderByDescending(l => l.ReportedOn)
                .ToListAsync();

            return Ok(lateArrivals);
        }

        // POST: api/LateArrivals
        [HttpPost]
        public async Task<ActionResult<LateArrival>> NotifyLate([FromForm] LateArrival lateArrival, IFormFile? photo)
        {
            lateArrival.Date = DateTime.Today;
            lateArrival.Status = "Pending";
            lateArrival.ReportedOn = DateTime.Now;

            // Handle photo upload if provided
            if (photo != null && photo.Length > 0)
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "late-arrivals");
                Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = Guid.NewGuid().ToString() + "_" + photo.FileName;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await photo.CopyToAsync(stream);
                }

                lateArrival.PhotoName = photo.FileName;
                lateArrival.PhotoPath = $"/uploads/late-arrivals/{uniqueFileName}";
            }

            _context.LateArrivals.Add(lateArrival);
            await _context.SaveChangesAsync();

            // ============================================
            // 🔔 Create notifications for managers and admins
            // ============================================

            // Get the employee who reported late
            await _context.Entry(lateArrival).Reference(l => l.Employee).LoadAsync();

            // Find all managers and admins in the same department
            var managerIds = await _context.Employees
                .Where(e => e.DepartmentID == lateArrival.Employee.DepartmentID
                    && (e.Role == "Manager" || e.Role == "Admin"))
                .Select(e => e.EmployeeID)
                .ToListAsync();

            // Create notification for each manager/admin
            foreach (var managerId in managerIds)
            {
                var notification = new Notification
                {
                    EmployeeID = managerId,
                    Type = "NewLate",
                    Title = "New Late Arrival",
                    Message = $"{lateArrival.Employee.Name} reported being late. Expected arrival: {lateArrival.ExpectedArrival}. Reason: {lateArrival.Reason}",
                    ReferenceID = lateArrival.LateID,
                    ReferenceType = "Late",
                    CreatedAt = DateTime.Now
                };
                _context.Notifications.Add(notification);
            }

            await _context.SaveChangesAsync();

            return Ok(lateArrival);
        }

        // PUT: api/LateArrivals/5/review
        [HttpPut("{id}/review")]
        public async Task<IActionResult> ReviewLateArrival(int id)
        {
            var late = await _context.LateArrivals
                .Include(l => l.Employee)
                .FirstOrDefaultAsync(l => l.LateID == id);

            if (late == null) return NotFound();

            late.Status = "Reviewed";
            await _context.SaveChangesAsync();

            // ============================================
            // 🔔 Create notification for the employee
            // ============================================

            var notification = new Notification
            {
                EmployeeID = late.EmployeeID,
                Type = "LateReviewed",
                Title = "Late Arrival Reviewed",
                Message = $"Your late arrival report for {late.Date:MMM dd} has been reviewed",
                ReferenceID = late.LateID,
                ReferenceType = "Late",
                CreatedAt = DateTime.Now
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Late arrival marked as reviewed" });
        }

        // PUT: api/LateArrivals/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLateStatus(int id, UpdateLateStatusDto dto)
        {
            var late = await _context.LateArrivals.FindAsync(id);
            if (late == null) return NotFound();

            late.Status = dto.Status;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}