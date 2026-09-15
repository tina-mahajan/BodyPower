using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BodyPowerGym.Api.Data;
using BodyPowerGym.Api.DTOs;
using BodyPowerGym.Api.Models;
using BodyPowerGym.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodyPowerGym.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class UsersController : ControllerBase
    {
        private readonly BodyPowerGymDbContext _db;
        private readonly IAuthService _authService;

        public UsersController(BodyPowerGymDbContext db, IAuthService authService)
        {
            _db = db;
            _authService = authService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var users = await _db.Users
                .OrderBy(u => u.RoleId)
                .ThenBy(u => u.FullName)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    RoleId = u.RoleId,
                    FullName = u.FullName,
                    Email = u.Email,
                    Mobile = u.Mobile,
                    AvatarUrl = u.AvatarUrl,
                    IsActive = u.IsActive
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var emailExists = await _db.Users.AnyAsync(u => u.NormalizedEmail == request.Email.Trim().ToUpperInvariant());
            if (emailExists)
                return Conflict(new { message = "Email is already in use." });

            var mobileExists = await _db.Users.AnyAsync(u => u.Mobile == request.Mobile.Trim());
            if (mobileExists)
                return Conflict(new { message = "Mobile number is already in use." });

            try
            {
                var created = await _authService.CreateUserAsync(request);
                return Ok(created);
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(string id, [FromBody] UpdateUserRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var emailExists = await _db.Users.AnyAsync(u => u.NormalizedEmail == request.Email.Trim().ToUpperInvariant() && u.Id != id);
            if (emailExists)
                return Conflict(new { message = "Email is already in use by another user." });

            var updated = await _authService.UpdateUserAsync(id, request);
            if (updated == null)
                return NotFound(new { message = "User not found." });

            return Ok(updated);
        }

        [HttpPost("{id}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(string id)
        {
            var ok = await _authService.ToggleUserStatusAsync(id);
            if (!ok)
                return BadRequest(new { message = "Cannot deactivate Admin accounts or user was not found." });

            return Ok(new { success = true });
        }
    }
}
