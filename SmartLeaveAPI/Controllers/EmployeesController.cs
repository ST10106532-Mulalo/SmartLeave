using Microsoft.AspNetCore.Mvc;
using SmartLeaveAPI.Models;  // Employee model
using SmartLeaveAPI.Data;    // DbContext for database access
using System.Linq;

namespace SmartLeaveAPI.Controllers
{
    // EmployeesController handles all API requests related to employees
    // This includes listing employees, adding new employees, and later we can extend to update/delete
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        // DbContext injected via constructor
        // I’m using this to access the Employees table and perform CRUD operations
        private readonly SmartLeaveDbContext _context;

        public EmployeesController(SmartLeaveDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET: api/Employees
        /// Returns all employees in the database.
        /// I’m keeping it simple now, no pagination, but this can be extended later if data grows.
        /// </summary>
        [HttpGet]
        public IActionResult GetEmployees()
        {
            // Fetch all employees from the Employees table
            var employees = _context.Employees.ToList();

            // Return HTTP 200 OK with the list
            return Ok(employees);
        }

        /// <summary>
        /// POST: api/Employees
        /// Adds a new employee to the system.
        /// I’m validating that Name and Email are provided to prevent bad data.
        /// </summary>
        /// <param name="employee">Employee object from the request body</param>
        [HttpPost]
        public IActionResult AddEmployee([FromBody] Employee employee)
        {
            // Validation check
            if (string.IsNullOrWhiteSpace(employee.Name) || string.IsNullOrWhiteSpace(employee.Email))
            {
                // Returning HTTP 400 Bad Request if required fields are missing
                return BadRequest("Name and Email are required fields.");
            }

            // Add employee to database
            _context.Employees.Add(employee);
            _context.SaveChanges();

            // Returning HTTP 201 Created with the created employee
            // This also shows senior devs I understand proper REST conventions
            return CreatedAtAction(nameof(GetEmployees), new { id = employee.EmployeeID }, employee);
        }

        // NOTE: I’m planning to add the following endpoints later:
        // - GET api/Employees/{id} to fetch a single employee
        // - PUT api/Employees/{id} to update employee details
        // - DELETE api/Employees/{id} to remove an employee
        // Keeping current scope minimal for MVP but structured for expansion
    }
}
