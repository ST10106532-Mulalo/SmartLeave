using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLeaveAPI.Data;
using SmartLeaveAPI.Models;

namespace SmartLeaveAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentController : ControllerBase
    {
        private readonly SmartLeaveDbContext _context;

        public DepartmentController(SmartLeaveDbContext context)
        {
            _context = context;
        }

        // GET: api/Department
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDepartments()
        {
            var departments = await _context.Departments
                .Include(d => d.Employees)
                .Select(d => new
                {
                    d.DepartmentID,
                    d.Name,
                    EmployeeCount = d.Employees != null ? d.Employees.Count : 0,
                    Managers = d.Employees != null
                        ? d.Employees.Where(e => e.Role == "Manager").Select(e => new { e.EmployeeID, e.Name, e.Email })
                        : null,
                    Supervisors = d.Employees != null
                        ? d.Employees.Where(e => e.Role == "Supervisor").Select(e => new { e.EmployeeID, e.Name, e.Email })
                        : null,
                    Employees = d.Employees != null
                        ? d.Employees.Select(e => new
                        {
                            e.EmployeeID,
                            e.Name,
                            e.Email,
                            e.Role,
                            ReportsToID = e.ReportsToID // Add this
                        })
                        : null
                })
                .ToListAsync();

            return Ok(departments);
        }

        // GET: api/Department/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetDepartment(int id)
        {
            var department = await _context.Departments
                .Include(d => d.Employees)
                .Where(d => d.DepartmentID == id)
                .Select(d => new
                {
                    d.DepartmentID,
                    d.Name,
                    Employees = d.Employees != null
                        ? d.Employees.Select(e => new
                        {
                            e.EmployeeID,
                            e.Name,
                            e.Email,
                            e.Role,
                            ReportsToID = e.ReportsToID // Add this
                        })
                        : null
                })
                .FirstOrDefaultAsync();

            if (department == null) return NotFound();
            return Ok(department);
        }

        // POST: api/Department
        [HttpPost]
        public async Task<ActionResult<Department>> CreateDepartment([FromBody] string departmentName)
        {
            if (string.IsNullOrWhiteSpace(departmentName))
                return BadRequest("Department name is required");

            var existing = await _context.Departments
                .AnyAsync(d => d.Name == departmentName);

            if (existing)
                return BadRequest("Department already exists");

            var department = new Department
            {
                Name = departmentName
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDepartment), new { id = department.DepartmentID }, department);
        }

        // PUT: api/Department/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDepartment(int id, [FromBody] string departmentName)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null) return NotFound();

            department.Name = departmentName;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Department updated successfully" });
        }

        // DELETE: api/Department/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var department = await _context.Departments
                .Include(d => d.Employees)
                .FirstOrDefaultAsync(d => d.DepartmentID == id);

            if (department == null) return NotFound();

            if (department.Employees != null && department.Employees.Any())
                return BadRequest("Cannot delete department with employees. Reassign employees first.");

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Department deleted successfully" });
        }

        // POST: api/Department/5/assign-manager
        [HttpPost("{departmentId}/assign-manager")]
        public async Task<IActionResult> AssignManager(int departmentId, [FromBody] int managerId)
        {
            var department = await _context.Departments.FindAsync(departmentId);
            if (department == null) return NotFound();

            var manager = await _context.Employees.FindAsync(managerId);
            if (manager == null) return NotFound();

            // Update employee's role and department
            manager.Role = "Manager";
            manager.DepartmentID = departmentId;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Manager assigned to {department.Name} department" });
        }

        // POST: api/Department/5/assign-supervisor
        [HttpPost("{departmentId}/assign-supervisor")]
        public async Task<IActionResult> AssignSupervisor(int departmentId, [FromBody] int supervisorId)
        {
            var department = await _context.Departments.FindAsync(departmentId);
            if (department == null) return NotFound();

            var supervisor = await _context.Employees.FindAsync(supervisorId);
            if (supervisor == null) return NotFound();

            // Update employee's role and department
            supervisor.Role = "Supervisor";
            supervisor.DepartmentID = departmentId;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Supervisor assigned to {department.Name} department" });
        }
    }
}