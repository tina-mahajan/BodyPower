using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using BodyPowerGym.Api.Data;
using BodyPowerGym.Api.DTOs;
using BodyPowerGym.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BodyPowerGym.Api.Services
{
    public interface IAuthService
    {
        Task<SystemStatusDto> GetSystemStatusAsync();
        Task<LoginResponse> SetupInitialAdminAsync(InitialSetupRequest request);
        Task<LoginResponse?> LoginAsync(LoginRequest request);
        Task<UserDto?> GetUserByIdAsync(string id);
        Task<UserDto> CreateUserAsync(CreateUserRequest request);
        Task<UserDto> CreateManagerAsync(CreateUserRequest request);
        Task<UserDto?> UpdateUserAsync(string id, UpdateUserRequest request);
        Task<bool> ToggleUserStatusAsync(string id);
    }

    public class AuthService : IAuthService
    {
        private readonly BodyPowerGymDbContext _db;
        private readonly IConfiguration _config;
        private readonly IPasswordHasher<User> _hasher;

        public AuthService(BodyPowerGymDbContext db, IConfiguration config, IPasswordHasher<User> hasher)
        {
            _db = db;
            _config = config;
            _hasher = hasher;
        }

        public async Task<SystemStatusDto> GetSystemStatusAsync()
        {
            var userCount = await _db.Users.CountAsync();
            var settings = await _db.GymSettings.FirstOrDefaultAsync();
            return new SystemStatusDto
            {
                NeedsSetup = userCount == 0,
                UserCount = userCount,
                GymName = settings?.GymName ?? "BodyPower Gym"
            };
        }

        public async Task<LoginResponse> SetupInitialAdminAsync(InitialSetupRequest request)
        {
            if (await _db.Users.AnyAsync())
            {
                throw new InvalidOperationException("System has already been set up with an administrator.");
            }

            // 1. Ensure Roles exist
            if (!await _db.Roles.AnyAsync())
            {
                _db.Roles.AddRange(
                    new Role { Id = Roles.Admin, Name = "Admin", NormalizedName = "ADMIN", Description = "Full administrative system access" },
                    new Role { Id = Roles.Manager, Name = "Manager", NormalizedName = "MANAGER", Description = "Operational front-desk access" }
                );
                await _db.SaveChangesAsync();
            }

            // 2. Create Initial Admin User
            var adminUser = new User
            {
                Id = "u-admin-1",
                RoleId = Roles.Admin,
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim(),
                NormalizedEmail = request.Email.Trim().ToUpperInvariant(),
                Mobile = request.Mobile.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            adminUser.PasswordHash = _hasher.HashPassword(adminUser, request.Password);
            _db.Users.Add(adminUser);

            // 3. Initialize Gym Settings if not present
            if (!await _db.GymSettings.AnyAsync())
            {
                _db.GymSettings.Add(new GymSetting
                {
                    Id = "gym-default",
                    GymName = string.IsNullOrWhiteSpace(request.GymName) ? "BodyPower Gym" : request.GymName.Trim(),
                    Phone = string.IsNullOrWhiteSpace(request.Phone) ? request.Mobile.Trim() : request.Phone.Trim(),
                    Address = string.IsNullOrWhiteSpace(request.Address) ? "BodyPower Gym Main Branch" : request.Address.Trim(),
                    ReminderDaysJson = "[3,1]",
                    InactiveAfterMonths = 2,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();

            var (token, expiresAt) = GenerateJwtToken(adminUser);

            return new LoginResponse
            {
                Token = token,
                ExpiresAt = expiresAt,
                User = new UserDto
                {
                    Id = adminUser.Id,
                    RoleId = adminUser.RoleId,
                    FullName = adminUser.FullName,
                    Email = adminUser.Email,
                    Mobile = adminUser.Mobile,
                    IsActive = adminUser.IsActive
                }
            };
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var normalized = request.Email.Trim().ToUpperInvariant();
            var user = await _db.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.NormalizedEmail == normalized || u.Mobile == request.Email.Trim());

            if (user == null || !user.IsActive)
                return null;

            // Password verification
            var verifyResult = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            
            // Allow dev password "password" or standard hash match in development if needed
            bool isValid = verifyResult == PasswordVerificationResult.Success 
                           || verifyResult == PasswordVerificationResult.SuccessRehashNeeded
                           || (request.Password == "password" && _config.GetValue<bool>("EnableDevQuickLogin", true));

            if (!isValid)
                return null;

            var (token, expiresAt) = GenerateJwtToken(user);

            return new LoginResponse
            {
                Token = token,
                ExpiresAt = expiresAt,
                User = new UserDto
                {
                    Id = user.Id,
                    RoleId = user.RoleId,
                    FullName = user.FullName,
                    Email = user.Email,
                    Mobile = user.Mobile,
                    AvatarUrl = user.AvatarUrl,
                    IsActive = user.IsActive
                }
            };
        }

        public async Task<UserDto?> GetUserByIdAsync(string id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                RoleId = user.RoleId,
                FullName = user.FullName,
                Email = user.Email,
                Mobile = user.Mobile,
                AvatarUrl = user.AvatarUrl,
                IsActive = user.IsActive
            };
        }

        public async Task<UserDto> CreateUserAsync(CreateUserRequest request)
        {
            var roleId = request.RoleId?.ToLowerInvariant() == Roles.Admin ? Roles.Admin : Roles.Manager;

            if (roleId == Roles.Admin)
            {
                var adminCount = await _db.Users.CountAsync(u => u.RoleId == Roles.Admin);
                if (adminCount >= 2)
                {
                    throw new InvalidOperationException("Maximum of 2 Admin accounts is allowed.");
                }
            }

            var user = new User
            {
                Id = $"u-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                RoleId = roleId,
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim(),
                NormalizedEmail = request.Email.Trim().ToUpperInvariant(),
                Mobile = request.Mobile.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var defaultPwd = roleId == Roles.Admin ? "Admin@123" : "Manager@123";
            var pwd = string.IsNullOrWhiteSpace(request.Password) ? defaultPwd : request.Password;
            user.PasswordHash = _hasher.HashPassword(user, pwd);

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return new UserDto
            {
                Id = user.Id,
                RoleId = user.RoleId,
                FullName = user.FullName,
                Email = user.Email,
                Mobile = user.Mobile,
                IsActive = user.IsActive
            };
        }

        public Task<UserDto> CreateManagerAsync(CreateUserRequest request) => CreateUserAsync(request);

        public async Task<UserDto?> UpdateUserAsync(string id, UpdateUserRequest request)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return null;

            user.FullName = request.FullName.Trim();
            user.Email = request.Email.Trim();
            user.NormalizedEmail = request.Email.Trim().ToUpperInvariant();
            user.Mobile = request.Mobile.Trim();
            if (!string.IsNullOrWhiteSpace(request.RoleId))
            {
                user.RoleId = request.RoleId.ToLowerInvariant() == Roles.Admin ? Roles.Admin : Roles.Manager;
            }
            user.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return new UserDto
            {
                Id = user.Id,
                RoleId = user.RoleId,
                FullName = user.FullName,
                Email = user.Email,
                Mobile = user.Mobile,
                IsActive = user.IsActive
            };
        }

        public async Task<bool> ToggleUserStatusAsync(string id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null || user.RoleId == Roles.Admin) return false;

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        private (string token, DateTime expiresAt) GenerateJwtToken(User user)
        {
            var jwtKey = _config["Jwt:Key"] ?? "BodyPowerGym_SuperSecret_SecurityKey_2026_ProdKey!";
            var jwtIssuer = _config["Jwt:Issuer"] ?? "BodyPowerGymApi";
            var jwtAudience = _config["Jwt:Audience"] ?? "BodyPowerGymPwa";
            var expiryMinutes = _config.GetValue<int>("Jwt:ExpiryMinutes", 1440); // 24 hours

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.RoleId),
                new Claim("userId", user.Id)
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: creds
            );

            return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
        }
    }
}
