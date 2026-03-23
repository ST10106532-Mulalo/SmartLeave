using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLeaveAPI.Data;
using SmartLeaveAPI.Models;

namespace SmartLeaveAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly SmartLeaveDbContext _context;

        public SettingsController(SmartLeaveDbContext context)
        {
            _context = context;
        }

        // GET: api/Settings/user/5
        [HttpGet("user/{employeeId}")]
        public async Task<ActionResult<UserSetting>> GetUserSettings(int employeeId)
        {
            var settings = await _context.UserSettings
                .FirstOrDefaultAsync(s => s.EmployeeID == employeeId);

            if (settings == null)
            {
                // Create default settings if none exist
                settings = new UserSetting
                {
                    EmployeeID = employeeId,
                    MasterSound = true,
                    Volume = 80,
                    Vibration = true,
                    NotificationDuration = 60,
                    Theme = "Light",
                    DateFormat = "MM/DD/YYYY",
                    DailyDigest = false,
                    DigestTime = new TimeSpan(8, 0, 0)
                };

                _context.UserSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return Ok(settings);
        }

        // PUT: api/Settings/5
        [HttpPut("{employeeId}")]
        public async Task<IActionResult> UpdateUserSettings(int employeeId, UserSetting settings)
        {
            if (employeeId != settings.EmployeeID)
            {
                return BadRequest();
            }

            var existingSettings = await _context.UserSettings
                .FirstOrDefaultAsync(s => s.EmployeeID == employeeId);

            if (existingSettings == null)
            {
                return NotFound();
            }

            existingSettings.MasterSound = settings.MasterSound;
            existingSettings.Volume = settings.Volume;
            existingSettings.Vibration = settings.Vibration;
            existingSettings.NotificationDuration = settings.NotificationDuration;
            existingSettings.Theme = settings.Theme;
            existingSettings.DateFormat = settings.DateFormat;
            existingSettings.DailyDigest = settings.DailyDigest;
            existingSettings.DigestTime = settings.DigestTime;

            await _context.SaveChangesAsync();

            return Ok(existingSettings);
        }

        // POST: api/Settings
        [HttpPost]
        public async Task<ActionResult<UserSetting>> CreateSettings(UserSetting settings)
        {
            _context.UserSettings.Add(settings);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUserSettings), new { employeeId = settings.EmployeeID }, settings);
        }
    }
}