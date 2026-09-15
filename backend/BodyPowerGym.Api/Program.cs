using System;
using System.IO;
using System.Text;
using BodyPowerGym.Api.Data;
using BodyPowerGym.Api.Models;
using BodyPowerGym.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=ASUS-VIVOBOOK\\TINASQLSERVER;Database=BodyPowerGymDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

var isPostgres = connectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase) 
              || connectionString.Contains("Server=db.", StringComparison.OrdinalIgnoreCase)
              || connectionString.Contains("Username=", StringComparison.OrdinalIgnoreCase)
              || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
              || connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<BodyPowerGymDbContext>(options =>
{
    if (isPostgres)
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// 2. Identity Password Hasher
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// 3. Application Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPhotoStorageService, CloudinaryPhotoStorageService>();
builder.Services.AddScoped<IReminderService, ReminderService>();

// 4. Background Reminder Worker
builder.Services.AddHostedService<BackgroundReminderWorker>();

// 5. Authentication & JWT Bearer
var jwtKey = builder.Configuration["Jwt:Key"] ?? "BodyPowerGym_SuperSecret_SecurityKey_2026_ProdKey_9876543210!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "BodyPowerGymApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "BodyPowerGymPwa";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole(Roles.Admin));
    options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole(Roles.Admin, Roles.Manager));
});

// 6. CORS Policy for PWA Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowPwaClient", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Allow Vite dev server and production origins
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 7. Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// 8. Swagger / OpenAPI Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BodyPower Gym Management API",
        Version = "v1",
        Description = "Production REST API for BodyPower Gym Membership Management Progressive Web App"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Auto-initialize and seed database on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<BodyPowerGymDbContext>();
        var config = services.GetRequiredService<IConfiguration>();
        var hasher = services.GetRequiredService<IPasswordHasher<User>>();
        await DbInitializer.InitializeAsync(context, config, hasher, logger);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing the database.");
    }
}

// Ensure wwwroot/uploads directory exists
var wwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
var uploadsDir = Path.Combine(wwwroot, "uploads", "photos");
Directory.CreateDirectory(uploadsDir);

// Static files for photo uploads
app.UseStaticFiles();

app.UseCors("AllowPwaClient");

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "BodyPower Gym API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 9. Internal Protected Reminder Trigger for Cloud Schedulers (e.g. cron-job.org)
app.MapPost("/api/internal/reminders/run", async (
    HttpContext context,
    IConfiguration config,
    IReminderService reminderService,
    ILogger<Program> logger) =>
{
    var expectedSecret = config["ReminderSecret"] ?? config["REMINDER_SECRET"] ?? "BodyPower_InternalReminderSecret_Key_2026!";
    if (!context.Request.Headers.TryGetValue("X-Reminder-Secret", out var providedSecret) || providedSecret != expectedSecret)
    {
        return Results.Unauthorized();
    }

    try
    {
        var count = await reminderService.ProcessDailyRemindersAsync();
        logger.LogInformation("Internal reminder trigger executed. {Count} notifications created.", count);
        return Results.Ok(new { message = "Reminders executed successfully", count });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error executing internal reminder trigger.");
        return Results.Problem(ex.Message);
    }
});

app.Run();
