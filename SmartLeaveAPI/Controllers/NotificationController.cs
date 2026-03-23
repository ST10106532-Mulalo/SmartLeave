using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLeaveAPI.Data;
using SmartLeaveAPI.Models;

namespace SmartLeaveAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationController : ControllerBase
    {
        private readonly SmartLeaveDbContext _context;

        public NotificationController(SmartLeaveDbContext context)
        {
            _context = context;
        }

        // GET: api/Notification/user/5
        [HttpGet("user/{employeeId}")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUserNotifications(int employeeId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.EmployeeID == employeeId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(100) // Limit to latest 100
                .ToListAsync();

            return Ok(notifications);
        }

        // GET: api/Notification/user/5/unread-count
        [HttpGet("user/{employeeId}/unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount(int employeeId)
        {
            var count = await _context.Notifications
                .Where(n => n.EmployeeID == employeeId && !n.IsRead)
                .CountAsync();

            return Ok(count);
        }

        // PUT: api/Notification/5/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound();

            notification.IsRead = true;
            notification.ReadAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notification marked as read" });
        }

        // PUT: api/Notification/user/5/read-all
        [HttpPut("user/{employeeId}/read-all")]
        public async Task<IActionResult> MarkAllAsRead(int employeeId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.EmployeeID == employeeId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "All notifications marked as read" });
        }

        // DELETE: api/Notification/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound();

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notification deleted" });
        }

        // DELETE: api/Notification/user/5/all
        [HttpDelete("user/{employeeId}/all")]
        public async Task<IActionResult> DeleteAllNotifications(int employeeId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.EmployeeID == employeeId)
                .ToListAsync();

            _context.Notifications.RemoveRange(notifications);
            await _context.SaveChangesAsync();

            return Ok(new { message = "All notifications deleted" });
        }

        // POST: api/Notification/create-test
        [HttpPost("create-test")]
        public async Task<IActionResult> CreateTestNotification([FromBody] TestNotificationDto dto)
        {
            var notification = new Notification
            {
                EmployeeID = dto.EmployeeID,
                Type = dto.Type,
                Title = dto.Title,
                Message = dto.Message,
                ReferenceID = dto.ReferenceID,
                ReferenceType = dto.ReferenceType,
                CreatedAt = DateTime.Now
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(notification);
        }
    }

    public class TestNotificationDto
    {
        public int EmployeeID { get; set; }
        public string Type { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public int? ReferenceID { get; set; }
        public string? ReferenceType { get; set; }
    }
}